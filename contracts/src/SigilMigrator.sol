// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title SigilMigrator
/// @notice Swap contract for V1 HeySigil → V2 SIGIL token migration.
///         Only snapshotted addresses can migrate, up to their allocation.
///         Owner can emergency-withdraw any tokens for burn or redistribution.
contract SigilMigrator {

    // ─── State ───────────────────────────────────────────

    address public immutable v1Token;
    address public immutable v2Token;
    address public owner;
    address public pendingOwner;
    bool public paused;
    bool private _locked;

    /// @notice Max V2 claimable per address (set from snapshot)
    mapping(address => uint256) public allocation;

    /// @notice V2 already claimed per address
    mapping(address => uint256) public claimed;

    // ─── Events ──────────────────────────────────────────

    event Migrated(address indexed user, uint256 amount);
    event AllocationSet(address indexed user, uint256 amount);
    event V1Withdrawn(uint256 amount, address indexed to);
    event V2Withdrawn(uint256 amount, address indexed to);
    event Paused();
    event Unpaused();
    event OwnershipTransferStarted(address indexed currentOwner, address indexed pendingOwner);
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);

    // ─── Errors ──────────────────────────────────────────

    error OnlyOwner();
    error ZeroAddress();
    error ZeroAmount();
    error IsPaused();
    error NotWhitelisted();
    error ExceedsAllocation();
    error TransferFailed();
    error LengthMismatch();
    error Reentrancy();
    error NotPendingOwner();

    // ─── Constructor ─────────────────────────────────────

    constructor(address _v1Token, address _v2Token) {
        if (_v1Token == address(0) || _v2Token == address(0)) revert ZeroAddress();
        v1Token = _v1Token;
        v2Token = _v2Token;
        owner = msg.sender;
    }

    // ─── Modifiers ───────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert IsPaused();
        _;
    }

    modifier nonReentrant() {
        if (_locked) revert Reentrancy();
        _locked = true;
        _;
        _locked = false;
    }

    // ─── Migration ───────────────────────────────────────

    /// @notice Migrate V1 tokens to V2. Caller must have approved this contract for V1.
    /// @param amount Number of tokens to migrate (1:1 swap)
    function migrate(uint256 amount) external whenNotPaused nonReentrant {
        if (amount == 0) revert ZeroAmount();

        uint256 remaining = allocation[msg.sender] - claimed[msg.sender];
        if (remaining == 0) revert NotWhitelisted();
        if (amount > remaining) revert ExceedsAllocation();

        // Update state before external calls (CEI)
        claimed[msg.sender] += amount;

        // Pull V1 from user
        (bool pullOk, bytes memory pullResult) = v1Token.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount)
        );
        if (!pullOk || (pullResult.length > 0 && !abi.decode(pullResult, (bool)))) {
            revert TransferFailed();
        }

        // Send V2 to user
        (bool sendOk, bytes memory sendResult) = v2Token.call(
            abi.encodeWithSignature("transfer(address,uint256)", msg.sender, amount)
        );
        if (!sendOk || (sendResult.length > 0 && !abi.decode(sendResult, (bool)))) {
            revert TransferFailed();
        }

        emit Migrated(msg.sender, amount);
    }

    // ─── Admin: Allocations ──────────────────────────────

    /// @notice Set the V2 allocation for a single address
    function setAllocation(address user, uint256 amount) external onlyOwner {
        if (user == address(0)) revert ZeroAddress();
        allocation[user] = amount;
        emit AllocationSet(user, amount);
    }

    /// @notice Batch-set allocations from snapshot data
    function setAllocations(address[] calldata users, uint256[] calldata amounts) external onlyOwner {
        if (users.length != amounts.length) revert LengthMismatch();

        for (uint256 i; i < users.length; ++i) {
            if (users[i] == address(0)) revert ZeroAddress();
            allocation[users[i]] = amounts[i];
            emit AllocationSet(users[i], amounts[i]);
        }
    }

    // ─── Admin: Emergency Withdraw ─────────────────────────
    //     Callable at any time, regardless of pause state.

    /// @notice Withdraw V1 tokens from the contract (e.g. received during migration).
    function withdrawV1(uint256 amount, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        (bool ok, bytes memory result) = v1Token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        if (!ok || (result.length > 0 && !abi.decode(result, (bool)))) {
            revert TransferFailed();
        }

        emit V1Withdrawn(amount, to);
    }

    /// @notice Withdraw V2 tokens from the contract (e.g. burn unclaimed, manual redistribution).
    function withdrawV2(uint256 amount, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        (bool ok, bytes memory result) = v2Token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        if (!ok || (result.length > 0 && !abi.decode(result, (bool)))) {
            revert TransferFailed();
        }

        emit V2Withdrawn(amount, to);
    }

    // ─── Admin: Pause ────────────────────────────────────

    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }

    // ─── Admin: Ownership (2-step) ───────────────────────

    /// @notice Start ownership transfer. New owner must call acceptOwnership().
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Accept ownership transfer. Must be called by the pending owner.
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingOwner();
        emit OwnerTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    // ─── Views ───────────────────────────────────────────

    /// @notice How many V2 tokens a user can still claim
    function claimable(address user) external view returns (uint256) {
        uint256 alloc = allocation[user];
        uint256 used = claimed[user];
        return alloc > used ? alloc - used : 0;
    }
}
