// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolId} from "@uniswap/v4-core/src/types/PoolId.sol";
import {ISigilFeeVault} from "./interfaces/ISigilFeeVault.sol";

/// @title SigilFeeVault
/// @notice Accumulates swap fees and allows devs/protocol to claim.
///
///         Design principle: Fees are NOT converted. Whatever token the fee was
///         collected in, that's what accumulates. In a TOKEN/WETH pool:
///         - Buys (WETH → TOKEN): fee is in TOKEN → dev earns native token
///         - Sells (TOKEN → WETH): fee is in WETH → dev earns WETH
///
///         This means devs naturally earn a mix of their native token and WETH/USDC
///         from trading activity WITHOUT any forced sells. No dump pressure.
///
///         The 80/20 split is enforced by the hook before deposit.
///         This vault simply accumulates and allows claims.
contract SigilFeeVault is ISigilFeeVault {
    // ─── State ───────────────────────────────────────────

    /// @notice The SigilHook address — only it can deposit fees
    address public hook;

    /// @notice Protocol treasury for the 20% cut
    address public protocolTreasury;

    /// @notice Owner for admin
    address public owner;

    /// @notice Dev fee balances: dev => token => amount
    mapping(address => mapping(address => uint256)) public devFees;

    /// @notice Protocol fee balances: token => amount
    mapping(address => uint256) public protocolFees;

    /// @notice Total fees ever deposited per dev per token (for analytics)
    mapping(address => mapping(address => uint256)) public totalDevFeesEarned;

    /// @notice Total fees ever deposited for protocol per token
    mapping(address => uint256) public totalProtocolFeesEarned;

    /// @notice Track which tokens a dev has earned fees in
    mapping(address => address[]) public devFeeTokens;
    mapping(address => mapping(address => bool)) internal _devHasToken;

    // ─── Events ──────────────────────────────────────────

    event FeesDeposited(
        PoolId indexed poolId,
        address indexed dev,
        address indexed token,
        uint256 devAmount,
        uint256 protocolAmount
    );
    event DevFeesClaimed(address indexed dev, address indexed token, uint256 amount);
    event ProtocolFeesClaimed(address indexed token, uint256 amount, address to);
    event HookUpdated(address oldHook, address newHook);

    // ─── Errors ──────────────────────────────────────────

    error OnlyHook();
    error OnlyOwner();
    error ZeroAddress();
    error NothingToClaim();
    error TransferFailed();

    // ─── Constructor ─────────────────────────────────────

    constructor(address _protocolTreasury) {
        if (_protocolTreasury == address(0)) revert ZeroAddress();
        protocolTreasury = _protocolTreasury;
        owner = msg.sender;
    }

    // ─── Modifiers ───────────────────────────────────────

    modifier onlyHook() {
        if (msg.sender != hook) revert OnlyHook();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ─── Fee Deposits (from Hook) ────────────────────────

    /// @inheritdoc ISigilFeeVault
    function depositFees(
        PoolId poolId,
        address dev,
        address token,
        uint256 devAmount,
        uint256 protocolAmount
    ) external onlyHook {
        uint256 totalAmount = devAmount + protocolAmount;

        // Pull tokens from the hook
        if (token == address(0)) {
            // Native ETH — should be sent as msg.value
            // For V4, fees are typically in WETH, not native ETH
            revert("SIGIL: USE_WETH");
        }

        // Transfer tokens from hook to this vault
        (bool success,) = token.call(
            abi.encodeWithSignature(
                "transferFrom(address,address,uint256)",
                msg.sender,
                address(this),
                totalAmount
            )
        );
        if (!success) revert TransferFailed();

        // Accumulate balances
        devFees[dev][token] += devAmount;
        protocolFees[token] += protocolAmount;

        // Track lifetime earnings
        totalDevFeesEarned[dev][token] += devAmount;
        totalProtocolFeesEarned[token] += protocolAmount;

        // Track token list for dev
        if (!_devHasToken[dev][token]) {
            _devHasToken[dev][token] = true;
            devFeeTokens[dev].push(token);
        }

        emit FeesDeposited(poolId, dev, token, devAmount, protocolAmount);
    }

    // ─── Dev Claims ──────────────────────────────────────

    /// @notice Claim accumulated fees for a specific token.
    /// @param token The token to claim fees in
    function claimDevFees(address token) external {
        uint256 amount = devFees[msg.sender][token];
        if (amount == 0) revert NothingToClaim();

        devFees[msg.sender][token] = 0;

        _transferToken(token, msg.sender, amount);

        emit DevFeesClaimed(msg.sender, token, amount);
    }

    /// @notice Claim all accumulated fees across all tokens.
    function claimAllDevFees() external {
        address[] storage tokens = devFeeTokens[msg.sender];
        uint256 len = tokens.length;

        bool claimed = false;
        for (uint256 i; i < len; ++i) {
            address token = tokens[i];
            uint256 amount = devFees[msg.sender][token];
            if (amount > 0) {
                devFees[msg.sender][token] = 0;
                _transferToken(token, msg.sender, amount);
                emit DevFeesClaimed(msg.sender, token, amount);
                claimed = true;
            }
        }

        if (!claimed) revert NothingToClaim();
    }

    // ─── Protocol Claims ─────────────────────────────────

    /// @notice Claim protocol fees for a specific token. Only owner.
    /// @param token The token to claim
    function claimProtocolFees(address token) external onlyOwner {
        uint256 amount = protocolFees[token];
        if (amount == 0) revert NothingToClaim();

        protocolFees[token] = 0;

        _transferToken(token, protocolTreasury, amount);

        emit ProtocolFeesClaimed(token, amount, protocolTreasury);
    }

    // ─── Views ───────────────────────────────────────────

    /// @notice Get all pending fee balances for a dev
    function getDevFeeBalances(address dev) external view returns (
        address[] memory tokens,
        uint256[] memory balances
    ) {
        tokens = devFeeTokens[dev];
        balances = new uint256[](tokens.length);
        for (uint256 i; i < tokens.length; ++i) {
            balances[i] = devFees[dev][tokens[i]];
        }
    }

    /// @notice Get lifetime earnings for a dev across a specific token
    function getDevLifetimeEarnings(address dev, address token) external view returns (uint256) {
        return totalDevFeesEarned[dev][token];
    }

    // ─── Admin ───────────────────────────────────────────

    /// @notice Set the hook address. Can only be set once (or by owner).
    function setHook(address _hook) external onlyOwner {
        if (_hook == address(0)) revert ZeroAddress();
        emit HookUpdated(hook, _hook);
        hook = _hook;
    }

    function setProtocolTreasury(address _treasury) external onlyOwner {
        if (_treasury == address(0)) revert ZeroAddress();
        protocolTreasury = _treasury;
    }

    function setOwner(address _newOwner) external onlyOwner {
        if (_newOwner == address(0)) revert ZeroAddress();
        owner = _newOwner;
    }

    // ─── Internal ────────────────────────────────────────

    function _transferToken(address token, address to, uint256 amount) internal {
        (bool success,) = token.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        if (!success) revert TransferFailed();
    }

    /// @notice Accept ETH (in case of WETH unwrap edge cases)
    receive() external payable {}
}
