// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title ISigilEscrow
/// @notice Interface for the Sigil multi-token escrow + DAO governance contract.
///         A single global escrow instance accepts any ERC-20 and tracks
///         balances per-token. Proposals are scoped to a specific token.
interface ISigilEscrow {
    // ─── Enums ───────────────────────────────────────────

    enum ProposalStatus {
        Voting,          // Initial community vote
        Approved,        // Community approved — awaiting dev completion
        Rejected,        // Community rejected
        Expired,         // Didn't reach quorum
        ProofSubmitted,  // Dev submitted proof — completion vote open
        Completed,       // Completed — tokens released to dev
        Disputed,        // Completion vote failed
        Overridden       // Protocol approved despite dispute
    }

    // ─── Events ──────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed token,
        string title,
        uint256 tokenAmount,
        uint256 targetDate,
        uint256 votingDeadline
    );

    event Voted(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event VotedWithComment(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight,
        string comment
    );

    event ProposalApproved(uint256 indexed proposalId);
    event ProposalRejected(uint256 indexed proposalId);
    event ProposalExpired(uint256 indexed proposalId);

    event ProofSubmitted(uint256 indexed proposalId, string proofUri);

    event CompletionVoted(
        uint256 indexed proposalId,
        address indexed voter,
        bool confirmed,
        uint256 weight
    );

    event ProposalCompleted(uint256 indexed proposalId, uint256 tokensReleased);
    event ProposalDisputed(uint256 indexed proposalId);
    event ProtocolOverride(uint256 indexed proposalId, uint256 tokensReleased);

    event TokensDeposited(address indexed token, address indexed from, uint256 amount);

    // ─── Functions ───────────────────────────────────────

    function deposit(address token, uint256 amount) external;

    function syncBalance(address token) external;

    function createProposal(
        address token,
        string calldata title,
        string calldata description,
        uint256 tokenAmount,
        uint256 targetDate
    ) external returns (uint256 proposalId);

    function vote(uint256 proposalId, bool support) external;

    function voteWithComment(uint256 proposalId, bool support, string calldata comment) external;

    function finalizeVote(uint256 proposalId) external;

    function submitProof(uint256 proposalId, string calldata proofUri) external;

    function voteCompletion(uint256 proposalId, bool confirmed) external;

    function voteCompletionWithComment(uint256 proposalId, bool confirmed, string calldata comment) external;

    function finalizeCompletion(uint256 proposalId) external;

    function protocolOverride(uint256 proposalId) external;
}
