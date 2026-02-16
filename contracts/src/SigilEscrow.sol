// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ISigilEscrow} from "./interfaces/ISigilEscrow.sol";

/// @title SigilEscrow
/// @notice Token escrow with DAO governance for milestone-based token unlocks.
///
///         Each Sigil-launched token gets its own escrow instance. Native token
///         fees from swaps accumulate here. The developer proposes milestones
///         (product updates, feature releases) and the community votes to
///         approve/reject them.
///
///         After completion, the dev submits proof and the community votes on
///         whether the milestone was actually delivered. If the community
///         unfairly disputes a legitimate completion, the protocol can override.
///
///         Lifecycle:
///           1. Dev/holder creates proposal → Voting (5 days)
///           2. Community votes YES/NO (with optional comments)
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

    /// @notice 4% of circulating supply must vote for quorum
    uint256 public constant QUORUM_BPS = 400;

    /// @notice Voting duration: 5 days for initial, 3 days for completion
    uint256 public constant VOTING_PERIOD = 5 days;
    uint256 public constant COMPLETION_VOTING_PERIOD = 3 days;

    // ─── State ───────────────────────────────────────────

    IERC20 public immutable token;
    uint256 public immutable totalSupply;
    address public devWallet;
    address public protocol;
    uint256 public escrowBalance;
    uint256 public proposalCount;

    // ─── Proposal Storage (split to avoid stack-too-deep) ─

    /// @notice Core proposal data
    struct ProposalCore {
        address proposer;
        uint256 tokenAmount;
        uint256 targetDate;
        ProposalStatus status;
        uint256 snapshotBlock;
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

    constructor(address _token, address _devWallet, address _protocol) {
        if (_token == address(0) || _devWallet == address(0) || _protocol == address(0)) {
            revert ZeroAddress();
        }
        token = IERC20(_token);
        totalSupply = IERC20(_token).totalSupply();
        devWallet = _devWallet;
        protocol = _protocol;
    }

    // ─── Deposit ─────────────────────────────────────────

    function deposit(uint256 amount) external {
        if (amount == 0) revert InvalidAmount();
        token.transferFrom(msg.sender, address(this), amount);
        escrowBalance += amount;
        emit TokensDeposited(msg.sender, amount);
    }

    /// @notice Sync balance for direct transfers (e.g., from hook)
    function syncBalance() external {
        uint256 actual = token.balanceOf(address(this));
        if (actual > escrowBalance) {
            uint256 diff = actual - escrowBalance;
            escrowBalance = actual;
            emit TokensDeposited(address(0), diff);
        }
    }

    // ─── Proposal Creation ───────────────────────────────

    function createProposal(
        string calldata title,
        string calldata description,
        uint256 tokenAmount,
        uint256 targetDate
    ) external returns (uint256 proposalId) {
        // Dev can always propose; others need 0.05% of supply
        if (msg.sender != devWallet) {
            uint256 threshold = totalSupply * PROPOSAL_THRESHOLD_BPS / BPS_DENOMINATOR;
            if (token.balanceOf(msg.sender) < threshold) revert BelowThreshold();
        }
        if (tokenAmount == 0 || tokenAmount > escrowBalance) revert InvalidAmount();
        if (targetDate <= block.timestamp) revert InvalidTargetDate();

        proposalId = ++proposalCount;

        proposalCores[proposalId] = ProposalCore({
            proposer: msg.sender,
            tokenAmount: tokenAmount,
            targetDate: targetDate,
            status: ProposalStatus.Voting,
            snapshotBlock: block.number
        });

        proposalVotes[proposalId].votingDeadline = block.timestamp + VOTING_PERIOD;
        proposalTitles[proposalId] = title;
        proposalDescriptions[proposalId] = description;

        emit ProposalCreated(
            proposalId, msg.sender, title, tokenAmount,
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

        weight = token.balanceOf(msg.sender);
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
        uint256 quorum = totalSupply * QUORUM_BPS / BPS_DENOMINATOR;

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

        weight = token.balanceOf(msg.sender);
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
        uint256 quorum = totalSupply * QUORUM_BPS / BPS_DENOMINATOR;

        if (totalVotesCast >= quorum && v.completionYes > v.completionNo) {
            core.status = ProposalStatus.Completed;
            _releaseTokens(core.tokenAmount);
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
        _releaseTokens(core.tokenAmount);
        emit ProtocolOverride(proposalId, core.tokenAmount);
    }

    // ─── Internal ────────────────────────────────────────

    function _releaseTokens(uint256 amount) internal {
        if (amount > escrowBalance) revert InsufficientEscrowBalance();
        escrowBalance -= amount;
        token.transfer(devWallet, amount);
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
        uint256 tokenAmount,
        uint256 targetDate,
        ProposalStatus status,
        uint256 snapshotBlock
    ) {
        ProposalCore storage c = proposalCores[proposalId];
        return (c.proposer, c.tokenAmount, c.targetDate, c.status, c.snapshotBlock);
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

    function proposalThreshold() external view returns (uint256) {
        return totalSupply * PROPOSAL_THRESHOLD_BPS / BPS_DENOMINATOR;
    }

    function quorumThreshold() external view returns (uint256) {
        return totalSupply * QUORUM_BPS / BPS_DENOMINATOR;
    }
}
