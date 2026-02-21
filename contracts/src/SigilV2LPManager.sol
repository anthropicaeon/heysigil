// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;


// ─── Minimal V3 Interfaces ─────────────────────────────

interface INonfungiblePositionManager {
    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }

    function collect(CollectParams calldata params)
        external
        payable
        returns (uint256 amount0, uint256 amount1);

    function ownerOf(uint256 tokenId) external view returns (address);

    function positions(uint256 tokenId)
        external
        view
        returns (
            uint96 nonce,
            address operator,
            address token0,
            address token1,
            uint24 fee,
            int24 tickLower,
            int24 tickUpper,
            uint128 liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );

    function transferFrom(address from, address to, uint256 tokenId) external;
}

/// @title SigilV2LPManager
/// @notice Holds Uniswap V3 LP NFTs for the V2 SIGIL token with:
///         - sweepFees() — collect fees from all positions to owner in one call
///         - emergencyWithdraw() — owner can pull NFTs out if needed
///         - 2-step ownership transfer
///         - pause/unpause on fee sweeping
///
///         Unlike SigilLPLocker (permanent lock, factory-gated, FeeVault routing),
///         this contract is purpose-built for the V2 SIGIL deployer's own LP.
contract SigilV2LPManager {
    // ─── State ───────────────────────────────────────────

    INonfungiblePositionManager public immutable positionManager;
    address public immutable v2Token;
    address public owner;
    address public pendingOwner;
    bool public paused;

    /// @notice Tracked position data
    struct Position {
        address token0;
        address token1;
        bool active;
    }

    /// @notice tokenId → position info
    mapping(uint256 => Position) public positions;

    /// @notice All tracked token IDs (for sweepFees iteration)
    uint256[] public positionIds;

    // ─── Events ──────────────────────────────────────────

    event PositionRegistered(uint256 indexed tokenId, address token0, address token1);
    event PositionWithdrawn(uint256 indexed tokenId, address indexed to);
    event FeesSwept(uint256 indexed tokenId, address token0, uint256 amount0, address token1, uint256 amount1);
    event OwnershipTransferStarted(address indexed currentOwner, address indexed newOwner);
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

    // ─── Errors ──────────────────────────────────────────

    error OnlyOwner();
    error OnlyPendingOwner();
    error ZeroAddress();
    error PositionNotActive();
    error AlreadyRegistered();
    error NftNotOwned();
    error NotExpectedPair();
    error ContractPaused();
    error ContractNotPaused();

    // ─── Constructor ─────────────────────────────────────

    constructor(address _positionManager, address _v2Token) {
        if (_positionManager == address(0) || _v2Token == address(0)) revert ZeroAddress();
        positionManager = INonfungiblePositionManager(_positionManager);
        v2Token = _v2Token;
        owner = msg.sender;
    }

    // ─── Modifiers ───────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // ─── Position Management ─────────────────────────────

    /// @notice Register an LP NFT that this contract already holds.
    ///         Verifies ownership on-chain per security patterns.
    /// @param tokenId The V3 NFT token ID
    function registerPosition(uint256 tokenId) external onlyOwner {
        if (positions[tokenId].active) revert AlreadyRegistered();
        if (positionManager.ownerOf(tokenId) != address(this)) revert NftNotOwned();

        // Read token0/token1 from the NFT position
        (, , address token0, address token1, , , , , , , , ) = positionManager.positions(tokenId);

        // Pair validation: at least one token must be the V2 SIGIL token
        if (token0 != v2Token && token1 != v2Token) revert NotExpectedPair();

        positions[tokenId] = Position({
            token0: token0,
            token1: token1,
            active: true
        });
        positionIds.push(tokenId);

        emit PositionRegistered(tokenId, token0, token1);
    }

    /// @notice Emergency withdraw — pull an NFT out of the contract.
    ///         Works even when paused. Removes position from tracking.
    /// @param tokenId The V3 NFT token ID
    /// @param to Recipient address
    function emergencyWithdraw(uint256 tokenId, address to) external onlyOwner {
        if (to == address(0)) revert ZeroAddress();
        if (!positions[tokenId].active) revert PositionNotActive();

        // Mark inactive before external call (CEI)
        positions[tokenId].active = false;

        // Remove from positionIds array (swap-and-pop)
        _removePositionId(tokenId);

        // Transfer NFT out
        positionManager.transferFrom(address(this), to, tokenId);

        emit PositionWithdrawn(tokenId, to);
    }

    // ─── Fee Sweeping ────────────────────────────────────

    /// @notice Collect fees from ALL active positions and send to owner.
    ///         Single call to sweep everything.
    function sweepFees() external whenNotPaused {
        address recipient = owner;
        uint256 len = positionIds.length;

        for (uint256 i; i < len; ++i) {
            uint256 tokenId = positionIds[i];
            Position storage pos = positions[tokenId];
            if (!pos.active) continue;

            (uint256 amount0, uint256 amount1) = positionManager.collect(
                INonfungiblePositionManager.CollectParams({
                    tokenId: tokenId,
                    recipient: recipient,
                    amount0Max: type(uint128).max,
                    amount1Max: type(uint128).max
                })
            );

            if (amount0 > 0 || amount1 > 0) {
                emit FeesSwept(tokenId, pos.token0, amount0, pos.token1, amount1);
            }
        }
    }

    /// @notice Collect fees from a single position and send to owner.
    /// @param tokenId The V3 NFT token ID
    function sweepFees(uint256 tokenId) external whenNotPaused {
        Position storage pos = positions[tokenId];
        if (!pos.active) revert PositionNotActive();

        (uint256 amount0, uint256 amount1) = positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: owner,
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        if (amount0 > 0 || amount1 > 0) {
            emit FeesSwept(tokenId, pos.token0, amount0, pos.token1, amount1);
        }
    }

    // ─── Internal ────────────────────────────────────────

    /// @dev Remove a tokenId from positionIds via swap-and-pop.
    function _removePositionId(uint256 tokenId) internal {
        uint256 len = positionIds.length;
        for (uint256 i; i < len; ++i) {
            if (positionIds[i] == tokenId) {
                positionIds[i] = positionIds[len - 1];
                positionIds.pop();
                return;
            }
        }
    }

    // ─── Ownership (2-step transfer) ────────────────────

    /// @notice Start ownership transfer. New owner must call acceptOwnership().
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Accept ownership transfer. Must be called by the pending owner.
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert OnlyPendingOwner();
        emit OwnerTransferred(owner, msg.sender);
        owner = msg.sender;
        pendingOwner = address(0);
    }

    // ─── Pausable ────────────────────────────────────────

    /// @notice Pause fee sweeping. Emergency use only.
    function pause() external onlyOwner {
        if (paused) revert ContractPaused();
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Resume fee sweeping.
    function unpause() external onlyOwner {
        if (!paused) revert ContractNotPaused();
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ─── Views ───────────────────────────────────────────

    /// @notice Number of active tracked positions.
    function getPositionCount() external view returns (uint256) {
        return positionIds.length;
    }

    /// @notice Get all tracked position token IDs.
    function getAllPositionIds() external view returns (uint256[] memory) {
        return positionIds;
    }

    /// @notice Check if a position is actively tracked.
    function isActive(uint256 tokenId) external view returns (bool) {
        return positions[tokenId].active;
    }

    // ─── ERC721 Receiver ─────────────────────────────────

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
