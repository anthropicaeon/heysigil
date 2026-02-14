// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEAS, Attestation} from "./interfaces/IEAS.sol";
import {IERC20} from "./interfaces/IERC20.sol";

/**
 * @title PoolReward
 * @notice Allows verified project owners to claim pool rewards using EAS attestations.
 *
 * Flow:
 * 1. Token deployers create reward pools for projects (keyed by projectId hash)
 * 2. Project owners verify their identity off-chain (GitHub, domain, tweet, etc.)
 * 3. The trusted verifier creates an EAS attestation linking wallet → project
 * 4. Project owner calls claimReward(attestationUID) to receive tokens
 *
 * The contract reads the EAS attestation on-chain to verify the claim is legitimate.
 */
contract PoolReward {
    // ─── State ────────────────────────────────────────────

    IEAS public immutable eas;
    address public immutable trustedAttester;
    bytes32 public immutable schemaUid;
    address public owner;

    struct Pool {
        address token;
        uint256 balance;
        bool claimed;
        address claimedBy;
    }

    /// @notice projectId hash → Pool
    mapping(bytes32 => Pool) public pools;

    // ─── Events ───────────────────────────────────────────

    event PoolCreated(bytes32 indexed projectHash, string projectId, address token, uint256 amount);
    event RewardClaimed(bytes32 indexed projectHash, address indexed claimant, address token, uint256 amount, bytes32 attestationUid);
    event PoolToppedUp(bytes32 indexed projectHash, uint256 amount);

    // ─── Errors ───────────────────────────────────────────

    error UntrustedAttester(address attester);
    error NotRecipient(address expected, address actual);
    error AttestationRevoked();
    error NotProjectOwner();
    error WrongSchema(bytes32 expected, bytes32 actual);
    error PoolAlreadyClaimed();
    error PoolEmpty();
    error PoolNotFound();
    error TransferFailed();
    error OnlyOwner();

    // ─── Constructor ──────────────────────────────────────

    /**
     * @param _eas Address of the EAS contract on this chain
     * @param _trustedAttester Address of the backend signer that creates attestations
     * @param _schemaUid EAS schema UID for the pool claim verification schema
     */
    constructor(address _eas, address _trustedAttester, bytes32 _schemaUid) {
        eas = IEAS(_eas);
        trustedAttester = _trustedAttester;
        schemaUid = _schemaUid;
        owner = msg.sender;
    }

    // ─── Pool Management ─────────────────────────────────

    /**
     * @notice Create a reward pool for a project.
     * @param projectId The canonical project identifier (e.g., "github.com/org/repo")
     * @param token ERC20 token address for the reward
     * @param amount Amount of tokens to deposit into the pool
     */
    function createPool(string calldata projectId, address token, uint256 amount) external {
        bytes32 projectHash = keccak256(abi.encodePacked(projectId));

        // Transfer tokens into this contract
        bool success = IERC20(token).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        pools[projectHash].token = token;
        pools[projectHash].balance += amount;

        emit PoolCreated(projectHash, projectId, token, amount);
    }

    /**
     * @notice Top up an existing pool with more tokens.
     */
    function topUpPool(string calldata projectId, uint256 amount) external {
        bytes32 projectHash = keccak256(abi.encodePacked(projectId));
        Pool storage pool = pools[projectHash];
        if (pool.token == address(0)) revert PoolNotFound();

        bool success = IERC20(pool.token).transferFrom(msg.sender, address(this), amount);
        if (!success) revert TransferFailed();

        pool.balance += amount;
        emit PoolToppedUp(projectHash, amount);
    }

    // ─── Claiming ─────────────────────────────────────────

    /**
     * @notice Claim pool rewards using an EAS attestation.
     * @param attestationUid The UID of the EAS attestation proving project ownership
     *
     * The attestation must:
     * - Be created by the trustedAttester
     * - Have the caller as the recipient
     * - Not be revoked
     * - Use the correct schema
     * - Attest isOwner == true
     * - Reference a project that has an unclaimed pool
     */
    function claimReward(bytes32 attestationUid) external {
        Attestation memory att = eas.getAttestation(attestationUid);

        // Verify attestation integrity
        if (att.attester != trustedAttester) revert UntrustedAttester(att.attester);
        if (att.recipient != msg.sender) revert NotRecipient(att.recipient, msg.sender);
        if (att.revocationTime > 0) revert AttestationRevoked();
        if (att.schema != schemaUid) revert WrongSchema(schemaUid, att.schema);

        // Decode attestation data
        // Schema: "string platform, string projectId, address wallet, uint64 verifiedAt, bool isOwner"
        (
            , // string platform (unused in contract logic)
            string memory projectId,
            , // address wallet (already checked via recipient)
            , // uint64 verifiedAt (unused)
            bool isOwner
        ) = abi.decode(att.data, (string, string, address, uint64, bool));

        if (!isOwner) revert NotProjectOwner();

        bytes32 projectHash = keccak256(abi.encodePacked(projectId));
        Pool storage pool = pools[projectHash];

        if (pool.token == address(0)) revert PoolNotFound();
        if (pool.claimed) revert PoolAlreadyClaimed();
        if (pool.balance == 0) revert PoolEmpty();

        // Mark as claimed and transfer
        pool.claimed = true;
        pool.claimedBy = msg.sender;
        uint256 amount = pool.balance;
        pool.balance = 0;

        bool success = IERC20(pool.token).transfer(msg.sender, amount);
        if (!success) revert TransferFailed();

        emit RewardClaimed(projectHash, msg.sender, pool.token, amount, attestationUid);
    }

    // ─── Views ────────────────────────────────────────────

    /**
     * @notice Check pool status for a project.
     */
    function getPool(string calldata projectId) external view returns (
        address token,
        uint256 balance,
        bool claimed,
        address claimedBy
    ) {
        bytes32 projectHash = keccak256(abi.encodePacked(projectId));
        Pool storage pool = pools[projectHash];
        return (pool.token, pool.balance, pool.claimed, pool.claimedBy);
    }

    /**
     * @notice Emergency withdraw for contract owner (only unclaimed pools).
     */
    function emergencyWithdraw(string calldata projectId, address to) external {
        if (msg.sender != owner) revert OnlyOwner();

        bytes32 projectHash = keccak256(abi.encodePacked(projectId));
        Pool storage pool = pools[projectHash];

        if (pool.token == address(0)) revert PoolNotFound();
        if (pool.claimed) revert PoolAlreadyClaimed();

        uint256 amount = pool.balance;
        pool.balance = 0;

        bool success = IERC20(pool.token).transfer(to, amount);
        if (!success) revert TransferFailed();
    }
}
