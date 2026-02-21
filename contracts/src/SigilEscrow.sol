// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISigilEscrow} from "./interfaces/ISigilEscrow.sol";

/// @title SigilEscrow
/// @notice Multi-token escrow with DAO governance for milestone-based unlocks.
///
///         A single global escrow instance that accepts ANY ERC-20 token and
///         tracks balances per-token. Native token fees from all Sigil-launched
///         pools accumulate here via the LPLocker's _routeTokenFees().
///
///         Each proposal is scoped to a specific token. Voting weight is based
///         on the voter's balance of THAT token — TOKEN_A holders vote on
///         TOKEN_A proposals, TOKEN_B holders vote on TOKEN_B proposals.
///
///         The developer proposes milestones (product updates, feature releases)
///         and the community votes to approve/reject them.
///
///         Lifecycle:
///           1. Dev/holder creates proposal for a specific token → Voting (5 days)
///           2. Community votes YES/NO (weighted by token balance)
///           3. If approved → Dev works on milestone
///           4. Dev submits proof → CompletionVoting (3 days)
///           5. Community votes on completion
///           6. If confirmed → tokens released to dev
///           7. If disputed → protocol may override
contract SigilEscrow is ISigilEscrow {
    // ─── Constants ───────────────────────────────────────

    /// @notice 0.05% of total supply needed to create a proposal
    uint256 public constant PROPOSAL_THRESHOLD_BPS = 5;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @notice 4% of total supply must vote for quorum
    uint256 public constant QUORUM_BPS = 400;

    /// @notice Voting duration: 5 days for initial, 3 days for completion
    uint256 public constant VOTING_PERIOD = 5 days;
    uint256 public constant COMPLETION_VOTING_PERIOD = 3 days;

    // ─── State ───────────────────────────────────────────

    address public devWallet;
    address public protocol;
    uint256 public proposalCount;

    /// @notice Per-token escrow balances: token → amount
    mapping(address => uint256) public escrowBalances;

    // ─── Proposal Storage (split to avoid stack-too-deep) ─

    /// @notice Core proposal data
    struct ProposalCore {
        address proposer;
        address token;
        uint256 tokenAmount;
        uint256 targetDate;
        ProposalStatus status;
        uint256 snapshotBlock;
        uint256 snapshotTotalSupply;
    }

    /// @notice Voting data for a proposal
    struct ProposalVotes {
        uint256 votingDeadline;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 completionDeadline;
        uint256 completionYes;
        uint256 completionNo;
    }

    mapping(uint256 => ProposalCore) public proposalCores;
    mapping(uint256 => ProposalVotes) public proposalVotes;
    mapping(uint256 => string) public proposalTitles;
    mapping(uint256 => string) public proposalDescriptions;
    mapping(uint256 => string) public proposalProofs;

    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(uint256 => mapping(address => bool)) public hasVotedCompletion;

    // ─── Errors ──────────────────────────────────────────

    error BelowThreshold();
    error InvalidAmount();
    error InvalidTargetDate();
    error ProposalNotInStatus(ProposalStatus expected, ProposalStatus actual);
    error VotingNotEnded();
    error VotingEnded();
    error AlreadyVoted();
    error OnlyDev();
    error OnlyProtocol();
    error OnlyCompletionOverride();
    error InsufficientEscrowBalance();
    error ZeroAddress();

    // ─── Constructor ─────────────────────────────────────

    constructor(address _devWallet, address _protocol) {
        if (_devWallet == address(0) || _protocol == address(0)) {
            revert ZeroAddress();
        }
        devWallet = _devWallet;
        protocol = _protocol;
    }

    // ─── Deposit ─────────────────────────────────────────

    /// @notice Deposit tokens into escrow via transferFrom.
    /// @param token The ERC-20 token to deposit
    /// @param amount The amount to deposit
    function deposit(address token, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        if (token == address(0)) revert ZeroAddress();
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        escrowBalances[token] += amount;
        emit TokensDeposited(token, msg.sender, amount);
    }

    /// @notice Sync balance for direct transfers (e.g., from LPLocker's _routeTokenFees)
    /// @param token The ERC-20 token to sync
    function syncBalance(address token) external {
        if (token == address(0)) revert ZeroAddress();
        uint256 actual = IERC20(token).balanceOf(address(this));
        uint256 tracked = escrowBalances[token];
        if (actual > tracked) {
            uint256 diff = actual - tracked;
            escrowBalances[token] = actual;
            emit TokensDeposited(token, address(0), diff);
        }
    }

    // ─── Proposal Creation ───────────────────────────────

    /// @notice Create a milestone proposal for a specific token's escrow balance.
    /// @param token The ERC-20 token to propose unlocking
    /// @param title Human-readable title
    /// @param description Detailed description of the milestone
    /// @param tokenAmount How many tokens to release on completion
    /// @param targetDate Expected completion date
    function createProposal(
        address token,
        string calldata title,
        string calldata description,
        uint256 tokenAmount,
        uint256 targetDate
    ) external returns (uint256 proposalId) {
        if (token == address(0)) revert ZeroAddress();

        uint256 supply = IERC20(token).totalSupply();

        // Dev can always propose; others need 0.05% of supply
        if (msg.sender != devWallet) {
            uint256 threshold = supply * PROPOSAL_THRESHOLD_BPS / BPS_DENOMINATOR;
            if (IERC20(token).balanceOf(msg.sender) < threshold) revert BelowThreshold();
        }
        if (tokenAmount == 0 || tokenAmount > escrowBalances[token]) revert InvalidAmount();
        if (targetDate <= block.timestamp) revert InvalidTargetDate();

        proposalId = ++proposalCount;

        proposalCores[proposalId] = ProposalCore({
            proposer: msg.sender,
            token: token,
            tokenAmount: tokenAmount,
            targetDate: targetDate,
            status: ProposalStatus.Voting,
            snapshotBlock: block.number,
            snapshotTotalSupply: supply
        });

        proposalVotes[proposalId].votingDeadline = block.timestamp + VOTING_PERIOD;
        proposalTitles[proposalId] = title;
        proposalDescriptions[proposalId] = description;

        emit ProposalCreated(
            proposalId, msg.sender, token, title, tokenAmount,
            targetDate, block.timestamp + VOTING_PERIOD
        );
    }

    // ─── Initial Voting ──────────────────────────────────

    function vote(uint256 proposalId, bool support) external {
        _vote(proposalId, support);
    }

    function voteWithComment(uint256 proposalId, bool support, string calldata comment) external {
        uint256 weight = _vote(proposalId, support);
        emit VotedWithComment(proposalId, msg.sender, support, weight, comment);
    }

    function _vote(uint256 proposalId, bool support) internal returns (uint256 weight) {
        ProposalCore storage core = proposalCores[proposalId];
        ProposalVotes storage v = proposalVotes[proposalId];

        if (core.status != ProposalStatus.Voting) {
            revert ProposalNotInStatus(ProposalStatus.Voting, core.status);
        }
        if (block.timestamp >= v.votingDeadline) revert VotingEnded();
        if (hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        // Voting weight = voter's balance of the proposal's target token
        weight = IERC20(core.token).balanceOf(msg.sender);
        if (weight == 0) revert BelowThreshold();

        hasVoted[proposalId][msg.sender] = true;

        if (support) {
            v.yesVotes += weight;
        } else {
            v.noVotes += weight;
        }

        emit Voted(proposalId, msg.sender, support, weight);
    }

    function finalizeVote(uint256 proposalId) external {
        ProposalCore storage core = proposalCores[proposalId];
        ProposalVotes storage v = proposalVotes[proposalId];

        if (core.status != ProposalStatus.Voting) {
            revert ProposalNotInStatus(ProposalStatus.Voting, core.status);
        }
        if (block.timestamp < v.votingDeadline) revert VotingNotEnded();

        uint256 totalVotesCast = v.yesVotes + v.noVotes;
        uint256 quorum = core.snapshotTotalSupply * QUORUM_BPS / BPS_DENOMINATOR;

        if (totalVotesCast < quorum) {
            core.status = ProposalStatus.Expired;
            emit ProposalExpired(proposalId);
        } else if (v.yesVotes > v.noVotes) {
            core.status = ProposalStatus.Approved;
            emit ProposalApproved(proposalId);
        } else {
            core.status = ProposalStatus.Rejected;
            emit ProposalRejected(proposalId);
        }
    }

    // ─── Completion Phase ────────────────────────────────

    function submitProof(uint256 proposalId, string calldata proofUri) external {
        if (msg.sender != devWallet) revert OnlyDev();
        ProposalCore storage core = proposalCores[proposalId];
        if (core.status != ProposalStatus.Approved) {
            revert ProposalNotInStatus(ProposalStatus.Approved, core.status);
        }

        proposalProofs[proposalId] = proofUri;
        core.status = ProposalStatus.ProofSubmitted;
        proposalVotes[proposalId].completionDeadline = block.timestamp + COMPLETION_VOTING_PERIOD;

        emit ProofSubmitted(proposalId, proofUri);
    }

    function voteCompletion(uint256 proposalId, bool confirmed) external {
        _voteCompletion(proposalId, confirmed);
    }

    function voteCompletionWithComment(
        uint256 proposalId,
        bool confirmed,
        string calldata comment
    ) external {
        uint256 weight = _voteCompletion(proposalId, confirmed);
        emit VotedWithComment(proposalId, msg.sender, confirmed, weight, comment);
    }

    function _voteCompletion(uint256 proposalId, bool confirmed) internal returns (uint256 weight) {
        ProposalCore storage core = proposalCores[proposalId];
        ProposalVotes storage v = proposalVotes[proposalId];

        if (core.status != ProposalStatus.ProofSubmitted) {
            revert ProposalNotInStatus(ProposalStatus.ProofSubmitted, core.status);
        }
        if (block.timestamp >= v.completionDeadline) revert VotingEnded();
        if (hasVotedCompletion[proposalId][msg.sender]) revert AlreadyVoted();

        // Voting weight = voter's balance of the proposal's target token
        weight = IERC20(core.token).balanceOf(msg.sender);
        if (weight == 0) revert BelowThreshold();

        hasVotedCompletion[proposalId][msg.sender] = true;

        if (confirmed) {
            v.completionYes += weight;
        } else {
            v.completionNo += weight;
        }

        emit CompletionVoted(proposalId, msg.sender, confirmed, weight);
    }

    function finalizeCompletion(uint256 proposalId) external {
        ProposalCore storage core = proposalCores[proposalId];
        ProposalVotes storage v = proposalVotes[proposalId];

        if (core.status != ProposalStatus.ProofSubmitted) {
            revert ProposalNotInStatus(ProposalStatus.ProofSubmitted, core.status);
        }
        if (block.timestamp < v.completionDeadline) revert VotingNotEnded();

        uint256 totalVotesCast = v.completionYes + v.completionNo;
        uint256 quorum = core.snapshotTotalSupply * QUORUM_BPS / BPS_DENOMINATOR;

        if (totalVotesCast >= quorum && v.completionYes > v.completionNo) {
            core.status = ProposalStatus.Completed;
            _releaseTokens(core.token, core.tokenAmount);
            emit ProposalCompleted(proposalId, core.tokenAmount);
        } else {
            core.status = ProposalStatus.Disputed;
            emit ProposalDisputed(proposalId);
        }
    }

    // ─── Protocol Override ───────────────────────────────

    function protocolOverride(uint256 proposalId) external {
        if (msg.sender != protocol) revert OnlyProtocol();
        ProposalCore storage core = proposalCores[proposalId];
        if (core.status != ProposalStatus.Disputed) revert OnlyCompletionOverride();

        core.status = ProposalStatus.Overridden;
        _releaseTokens(core.token, core.tokenAmount);
        emit ProtocolOverride(proposalId, core.tokenAmount);
    }

    // ─── Internal ────────────────────────────────────────

    function _releaseTokens(address token, uint256 amount) internal {
        if (amount > escrowBalances[token]) revert InsufficientEscrowBalance();
        escrowBalances[token] -= amount;
        IERC20(token).transfer(devWallet, amount);
    }

    // ─── Admin ───────────────────────────────────────────

    function setDevWallet(address newDev) external {
        if (msg.sender != protocol) revert OnlyProtocol();
        if (newDev == address(0)) revert ZeroAddress();
        devWallet = newDev;
    }

    function setProtocol(address newProtocol) external {
        if (msg.sender != protocol) revert OnlyProtocol();
        if (newProtocol == address(0)) revert ZeroAddress();
        protocol = newProtocol;
    }

    // ─── Views ───────────────────────────────────────────

    function getProposalCore(uint256 proposalId) external view returns (
        address proposer,
        address token,
        uint256 tokenAmount,
        uint256 targetDate,
        ProposalStatus status,
        uint256 snapshotBlock,
        uint256 snapshotTotalSupply
    ) {
        ProposalCore storage c = proposalCores[proposalId];
        return (c.proposer, c.token, c.tokenAmount, c.targetDate, c.status, c.snapshotBlock, c.snapshotTotalSupply);
    }

    function getProposalVotes(uint256 proposalId) external view returns (
        uint256 votingDeadline,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 completionDeadline,
        uint256 completionYes,
        uint256 completionNo
    ) {
        ProposalVotes storage v = proposalVotes[proposalId];
        return (v.votingDeadline, v.yesVotes, v.noVotes, v.completionDeadline, v.completionYes, v.completionNo);
    }

    function getProposalText(uint256 proposalId) external view returns (
        string memory title,
        string memory description,
        string memory proofUri
    ) {
        return (proposalTitles[proposalId], proposalDescriptions[proposalId], proposalProofs[proposalId]);
    }

    /// @notice Get the escrow balance for a specific token
    function getEscrowBalance(address token) external view returns (uint256) {
        return escrowBalances[token];
    }

    /// @notice Proposal threshold for a specific token
    function proposalThreshold(address token) external view returns (uint256) {
        return IERC20(token).totalSupply() * PROPOSAL_THRESHOLD_BPS / BPS_DENOMINATOR;
    }

    /// @notice Quorum threshold for a specific token
    function quorumThreshold(address token) external view returns (uint256) {
        return IERC20(token).totalSupply() * QUORUM_BPS / BPS_DENOMINATOR;
    }
}
