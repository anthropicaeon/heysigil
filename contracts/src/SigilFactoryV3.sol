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
    function swap(
        address recipient,
        bool zeroForOne,
        int256 amountSpecified,
        uint160 sqrtPriceLimitX96,
        bytes calldata data
    ) external returns (int256 amount0, int256 amount1);
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
///         4. Factory mints 6 concentrated LP positions via NonfungiblePositionManager
///         5. Factory transfers all LP NFTs to SigilLPLocker (permanently locked)
///         6. Every swap generates 1% LP fee → Locker collects → 80% dev, 20% protocol
///
///         LP Distribution (6 positions):
///         - Positions 0–4: 80% of supply across $15K → $250K MCAP
///         - Position 5:    20% of supply from $250K → ∞ (full upside)
contract SigilFactoryV3 {
    // ─── Constants ───────────────────────────────────────

    /// @notice Default token supply: 100 billion tokens
    uint256 public constant DEFAULT_SUPPLY = 100_000_000_000 ether;

    /// @notice V3 fee tier: 1% (10000)
    uint24 public constant POOL_FEE = 10000;

    /// @notice Default seed amount: 1 USDC (6 decimals) to activate pool
    uint256 public constant DEFAULT_SEED = 1_000_000;

    /// @notice Min/Max sqrtPriceX96 limits for swaps
    uint160 internal constant MIN_SQRT_RATIO = 4295128739;
    uint160 internal constant MAX_SQRT_RATIO = 1461446703485210103287273052203988822378723970342;

    /// @notice Tick spacing for 1% fee tier
    int24 public constant TICK_SPACING = 200;

    /// @notice Full-range tick bounds (aligned to tick spacing)
    int24 public constant MIN_TICK = -887200; // Aligned to 200
    int24 public constant MAX_TICK = 887200;  // Aligned to 200

    /// @notice Number of concentrated LP positions
    uint256 public constant NUM_POSITIONS = 6;

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
        uint256[] lpTokenIds;
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

        // 6. Generate a pool ID (keccak of pool address for consistency)
        poolId = keccak256(abi.encodePacked(pool));

        // 7. Mint 6 concentrated LP positions and lock each in the locker
        uint256[] memory tokenIds = _mintAndLockPositions(
            token0, token1, tokenIsToken0, poolId, dev
        );

        // 9. Seed swap — pull USDC from deployer and swap to activate liquidity
        //    This pushes the price from out-of-range into the LP tick range,
        //    giving the pool active liquidity so DEX routers can find it.
        //    Defensive: checks both balance AND allowance to avoid reverts.
        uint256 seedBal = IERC20(usdc).balanceOf(msg.sender);
        uint256 seedAllow = IERC20(usdc).allowance(msg.sender, address(this));
        uint256 seedAmount = seedBal < seedAllow ? seedBal : seedAllow;
        if (seedAmount > DEFAULT_SEED) seedAmount = DEFAULT_SEED;
        if (seedAmount > 0) {
            IERC20(usdc).transferFrom(msg.sender, address(this), seedAmount);

            // Swap USDC → token through the pool
            // zeroForOne = true means selling token0 to buy token1
            bool zeroForOne = !tokenIsToken0; // We're selling USDC
            uint160 sqrtPriceLimit = zeroForOne
                ? MIN_SQRT_RATIO + 1
                : MAX_SQRT_RATIO - 1;

            IUniswapV3Pool(pool).swap(
                dev != address(0) ? dev : msg.sender, // seed tokens go to dev
                zeroForOne,
                int256(seedAmount),
                sqrtPriceLimit,
                abi.encode(usdc) // callback data
            );
        }

        // 9. Store launch info
        launches[token] = LaunchInfo({
            token: token,
            dev: dev,
            projectId: projectId,
            poolId: poolId,
            pool: pool,
            lpTokenIds: tokenIds,
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
    ///      Target: 15k market cap at 100B supply → $0.00000015/token
    ///      USDC (6 decimals) / Token (18 decimals) raw ratio = 1.5e-19
    ///
    ///      For single-sided LP mint (only Sigil token, 0 USDC), the current
    ///      tick must be OUTSIDE the position's tick range. V3 mint() reverts
    ///      if currentTick is in-range with only one token provided.
    ///
    ///      - If token is token0: init tick = MCAP_TICK_TOKEN0 - TICK_SPACING = -433800
    ///        → sqrtPriceX96 = 30,164,993,233,297,854,464
    ///
    ///      - If token is token1: init tick = MCAP_TICK_TOKEN1 + TICK_SPACING = +433600
    ///        → sqrtPriceX96 = 206,021,814,379,242,830,973,241,408,007,755,005,952
    ///
    ///      First buy pushes tick into the range — bonding curve from 15k mcap.
    function _getStartPrice(bool tokenIsToken0) internal pure returns (uint160) {
        if (tokenIsToken0) {
            // token0 = Sigil → tick at -433800 (1 spacing below range)
            return 30164993233297854464;
        } else {
            // token1 = Sigil → tick at +433600 (1 spacing above range)
            return uint160(206021814379242830973241408007755005952);
        }
    }

    /// @dev Mint 6 concentrated LP positions and lock each in the locker.
    ///      Returns array of NFT token IDs.
    ///
    ///      Position layout (80% supply in 0–4, 20% in 5):
    ///      | Pos | MCAP Range           | Supply  |
    ///      |-----|---------------------|---------|
    ///      |  0  | $15.0K → $26.4K     | 21.50B  |
    ///      |  1  | $26.4K → $46.3K     | 18.22B  |
    ///      |  2  | $46.3K → $81.4K     | 15.44B  |
    ///      |  3  | $81.4K → $143.0K    | 13.09B  |
    ///      |  4  | $143.0K → $251.3K   | 11.09B  |
    ///      |  5  | $251.3K → ∞         | 20.66B  |
    function _mintAndLockPositions(
        address token0,
        address token1,
        bool tokenIsToken0,
        bytes32 poolId,
        address dev
    ) internal returns (uint256[] memory tokenIds) {
        tokenIds = new uint256[](NUM_POSITIONS);

        for (uint256 i; i < NUM_POSITIONS; ++i) {
            (int24 tickLower, int24 tickUpper, uint256 tokenAmount) =
                _getPositionConfig(i, tokenIsToken0);

            (uint256 amount0Desired, uint256 amount1Desired) = tokenIsToken0
                ? (tokenAmount, uint256(0))
                : (uint256(0), tokenAmount);

            (tokenIds[i], , , ) = positionManager.mint(
                INonfungiblePositionManager.MintParams({
                    token0: token0,
                    token1: token1,
                    fee: POOL_FEE,
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    amount0Desired: amount0Desired,
                    amount1Desired: amount1Desired,
                    amount0Min: 0,
                    amount1Min: 0,
                    recipient: address(this),
                    deadline: block.timestamp
                })
            );

            // Transfer NFT to locker and register
            positionManager.transferFrom(address(this), address(lpLocker), tokenIds[i]);
            lpLocker.lockPosition(tokenIds[i], poolId, dev);
        }
    }

    /// @dev Get tick range and token amount for a specific position index.
    ///
    ///      Tick boundaries are derived from MCAP targets at 100B supply:
    ///        MCAP → price_per_token → tick = ln(price_raw) / ln(1.0001)
    ///      Aligned to TICK_SPACING = 200.
    ///
    ///      When tokenIsToken0 (sigil < USDC address):
    ///        - Higher MCAP → less negative tick (price increases)
    ///        - Position range moves from negative tick towards MAX_TICK
    ///
    ///      When tokenIsToken1 (sigil > USDC address):
    ///        - Higher MCAP → less positive tick (buying pushes tick down)
    ///        - Position range moves from positive tick towards MIN_TICK
    function _getPositionConfig(uint256 index, bool tokenIsToken0)
        internal
        pure
        returns (int24 tickLower, int24 tickUpper, uint256 tokenAmount)
    {
        // ─── Token amounts per position ────────────────────
        // Sum = 100,000,000,000 ether = DEFAULT_SUPPLY
        if (index == 0) tokenAmount = 21_500_000_000 ether;
        else if (index == 1) tokenAmount = 18_220_000_000 ether;
        else if (index == 2) tokenAmount = 15_440_000_000 ether;
        else if (index == 3) tokenAmount = 13_090_000_000 ether;
        else if (index == 4) tokenAmount = 11_090_000_000 ether;
        else tokenAmount = 20_660_000_000 ether; // Residual to position 5

        // ─── Tick boundaries ───────────────────────────────
        // MCAP ticks (tokenIsToken0 case):
        //   $15.0K  → -433600  (existing start price)
        //   $26.4K  → -428000
        //   $46.3K  → -422200
        //   $81.4K  → -416600
        //   $143.0K → -411000
        //   $251.3K → -405400
        //   ∞       → +887200 (MAX_TICK)
        if (tokenIsToken0) {
            if (index == 0)      { tickLower = -433600; tickUpper = -428000; }
            else if (index == 1) { tickLower = -428000; tickUpper = -422200; }
            else if (index == 2) { tickLower = -422200; tickUpper = -416600; }
            else if (index == 3) { tickLower = -416600; tickUpper = -411000; }
            else if (index == 4) { tickLower = -411000; tickUpper = -405400; }
            else                 { tickLower = -405400; tickUpper = MAX_TICK; }
        } else {
            // Mirrored: higher MCAP → lower tick
            // MCAP ticks (tokenIsToken1 case):
            //   $15.0K  → +433400  (existing start price)
            //   $26.4K  → +427800
            //   $46.3K  → +422000
            //   $81.4K  → +416400
            //   $143.0K → +410800
            //   $251.3K → +405200
            //   ∞       → -887200 (MIN_TICK)
            if (index == 0)      { tickLower = 427800;  tickUpper = 433400;  }
            else if (index == 1) { tickLower = 422000;  tickUpper = 427800;  }
            else if (index == 2) { tickLower = 416400;  tickUpper = 422000;  }
            else if (index == 3) { tickLower = 410800;  tickUpper = 416400;  }
            else if (index == 4) { tickLower = 405200;  tickUpper = 410800;  }
            else                 { tickLower = MIN_TICK; tickUpper = 405200; }
        }
    }

    // ─── Callbacks ────────────────────────────────────────

    /// @dev Uniswap V3 swap callback — pays the pool for the seed swap.
    function uniswapV3SwapCallback(
        int256 amount0Delta,
        int256 amount1Delta,
        bytes calldata data
    ) external {
        // Pay whichever token the pool requests
        address tokenToPay = abi.decode(data, (address));
        uint256 amountToPay = amount0Delta > 0 ? uint256(amount0Delta) : uint256(amount1Delta);
        IERC20(tokenToPay).transfer(msg.sender, amountToPay);
    }

    // Factory needs to be able to receive NFTs
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
