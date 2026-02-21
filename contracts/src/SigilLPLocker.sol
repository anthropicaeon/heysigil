// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
}

interface ISigilFeeVaultV3 {
    function depositFees(
        bytes32 poolId,
        address dev,
        address token,
        uint256 devAmount,
        uint256 protocolAmount
    ) external;
}

/// @title SigilLPLocker
/// @notice Permanently locks Uniswap V3 LP NFTs and enables fee collection.
///
///         The Locker is the V3 equivalent of the V4 SigilHook's fee role:
///         - Holds LP NFTs forever (cannot be removed)
///         - Anyone can trigger fee collection via collectFees()
///         - Collected fees are split 80/20 and deposited to SigilFeeVault
///
///         This contract implements IERC721Receiver to accept NFT transfers.
contract SigilLPLocker {
    // ─── Constants ───────────────────────────────────────

    /// @notice Dev gets 80% of collected fees
    uint256 public constant DEV_SHARE_BPS = 8_000;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    // ─── State ───────────────────────────────────────────

    INonfungiblePositionManager public immutable positionManager;
    ISigilFeeVaultV3 public feeVault;
    address public immutable factory;
    address public immutable usdc;
    address public tokenEscrow;
    address public owner;
    address public pendingOwner;
    bool public paused;

    /// @notice Locked position data
    struct LockedPosition {
        bytes32 poolId;
        address dev;
        address token0;
        address token1;
        bool locked;
    }

    /// @notice tokenId → locked position info
    mapping(uint256 => LockedPosition) public positions;

    /// @notice All locked token IDs
    uint256[] public lockedTokenIds;

    // ─── Events ──────────────────────────────────────────

    event PositionLocked(uint256 indexed tokenId, bytes32 indexed poolId, address dev);
    event FeesCollected(
        uint256 indexed tokenId,
        bytes32 indexed poolId,
        address token0,
        uint256 amount0,
        address token1,
        uint256 amount1
    );
    event DevUpdated(uint256 indexed tokenId, address oldDev, address newDev);
    event NativeTokenEscrowed(uint256 indexed tokenId, address token, uint256 amount);
    event TokenEscrowUpdated(address oldEscrow, address newEscrow);
    event FeeVaultUpdated(address oldVault, address newVault);
    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);

    // ─── Errors ──────────────────────────────────────────

    error OnlyFactory();
    error OnlyOwner();
    error OnlyPendingOwner();
    error PositionNotLocked();
    error AlreadyLocked();
    error ZeroAddress();
    error CannotRemoveLiquidity();
    error ContractPaused();
    error ContractNotPaused();

    // ─── Constructor ─────────────────────────────────────

    constructor(
        address _positionManager,
        address _feeVault,
        address _factory,
        address _usdc,
        address _tokenEscrow
    ) {
        if (_positionManager == address(0) || _feeVault == address(0)) revert ZeroAddress();
        if (_factory == address(0) || _usdc == address(0)) revert ZeroAddress();
        if (_tokenEscrow == address(0)) revert ZeroAddress();

        positionManager = INonfungiblePositionManager(_positionManager);
        feeVault = ISigilFeeVaultV3(_feeVault);
        factory = _factory;
        usdc = _usdc;
        tokenEscrow = _tokenEscrow;
        owner = msg.sender;
    }

    // ─── Lock Position ──────────────────────────────────

    /// @notice Register a locked LP position. Called by factory after NFT transfer.
    /// @param tokenId The V3 NFT token ID
    /// @param poolId Pool identifier (keccak256 of pool address)
    /// @param dev Developer wallet for fee routing
    function lockPosition(uint256 tokenId, bytes32 poolId, address dev) external {
        if (msg.sender != factory) revert OnlyFactory();
        if (positions[tokenId].locked) revert AlreadyLocked();

        // Read token0/token1 from the NFT position
        (, , address token0, address token1, , , , , , , , ) = positionManager.positions(tokenId);

        positions[tokenId] = LockedPosition({
            poolId: poolId,
            dev: dev,
            token0: token0,
            token1: token1,
            locked: true
        });
        lockedTokenIds.push(tokenId);

        emit PositionLocked(tokenId, poolId, dev);
    }

    // ─── Fee Collection ─────────────────────────────────

    /// @notice Collect accrued LP fees from a locked position and route to FeeVault.
    ///         Anyone can call this — incentive-compatible since fees go to dev/protocol.
    /// @param tokenId The V3 NFT token ID to collect from
    function collectFees(uint256 tokenId) external whenNotPaused {
        LockedPosition storage pos = positions[tokenId];
        if (!pos.locked) revert PositionNotLocked();

        // Collect all accrued fees to this contract
        (uint256 amount0, uint256 amount1) = positionManager.collect(
            INonfungiblePositionManager.CollectParams({
                tokenId: tokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            })
        );

        // Route fees: USDC → FeeVault (80/20 split), native token → escrow (100%)
        if (amount0 > 0) {
            _routeTokenFees(tokenId, pos.poolId, pos.dev, pos.token0, amount0);
        }
        if (amount1 > 0) {
            _routeTokenFees(tokenId, pos.poolId, pos.dev, pos.token1, amount1);
        }

        emit FeesCollected(tokenId, pos.poolId, pos.token0, amount0, pos.token1, amount1);
    }

    /// @notice Batch collect fees from multiple positions
    function collectFeesMulti(uint256[] calldata tokenIds) external whenNotPaused {
        for (uint256 i; i < tokenIds.length; ++i) {
            LockedPosition storage pos = positions[tokenIds[i]];
            if (!pos.locked) continue;

            (uint256 amount0, uint256 amount1) = positionManager.collect(
                INonfungiblePositionManager.CollectParams({
                    tokenId: tokenIds[i],
                    recipient: address(this),
                    amount0Max: type(uint128).max,
                    amount1Max: type(uint128).max
                })
            );

            if (amount0 > 0) _routeTokenFees(tokenIds[i], pos.poolId, pos.dev, pos.token0, amount0);
            if (amount1 > 0) _routeTokenFees(tokenIds[i], pos.poolId, pos.dev, pos.token1, amount1);

            emit FeesCollected(tokenIds[i], pos.poolId, pos.token0, amount0, pos.token1, amount1);
        }
    }

    // ─── Internal ────────────────────────────────────────

    /// @dev Route fees based on token type.
    ///      USDC fees → FeeVault with 80/20 dev/protocol split
    ///      Native token fees → tokenEscrow (100%, avoids sell pressure)
    function _routeTokenFees(
        uint256 tokenId,
        bytes32 poolId,
        address dev,
        address token,
        uint256 amount
    ) internal {
        if (token == usdc) {
            // USDC fees: split 80/20 through FeeVault
            _routeFeesToVault(poolId, dev, token, amount);
        } else {
            // Native token fees: 100% to escrow (DAO-governed)
            IERC20(token).transfer(tokenEscrow, amount);
            emit NativeTokenEscrowed(tokenId, token, amount);
        }
    }

    function _routeFeesToVault(bytes32 poolId, address dev, address token, uint256 amount) internal {
        uint256 devAmount = amount * DEV_SHARE_BPS / BPS_DENOMINATOR;
        uint256 protocolAmount = amount - devAmount;

        // Approve FeeVault to pull tokens
        IERC20(token).approve(address(feeVault), amount);

        // Deposit to FeeVault for accounting
        feeVault.depositFees(poolId, dev, token, devAmount, protocolAmount);
    }

    // ─── Admin ───────────────────────────────────────────

    /// @notice Update the dev address for a single position (after verification).
    function updateDev(uint256 tokenId, address newDev) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newDev == address(0)) revert ZeroAddress();

        LockedPosition storage pos = positions[tokenId];
        if (!pos.locked) revert PositionNotLocked();

        address oldDev = pos.dev;
        pos.dev = newDev;

        emit DevUpdated(tokenId, oldDev, newDev);
    }

    /// @notice Batch update dev address across multiple positions atomically.
    ///         Use this for multi-LP launches (6 positions per pool) where all
    ///         positions must point to the same dev.
    function updateDevMulti(uint256[] calldata tokenIds, address newDev) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newDev == address(0)) revert ZeroAddress();

        for (uint256 i; i < tokenIds.length; ++i) {
            LockedPosition storage pos = positions[tokenIds[i]];
            if (!pos.locked) revert PositionNotLocked();

            address oldDev = pos.dev;
            pos.dev = newDev;

            emit DevUpdated(tokenIds[i], oldDev, newDev);
        }
    }

    /// @notice Register an orphaned LP NFT that was transferred but never registered.
    ///         This can happen if the factory was redeployed after the NFT transfer.
    ///         Only callable by owner. Verifies the NFT is actually owned by this contract.
    function registerPosition(uint256 tokenId, bytes32 poolId, address dev) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (positions[tokenId].locked) revert AlreadyLocked();

        // Read token0/token1 from the NFT position (also implicitly verifies it exists)
        (, , address token0, address token1, , , , , , , , ) = positionManager.positions(tokenId);

        positions[tokenId] = LockedPosition({
            poolId: poolId,
            dev: dev,
            token0: token0,
            token1: token1,
            locked: true
        });
        lockedTokenIds.push(tokenId);

        emit PositionLocked(tokenId, poolId, dev);
    }

    // ─── Ownership (2-step transfer) ────────────────────

    /// @notice Start ownership transfer. The new owner must call acceptOwnership().
    function transferOwnership(address newOwner) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newOwner == address(0)) revert ZeroAddress();
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    /// @notice Accept ownership transfer. Only callable by the pending owner.
    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert OnlyPendingOwner();
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    // ─── Config Setters ─────────────────────────────────

    /// @notice Update the fee vault address (enables vault migration).
    function setFeeVault(address newVault) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newVault == address(0)) revert ZeroAddress();
        emit FeeVaultUpdated(address(feeVault), newVault);
        feeVault = ISigilFeeVaultV3(newVault);
    }

    /// @notice Update the token escrow address
    function setTokenEscrow(address newEscrow) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newEscrow == address(0)) revert ZeroAddress();
        emit TokenEscrowUpdated(tokenEscrow, newEscrow);
        tokenEscrow = newEscrow;
    }

    // ─── Pausable ────────────────────────────────────────

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    /// @notice Pause fee collection. Emergency use only.
    function pause() external {
        if (msg.sender != owner) revert OnlyOwner();
        if (paused) revert ContractPaused();
        paused = true;
        emit Paused(msg.sender);
    }

    /// @notice Resume fee collection.
    function unpause() external {
        if (msg.sender != owner) revert OnlyOwner();
        if (!paused) revert ContractNotPaused();
        paused = false;
        emit Unpaused(msg.sender);
    }

    // ─── Views ───────────────────────────────────────────

    function getLockedCount() external view returns (uint256) {
        return lockedTokenIds.length;
    }

    function isLocked(uint256 tokenId) external view returns (bool) {
        return positions[tokenId].locked;
    }

    // ─── ERC721 Receiver ─────────────────────────────────

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
