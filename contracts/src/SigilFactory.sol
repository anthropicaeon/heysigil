// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {TickMath} from "@uniswap/v4-core/src/libraries/TickMath.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {ModifyLiquidityParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

import {SigilToken} from "./SigilToken.sol";
import {SigilHook} from "./SigilHook.sol";

/// @title SigilFactory
/// @notice Deploys Sigil tokens, creates Uniswap V4 pools with the SigilHook,
///         and places single-sided liquidity.
///
///         Flow:
///         1. Anyone calls launch() with token metadata and the verified dev address
///         2. Factory deploys SigilToken with fixed supply
///         3. Factory creates V4 pool (TOKEN/WETH) with SigilHook attached
///         4. Factory places all tokens as single-sided liquidity
///         5. LP is permanently locked (enforced by hook's beforeRemoveLiquidity)
///         6. Every swap generates 1% fee → 80% dev, 20% protocol
///
///         Funding is PURELY from swap fees. No community deposits.
///         The dev earns fees in whatever token the swap outputs —
///         a natural mix of USDC and native token without forced selling.
contract SigilFactory {
    using PoolIdLibrary for PoolKey;

    // ─── Constants ───────────────────────────────────────

    /// @notice Default token supply: 100 billion tokens (fixed for all Sigil launches)
    uint256 public constant DEFAULT_SUPPLY = 100_000_000_000 ether;

    /// @notice Default LP fee for the V4 pool (0% LP fee since hook takes 1% separately)
    /// We set LP fee to 0 so all fee revenue goes through the hook's afterSwap.
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

    /// @notice Launch a new Sigil token for a project.
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

        // 5. Initialize the pool
        //    Start at a very low price so first buyers get the bonding curve effect
        //    sqrtPriceX96 for ~0 initial price of token vs WETH
        uint160 startPrice = _getStartPrice(tokenIsCurrency0);
        poolManager.initialize(key, startPrice);

        // 6. Place single-sided liquidity (all tokens, no USDC needed)
        //    This creates the "bonding curve" effect — price rises as people buy
        _placeLiquidity(key, token, tokenIsCurrency0);

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
    ///      We want the token to start at a very low price relative to USDC.
    ///      This creates a bonding curve effect as buyers push the price up.
    function _getStartPrice(bool tokenIsCurrency0) internal pure returns (uint160) {
        // If token is currency0: price = currency1/currency0 = USDC/TOKEN
        //   High price means token is cheap in USDC terms
        //   We want token cheap → high sqrtPriceX96
        // If token is currency1: price = currency0/currency1 = USDC/TOKEN inverted
        //   Low price means token is cheap
        //   We want token cheap → low sqrtPriceX96

        if (tokenIsCurrency0) {
            // Token is currency0, USDC is currency1
            // Start near the max to make token very cheap
            // Use a reasonable starting tick (not extreme)
            return TickMath.getSqrtPriceAtTick(69_000);
        } else {
            // Token is currency1, WETH is currency0
            // Start near the min to make token very cheap
            return TickMath.getSqrtPriceAtTick(-69_000);
        }
    }

    /// @dev Place all tokens as single-sided liquidity across price bands.
    ///      This is the "liquidity staircase" pattern from Clanker V4.
    ///      Tokens are spread across multiple tick ranges so there's depth
    ///      at various price levels.
    function _placeLiquidity(
        PoolKey memory key,
        address token,
        bool tokenIsCurrency0
    ) internal {
        // Approve poolManager to take tokens
        (bool success,) = token.call(
            abi.encodeWithSignature(
                "approve(address,uint256)",
                address(poolManager),
                DEFAULT_SUPPLY
            )
        );
        require(success, "SIGIL: APPROVE_FAILED");

        // Place liquidity across bands
        // We divide the supply across tick ranges for depth
        // Each band gets a portion of the total supply

        uint256 bands = 7;
        uint256 amountPerBand = DEFAULT_SUPPLY / bands;
        int24 tickSpacing = key.tickSpacing;

        for (uint256 i; i < bands; ++i) {
            int24 tickLower;
            int24 tickUpper;

            if (tokenIsCurrency0) {
                // Token is currency0 — liquidity above current price
                // As price increases (more WETH per token), these bands activate
                tickLower = int24(int256(69_000 + int256(i) * int256(tickSpacing) * 100));
                tickUpper = int24(int256(69_000 + int256(i + 1) * int256(tickSpacing) * 100));
            } else {
                // Token is currency1 — liquidity below current price
                tickLower = int24(int256(-69_000 - int256(i + 1) * int256(tickSpacing) * 100));
                tickUpper = int24(int256(-69_000 - int256(i) * int256(tickSpacing) * 100));
            }

            // Ensure ticks are aligned to tick spacing
            tickLower = _alignTick(tickLower, tickSpacing);
            tickUpper = _alignTick(tickUpper, tickSpacing);

            // Add liquidity for this band
            // In V4, this goes through the PoolManager's modifyLiquidity
            poolManager.modifyLiquidity(
                key,
                ModifyLiquidityParams({
                    tickLower: tickLower,
                    tickUpper: tickUpper,
                    liquidityDelta: int256(amountPerBand),
                    salt: bytes32(i)
                }),
                "" // No hook data needed
            );
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
