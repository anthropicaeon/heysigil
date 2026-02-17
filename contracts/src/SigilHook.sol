// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {SafeCast} from "@uniswap/v4-core/src/libraries/SafeCast.sol";
import {ModifyLiquidityParams, SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

import {ISigilFeeVault} from "./interfaces/ISigilFeeVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title SigilHook
/// @notice Uniswap V4 hook that collects 1% fee on every swap.
///         80% goes to the verified dev/creator, 20% goes to the Sigil protocol.
///         Fees accumulate in the SigilFeeVault as both USDC and native token
///         so the dev doesn't need to dump native tokens.
///
/// @dev Forked from Clanker V4 + Flaunch afterSwap patterns.
///      Uses poolManager.take() to extract fee tokens from the pool,
///      then forwards them to the SigilFeeVault for split accounting.
///
///      Fee flow:
///      1. User swaps TOKEN/USDC
///      2. afterSwap calculates 1% of output
///      3. poolManager.take() extracts fee tokens to this contract
///      4. If USDC: forwarded to SigilFeeVault → 80% dev, 20% protocol
///      5. If native token: forwarded to tokenEscrow contract
///      6. Dev claims accumulated USDC fees from vault
contract SigilHook is BaseHook {
    using PoolIdLibrary for PoolKey;
    using SafeCast for uint256;

    // ─── Constants ───────────────────────────────────────

    /// @notice Total fee: 1% (100 basis points)
    uint256 public constant TOTAL_FEE_BPS = 100;
    uint256 public constant BPS_DENOMINATOR = 10_000;

    /// @notice Dev gets 80% of the 1% fee
    uint256 public constant DEV_SHARE_BPS = 8_000;
    /// @notice Protocol gets 20% of the 1% fee
    uint256 public constant PROTOCOL_SHARE_BPS = 2_000;

    // ─── State ───────────────────────────────────────────

    /// @notice The fee vault that holds and splits fees
    ISigilFeeVault public immutable feeVault;

    /// @notice The factory that can register pools
    address public immutable factory;

    /// @notice Protocol treasury address for the 20% cut
    address public protocolTreasury;

    /// @notice USDC token address — only USDC fees go to devs
    address public immutable usdc;

    /// @notice Token escrow contract — native token fees go here
    address public tokenEscrow;

    /// @notice Owner for admin functions
    address public owner;

    /// @notice Pool registration: only pools created through SigilFactory are valid
    mapping(PoolId => bool) public isRegisteredPool;

    /// @notice Which token in the pair is the Sigil-launched token (true = token0)
    mapping(PoolId => bool) public sigilTokenIsToken0;

    /// @notice The verified dev address for each pool
    mapping(PoolId => address) public poolDev;

    // ─── Events ──────────────────────────────────────────

    event PoolRegistered(PoolId indexed poolId, address indexed dev, address token, address pairedWith);
    event PoolDevUpdated(PoolId indexed poolId, address oldDev, address newDev);
    event FeesCollected(PoolId indexed poolId, address currency, uint256 totalFee, uint256 devShare, uint256 protocolShare);
    event TokenFeesEscrowed(PoolId indexed poolId, address token, uint256 amount);
    event ProtocolTreasuryUpdated(address oldTreasury, address newTreasury);
    event TokenEscrowUpdated(address oldEscrow, address newEscrow);
    event OwnerUpdated(address oldOwner, address newOwner);

    // ─── Errors ──────────────────────────────────────────

    error OnlyFactory();
    error OnlyOwner();
    error PoolNotRegistered();
    error ZeroAddress();

    // ─── Constructor ─────────────────────────────────────

    constructor(
        IPoolManager _poolManager,
        address _factory,
        address _feeVault,
        address _protocolTreasury,
        address _usdc,
        address _tokenEscrow
    ) BaseHook(_poolManager) {
        if (_factory == address(0) || _feeVault == address(0) || _protocolTreasury == address(0)) {
            revert ZeroAddress();
        }
        if (_usdc == address(0) || _tokenEscrow == address(0)) {
            revert ZeroAddress();
        }
        factory = _factory;
        feeVault = ISigilFeeVault(_feeVault);
        protocolTreasury = _protocolTreasury;
        usdc = _usdc;
        tokenEscrow = _tokenEscrow;
        owner = msg.sender;
    }

    // ─── Hook Permissions ────────────────────────────────

    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: true, // Validate pool is registered
            afterInitialize: false,
            beforeAddLiquidity: true, // Gate liquidity adds (locked LP enforcement)
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true, // Block LP removal (locked forever)
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true, // Collect fees
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: true, // We take from the swap output
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ─── Pool Registration (called by Factory) ──────────

    /// @notice Register a pool so the hook recognizes it. Only callable by the factory.
    /// @param key The pool key
    /// @param dev The verified developer who earns 80% of fees
    /// @param tokenIsCurrency0 Whether the Sigil token is currency0 in the pair
    function registerPool(
        PoolKey calldata key,
        address dev,
        bool tokenIsCurrency0
    ) external {
        if (msg.sender != factory) revert OnlyFactory();
        // dev == address(0) is allowed — means "unclaimed" (third-party launch)
        // Fees will go to escrow in the FeeVault until a dev verifies

        PoolId poolId = key.toId();
        isRegisteredPool[poolId] = true;
        sigilTokenIsToken0[poolId] = tokenIsCurrency0;
        poolDev[poolId] = dev;

        emit PoolRegistered(
            poolId,
            dev,
            tokenIsCurrency0 ? Currency.unwrap(key.currency0) : Currency.unwrap(key.currency1),
            tokenIsCurrency0 ? Currency.unwrap(key.currency1) : Currency.unwrap(key.currency0)
        );
    }

    /// @notice Update the dev address for a pool after verification.
    ///         Also assigns any escrowed fees in the vault to the new dev.
    ///         Only callable by owner (backend after dev verification).
    function updatePoolDev(PoolId poolId, address newDev) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newDev == address(0)) revert ZeroAddress();
        if (!isRegisteredPool[poolId]) revert PoolNotRegistered();

        address oldDev = poolDev[poolId];
        poolDev[poolId] = newDev;

        // If the old dev was address(0) (unclaimed), assign escrowed fees
        if (oldDev == address(0)) {
            feeVault.assignDev(PoolId.unwrap(poolId), newDev);
        }

        emit PoolDevUpdated(poolId, oldDev, newDev);
    }

    // ─── Hook Implementations ────────────────────────────

    /// @dev Validate that pool is registered when initialized
    function _beforeInitialize(address, PoolKey calldata key, uint160)
        internal
        view
        override
        returns (bytes4)
    {
        if (!isRegisteredPool[key.toId()]) revert PoolNotRegistered();
        return this.beforeInitialize.selector;
    }

    /// @dev Allow liquidity adds only from the factory (initial liquidity placement)
    /// After initial placement, LP is locked — no external adds allowed.
    function _beforeAddLiquidity(
        address sender,
        PoolKey calldata key,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal view override returns (bytes4) {
        // Only factory can add liquidity (initial placement)
        // This ensures LP is locked from the start
        if (sender != factory) revert OnlyFactory();
        return this.beforeAddLiquidity.selector;
    }

    /// @dev Block ALL liquidity removal. LP is permanently locked.
    function _beforeRemoveLiquidity(
        address,
        PoolKey calldata,
        ModifyLiquidityParams calldata,
        bytes calldata
    ) internal pure override returns (bytes4) {
        // Permanently locked — nobody can remove liquidity
        revert("SIGIL: LP_LOCKED");
    }

    /// @dev Core fee collection logic.
    ///      Takes 1% of swap output, splits 80/20 between dev and protocol.
    function _afterSwap(
        address,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata
    ) internal override returns (bytes4, int128) {
        PoolId poolId = key.toId();

        // Only collect fees on registered Sigil pools
        if (!isRegisteredPool[poolId]) {
            return (this.afterSwap.selector, 0);
        }

        // Determine the output amount and currency
        // For exact input (amountSpecified < 0):
        //   zeroForOne: output is token1 (delta.amount1 is positive = tokens out)
        //   oneForZero: output is token0 (delta.amount0 is positive = tokens out)
        bool isExactInput = params.amountSpecified < 0;

        int128 outputAmount;
        Currency feeCurrency;

        if (isExactInput) {
            if (params.zeroForOne) {
                outputAmount = delta.amount1();
                feeCurrency = key.currency1;
            } else {
                outputAmount = delta.amount0();
                feeCurrency = key.currency0;
            }
        } else {
            // Exact output: the "input" side has the unspecified delta
            // Fee on the input token the user pays
            if (params.zeroForOne) {
                outputAmount = delta.amount0();
                feeCurrency = key.currency0;
            } else {
                outputAmount = delta.amount1();
                feeCurrency = key.currency1;
            }
        }

        // Get absolute value of the output
        uint128 absOutput = uint128(outputAmount < 0 ? -outputAmount : outputAmount);
        if (absOutput == 0) return (this.afterSwap.selector, 0);

        // Calculate 1% total fee
        uint256 totalFee = uint256(absOutput) * TOTAL_FEE_BPS / BPS_DENOMINATOR;
        if (totalFee == 0) return (this.afterSwap.selector, 0);

        // Take fee tokens from the pool into this contract
        poolManager.take(feeCurrency, address(this), totalFee);

        address feeToken = Currency.unwrap(feeCurrency);

        if (feeToken == usdc) {
            // ─── USDC fees: split 80/20 to dev/protocol via FeeVault ───
            uint256 devFee = totalFee * DEV_SHARE_BPS / BPS_DENOMINATOR;
            uint256 protocolFee = totalFee - devFee;
            address dev = poolDev[poolId];

            _approveFeeVault(feeToken, totalFee);
            feeVault.depositFees(PoolId.unwrap(poolId), dev, feeToken, devFee, protocolFee);

            emit FeesCollected(poolId, feeToken, totalFee, devFee, protocolFee);
        } else {
            // ─── Native token fees: forward entirely to token escrow ───
            IERC20(feeToken).transfer(tokenEscrow, totalFee);

            emit TokenFeesEscrowed(poolId, feeToken, totalFee);
        }

        // Return the hook delta — positive means we took from the swap output
        return (this.afterSwap.selector, totalFee.toInt128());
    }

    // ─── Internal Helpers ────────────────────────────────

    function _approveFeeVault(address token, uint256 amount) internal {
        // For native ETH (address(0)), we don't need approval
        if (token == address(0)) return;

        // Approve the fee vault to pull tokens
        (bool success,) = token.call(
            abi.encodeWithSignature("approve(address,uint256)", address(feeVault), amount)
        );
        require(success, "SIGIL: APPROVE_FAILED");
    }

    // ─── Admin ───────────────────────────────────────────

    function setProtocolTreasury(address newTreasury) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newTreasury == address(0)) revert ZeroAddress();
        emit ProtocolTreasuryUpdated(protocolTreasury, newTreasury);
        protocolTreasury = newTreasury;
    }

    function setTokenEscrow(address newEscrow) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newEscrow == address(0)) revert ZeroAddress();
        emit TokenEscrowUpdated(tokenEscrow, newEscrow);
        tokenEscrow = newEscrow;
    }

    function setOwner(address newOwner) external {
        if (msg.sender != owner) revert OnlyOwner();
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnerUpdated(owner, newOwner);
        owner = newOwner;
    }

    // ─── Views ───────────────────────────────────────────

    function getPoolInfo(PoolId poolId) external view returns (
        bool registered,
        address dev,
        bool tokenIsToken0
    ) {
        return (isRegisteredPool[poolId], poolDev[poolId], sigilTokenIsToken0[poolId]);
    }
}
