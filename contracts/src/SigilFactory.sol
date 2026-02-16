// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {IUnlockCallback} from "@uniswap/v4-core/src/interfaces/callback/IUnlockCallback.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {IERC20Minimal} from "@uniswap/v4-core/src/interfaces/external/IERC20Minimal.sol";

import {SigilToken} from "./SigilToken.sol";
import {SigilHook} from "./SigilHook.sol";

/// @title SigilFactory
/// @notice Deploys Sigil tokens, creates Uniswap V4 pools with the SigilHook,
///         and places single-sided liquidity via the V4 unlock callback pattern.
///
///         Flow:
///         1. Anyone calls launch() with token metadata and the verified dev address
///         2. Factory deploys SigilToken with fixed supply
///         3. Factory creates V4 pool (TOKEN/USDC) with SigilHook attached
///         4. Factory calls poolManager.unlock() → unlockCallback places liquidity
///         5. LP is permanently locked (enforced by hook's beforeRemoveLiquidity)
///         6. Every swap generates 1% fee → 80% dev, 20% protocol
contract SigilFactory is IUnlockCallback {
    using PoolIdLibrary for PoolKey;

    // ─── Constants ───────────────────────────────────────

    /// @notice Default token supply: 100 billion tokens (fixed for all Sigil launches)
    uint256 public constant DEFAULT_SUPPLY = 100_000_000_000 ether;

    /// @notice Default LP fee for the V4 pool (0% LP fee since hook takes 1% separately)
    uint24 public constant POOL_LP_FEE = 0;

    /// @notice Default tick spacing
    int24 public constant TICK_SPACING = 60;

    // ─── State ───────────────────────────────────────────

    IPoolManager public immutable poolManager;
    SigilHook public immutable hook;
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
        PoolId poolId;
        PoolKey poolKey;
        uint256 launchedAt;
        address launchedBy;
    }

    // ─── Events ──────────────────────────────────────────

    event TokenLaunched(
        address indexed token,
        address indexed dev,
        string projectId,
        PoolId poolId,
        address launchedBy,
        uint256 supply
    );

    // ─── Errors ──────────────────────────────────────────

    error OnlyOwner();
    error ZeroAddress();
    error ProjectAlreadyLaunched();
    error OnlyPoolManager();

    // ─── Constructor ─────────────────────────────────────

    constructor(
        address _poolManager,
        address _hook,
        address _usdc
    ) {
        if (_poolManager == address(0) || _hook == address(0) || _usdc == address(0)) {
            revert ZeroAddress();
        }
        poolManager = IPoolManager(_poolManager);
        hook = SigilHook(_hook);
        usdc = _usdc;
        owner = msg.sender;
    }

    // ─── Launch ──────────────────────────────────────────

    /// @notice Deploy a new Sigil token, create its V4 pool, and place single-sided liquidity.
    /// @param name Token name (e.g., "Sigil: MyProject")
    /// @param symbol Token symbol (e.g., "sMYPROJ")
    /// @param projectId Canonical project identifier (e.g., "github.com/org/repo")
    /// @param dev The verified developer wallet that earns 80% of fees
    /// @return token The deployed token address
    /// @return poolId The V4 pool identifier
    function launch(
        string calldata name,
        string calldata symbol,
        string calldata projectId,
        address dev
    ) external returns (address token, PoolId poolId) {
        // dev == address(0) is allowed for third-party launches
        // Fees will be escrowed in FeeVault until the dev verifies

        // 1. Deploy the token — all supply minted to this factory
        SigilToken sigilToken = new SigilToken(name, symbol, DEFAULT_SUPPLY, address(this));
        token = address(sigilToken);

        // 2. Sort currencies for the pool key (V4 requires currency0 < currency1)
        (Currency currency0, Currency currency1, bool tokenIsCurrency0) = _sortCurrencies(token, usdc);

        // 3. Build the pool key
        PoolKey memory key = PoolKey({
            currency0: currency0,
            currency1: currency1,
            fee: POOL_LP_FEE,
            tickSpacing: TICK_SPACING,
            hooks: IHooks(address(hook))
        });

        poolId = key.toId();

        // 4. Register the pool with the hook BEFORE initializing
        //    (hook's beforeInitialize checks registration)
        hook.registerPool(key, dev, tokenIsCurrency0);

        // 5. Initialize the pool (does NOT require unlock)
        uint160 startPrice = _getStartPrice(tokenIsCurrency0);
        poolManager.initialize(key, startPrice);

        // 6. Place single-sided liquidity via unlock callback
        //    The callback will modifyLiquidity + settle token deltas
        bytes memory cbData = abi.encode(key, token, tokenIsCurrency0);
        poolManager.unlock(cbData);

        // 7. Store launch info
        launches[token] = LaunchInfo({
            token: token,
            dev: dev,
            projectId: projectId,
            poolId: poolId,
            poolKey: key,
            launchedAt: block.timestamp,
            launchedBy: msg.sender
        });
        launchedTokens.push(token);

        emit TokenLaunched(token, dev, projectId, poolId, msg.sender, DEFAULT_SUPPLY);
    }

    // ─── V4 Unlock Callback ─────────────────────────────

    /// @notice Called by PoolManager during unlock. Places liquidity and settles.
    function unlockCallback(bytes calldata data) external override returns (bytes memory) {
        if (msg.sender != address(poolManager)) revert OnlyPoolManager();

        (PoolKey memory key, address token, bool tokenIsCurrency0) = abi.decode(data, (PoolKey, address, bool));

        // Place liquidity across 7 bands
        int256 totalTokenDelta = _placeLiquidityBands(key, tokenIsCurrency0);

        // Settle: we owe tokens to the PoolManager (negative delta = debt)
        // The settlement pattern: sync → transfer → settle
        if (totalTokenDelta < 0) {
            Currency tokenCurrency = tokenIsCurrency0 ? key.currency0 : key.currency1;
            uint256 amountOwed = uint256(-totalTokenDelta);

            poolManager.sync(tokenCurrency);
            IERC20Minimal(token).transfer(address(poolManager), amountOwed);
            poolManager.settle();
        }

        return "";
    }

    // ─── Internal ────────────────────────────────────────

    /// @dev Sort token addresses for V4 pool key (currency0 < currency1)
    function _sortCurrencies(address token, address paired)
        internal
        pure
        returns (Currency currency0, Currency currency1, bool tokenIsCurrency0)
    {
        if (token < paired) {
            currency0 = Currency.wrap(token);
            currency1 = Currency.wrap(paired);
            tokenIsCurrency0 = true;
        } else {
            currency0 = Currency.wrap(paired);
            currency1 = Currency.wrap(token);
            tokenIsCurrency0 = false;
        }
    }

    /// @dev Calculate starting sqrtPriceX96.
    function _getStartPrice(bool tokenIsCurrency0) internal pure returns (uint160) {
        if (tokenIsCurrency0) {
            // Token is currency0 — high price means token is cheap
            return TickMath.getSqrtPriceAtTick(69_000);
        } else {
            // Token is currency1 — low price means token is cheap
            return TickMath.getSqrtPriceAtTick(-69_000);
        }
    }

    /// @dev Place liquidity across 7 bands. Returns total token delta (negative = owed).
    function _placeLiquidityBands(
        PoolKey memory key,
        bool tokenIsCurrency0
    ) internal returns (int256 totalTokenDelta) {
        uint256 bands = 7;
        uint256 amountPerBand = DEFAULT_SUPPLY / bands;
        int24 tickSpacing = key.tickSpacing;

        for (uint256 i; i < bands; ++i) {
            int24 tickLower;
            int24 tickUpper;

            if (tokenIsCurrency0) {
                tickLower = int24(int256(69_000 + int256(i) * int256(tickSpacing) * 100));
                tickUpper = int24(int256(69_000 + int256(i + 1) * int256(tickSpacing) * 100));
            } else {
                tickLower = int24(int256(-69_000 - int256(i + 1) * int256(tickSpacing) * 100));
                tickUpper = int24(int256(-69_000 - int256(i) * int256(tickSpacing) * 100));
            }

            tickLower = _alignTick(tickLower, tickSpacing);
            tickUpper = _alignTick(tickUpper, tickSpacing);

            (BalanceDelta delta,) = poolManager.modifyLiquidity(
                key,
                ModifyLiquidityParams({
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    liquidityDelta: int256(amountPerBand),
                    salt: bytes32(i)
                }),
                ""
            );

            // Accumulate token delta
            if (tokenIsCurrency0) {
                totalTokenDelta += delta.amount0();
            } else {
                totalTokenDelta += delta.amount1();
            }
        }
    }

    /// @dev Align a tick to the nearest valid tick spacing
    function _alignTick(int24 tick, int24 tickSpacing) internal pure returns (int24) {
        int24 remainder = tick % tickSpacing;
        if (remainder < 0) remainder += tickSpacing;
        return tick - remainder;
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
