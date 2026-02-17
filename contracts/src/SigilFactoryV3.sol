// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SigilToken} from "./SigilToken.sol";

// ─── Minimal V3 Interfaces ─────────────────────────────

interface IUniswapV3Factory {
    function createPool(address tokenA, address tokenB, uint24 fee) external returns (address pool);
}

interface IUniswapV3Pool {
    function initialize(uint160 sqrtPriceX96) external;
}

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }

    function mint(MintParams calldata params)
        external
        payable
        returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);

    function transferFrom(address from, address to, uint256 tokenId) external;
}

interface ISigilLPLocker {
    function lockPosition(uint256 tokenId, bytes32 poolId, address dev) external;
}

/// @title SigilFactoryV3
/// @notice Deploys Sigil tokens and creates Uniswap V3 pools with locked LP.
///
///         Flow:
///         1. Anyone calls launch() with token metadata and the verified dev address
///         2. Factory deploys SigilToken with fixed supply
///         3. Factory creates V3 pool (TOKEN/USDC, 1% fee tier)
///         4. Factory mints a full-range LP position via NonfungiblePositionManager
///         5. Factory transfers the LP NFT to SigilLPLocker (permanently locked)
///         6. Every swap generates 1% LP fee → Locker collects → 80% dev, 20% protocol
contract SigilFactoryV3 {
    // ─── Constants ───────────────────────────────────────

    /// @notice Default token supply: 100 billion tokens
    uint256 public constant DEFAULT_SUPPLY = 100_000_000_000 ether;

    /// @notice V3 fee tier: 1% (10000)
    uint24 public constant POOL_FEE = 10000;

    /// @notice Tick spacing for 1% fee tier
    int24 public constant TICK_SPACING = 200;

    /// @notice Full-range tick bounds (aligned to tick spacing)
    int24 public constant MIN_TICK = -887200; // Aligned to 200
    int24 public constant MAX_TICK = 887200;  // Aligned to 200

    // ─── State ───────────────────────────────────────────

    IUniswapV3Factory public immutable v3Factory;
    INonfungiblePositionManager public immutable positionManager;
    ISigilLPLocker public immutable lpLocker;
    address public immutable usdc;
    address public owner;

    /// @notice All launched token addresses
    address[] public launchedTokens;

    /// @notice Token address → launch info
    mapping(address => LaunchInfo) public launches;

    struct LaunchInfo {
        address token;
        address dev;
        string projectId;
        bytes32 poolId;
        address pool;
        uint256 lpTokenId;
        uint256 launchedAt;
        address launchedBy;
    }

    // ─── Events ──────────────────────────────────────────

    event TokenLaunched(
        address indexed token,
        address indexed dev,
        string projectId,
        bytes32 poolId,
        address launchedBy,
        uint256 supply
    );

    // ─── Errors ──────────────────────────────────────────

    error OnlyOwner();
    error ZeroAddress();

    // ─── Constructor ─────────────────────────────────────

    constructor(
        address _v3Factory,
        address _positionManager,
        address _lpLocker,
        address _usdc
    ) {
        if (_v3Factory == address(0) || _positionManager == address(0)) revert ZeroAddress();
        if (_lpLocker == address(0) || _usdc == address(0)) revert ZeroAddress();

        v3Factory = IUniswapV3Factory(_v3Factory);
        positionManager = INonfungiblePositionManager(_positionManager);
        lpLocker = ISigilLPLocker(_lpLocker);
        usdc = _usdc;
        owner = msg.sender;
    }

    // ─── Launch ──────────────────────────────────────────

    /// @notice Deploy a new Sigil token, create its V3 pool, and lock LP.
    function launch(
        string calldata name,
        string calldata symbol,
        string calldata projectId,
        address dev
    ) external returns (address token, bytes32 poolId) {
        // 1. Deploy the token — all supply minted to this factory
        SigilToken sigilToken = new SigilToken(name, symbol, DEFAULT_SUPPLY, address(this));
        token = address(sigilToken);

        // 2. Sort tokens (V3 requires token0 < token1)
        (address token0, address token1, bool tokenIsToken0) = _sortTokens(token, usdc);

        // 3. Create V3 pool
        address pool = v3Factory.createPool(token0, token1, POOL_FEE);

        // 4. Initialize the pool with a starting price
        //    Price = how much USDC per token. Start very cheap.
        //    sqrtPriceX96 = sqrt(price) * 2^96
        uint160 sqrtPriceX96 = _getStartPrice(tokenIsToken0);
        IUniswapV3Pool(pool).initialize(sqrtPriceX96);

        // 5. Approve the position manager to spend tokens
        IERC20(token).approve(address(positionManager), DEFAULT_SUPPLY);

        // 6. Mint single-sided liquidity (full range = single-sided token side)
        //    We provide all tokens and 0 USDC — the token is on one side of current price
        (uint256 amount0Desired, uint256 amount1Desired) = tokenIsToken0
            ? (DEFAULT_SUPPLY, uint256(0))
            : (uint256(0), DEFAULT_SUPPLY);

        (uint256 tokenId, , , ) = positionManager.mint(
            INonfungiblePositionManager.MintParams({
                token0: token0,
                token1: token1,
                fee: POOL_FEE,
                tickLower: MIN_TICK,
                tickUpper: MAX_TICK,
                amount0Desired: amount0Desired,
                amount1Desired: amount1Desired,
                amount0Min: 0,
                amount1Min: 0,
                recipient: address(this),
                deadline: block.timestamp
            })
        );

        // 7. Generate a pool ID (keccak of pool address for consistency)
        poolId = keccak256(abi.encodePacked(pool));

        // 8. Lock the LP NFT — transfer to locker
        positionManager.transferFrom(
            address(this),
            address(lpLocker),
            tokenId
        );
        lpLocker.lockPosition(tokenId, poolId, dev);

        // 9. Store launch info
        launches[token] = LaunchInfo({
            token: token,
            dev: dev,
            projectId: projectId,
            poolId: poolId,
            pool: pool,
            lpTokenId: tokenId,
            launchedAt: block.timestamp,
            launchedBy: msg.sender
        });
        launchedTokens.push(token);

        emit TokenLaunched(token, dev, projectId, poolId, msg.sender, DEFAULT_SUPPLY);
    }

    // ─── Internal ────────────────────────────────────────

    function _sortTokens(address tokenA, address tokenB)
        internal
        pure
        returns (address token0, address token1, bool tokenAIsToken0)
    {
        if (tokenA < tokenB) {
            token0 = tokenA;
            token1 = tokenB;
            tokenAIsToken0 = true;
        } else {
            token0 = tokenB;
            token1 = tokenA;
            tokenAIsToken0 = false;
        }
    }

    /// @dev Calculate starting sqrtPriceX96 for the pool.
    ///
    ///      For single-sided LP mint (only Sigil token, 0 USDC), the current
    ///      tick must be OUTSIDE the position's tick range:
    ///
    ///      - If token is token0: tick must be < tickLower (-887200)
    ///        → Use MIN_SQRT_RATIO + 1, which gives tick ≈ -887272
    ///        → Position provides only token0 (the Sigil token)
    ///
    ///      - If token is token1: tick must be > tickUpper (+887200)
    ///        → Use MAX_SQRT_RATIO - 1, which gives tick ≈ +887272
    ///        → Position provides only token1 (the Sigil token)
    ///
    ///      The first swap into the pool sets the real market price.
    ///      Starting at the extreme means the token is essentially "free" until
    ///      someone provides USDC, which is the intended bonding curve effect.
    function _getStartPrice(bool tokenIsToken0) internal pure returns (uint160) {
        if (tokenIsToken0) {
            // token0 = Sigil token → tick must be below tickLower
            // MIN_SQRT_RATIO + 1 = 4295128740 → tick ≈ -887272
            return 4295128740;
        } else {
            // token0 = USDC, token1 = Sigil token → tick must be above tickUpper
            // MAX_SQRT_RATIO - 1 → tick ≈ +887272
            return uint160(1461446703485210103287273052203988822378723970341);
        }
    }

    // ─── Transfer helper for NFT ─────────────────────────
    // Factory needs to be able to transfer NFTs
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    // ─── Views ───────────────────────────────────────────

    function getLaunchCount() external view returns (uint256) {
        return launchedTokens.length;
    }

    function getLaunchInfo(address token) external view returns (LaunchInfo memory) {
        return launches[token];
    }

    function getAllLaunches() external view returns (address[] memory) {
        return launchedTokens;
    }

    // ─── Admin ───────────────────────────────────────────

    function setOwner(address newOwner) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newOwner == address(0)) revert ZeroAddress();
        owner = newOwner;
    }
}
