// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

// Note: PoolId is just bytes32 under the hood. We use bytes32 directly
// to avoid coupling to V4 imports (supports both V3 Locker and V4 Hook).

/// @title SigilFeeVault
/// @notice Accumulates swap fees and allows devs/protocol to claim.
///
///         Fee routing rules:
///         - 20% ALWAYS goes to protocol treasury
///         - 80% goes to the dev IF a dev wallet is specified at launch
///         - 80% goes to ESCROW if no dev wallet (third-party launch)
///         - Escrowed fees can be assigned to a dev after verification
///         - Escrowed fees expire to protocol treasury after 30 days
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
///         This vault accumulates and allows claims.
contract SigilFeeVault {
    // ─── Constants ──────────────────────────────────────

    /// @notice Unclaimed dev fees expire to protocol after 30 days
    uint256 public constant EXPIRY_PERIOD = 30 days;

    // ─── State ───────────────────────────────────────────

    /// @notice The authorized depositor (V3: LPLocker, V4: SigilHook)
    address public authorizedDepositor;

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

    // ─── Unclaimed/Escrow State ─────────────────────────

    /// @notice Unclaimed fees per pool per token: poolId => token => amount
    mapping(bytes32 => mapping(address => uint256)) public unclaimedFees;

    /// @notice Timestamp of first unclaimed deposit per pool
    mapping(bytes32 => uint256) public unclaimedDepositedAt;

    /// @notice Track which tokens have unclaimed fees per pool
    mapping(bytes32 => address[]) public unclaimedFeeTokens;
    mapping(bytes32 => mapping(address => bool)) internal _unclaimedHasToken;

    /// @notice Whether a pool has been assigned to a dev
    mapping(bytes32 => bool) public poolAssigned;

    // ─── Events ──────────────────────────────────────────

    event FeesDeposited(
        bytes32 indexed poolId,
        address indexed dev,
        address indexed token,
        uint256 devAmount,
        uint256 protocolAmount
    );
    event FeesEscrowed(
        bytes32 indexed poolId,
        address indexed token,
        uint256 amount
    );
    event DevAssigned(
        bytes32 indexed poolId,
        address indexed dev,
        uint256 tokensTransferred
    );
    event FeesExpired(
        bytes32 indexed poolId,
        address indexed token,
        uint256 amount
    );
    event DevFeesClaimed(address indexed dev, address indexed token, uint256 amount);
    event ProtocolFeesClaimed(address indexed token, uint256 amount, address to);
    event AuthorizedDepositorUpdated(address oldDepositor, address newDepositor);

    // ─── Errors ──────────────────────────────────────────

    error OnlyAuthorizedDepositor();
    error OnlyOwner();
    error ZeroAddress();
    error NothingToClaim();
    error TransferFailed();
    error PoolAlreadyAssigned();
    error NotExpiredYet();
    error NoUnclaimedFees();

    // ─── Constructor ─────────────────────────────────────

    constructor(address _protocolTreasury) {
        if (_protocolTreasury == address(0)) revert ZeroAddress();
        protocolTreasury = _protocolTreasury;
        owner = msg.sender;
    }

    // ─── Modifiers ───────────────────────────────────────

    modifier onlyAuthorized() {
        if (msg.sender != authorizedDepositor) revert OnlyAuthorizedDepositor();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert OnlyOwner();
        _;
    }

    // ─── Fee Deposits (from Hook or Locker) ──────────────

    /// @notice Deposit fees from the authorized depositor (V3 Locker or V4 Hook).
    function depositFees(
        bytes32 poolId,
        address dev,
        address token,
        uint256 devAmount,
        uint256 protocolAmount
    ) external onlyAuthorized {
        uint256 totalAmount = devAmount + protocolAmount;

        // Pull tokens from the hook
        if (token == address(0)) {
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

        // Protocol 20% — ALWAYS goes to protocol
        protocolFees[token] += protocolAmount;
        totalProtocolFeesEarned[token] += protocolAmount;

        // Dev 80% — route based on whether dev is known
        if (dev != address(0)) {
            // ── Known dev: direct to their balance ──
            devFees[dev][token] += devAmount;
            totalDevFeesEarned[dev][token] += devAmount;

            if (!_devHasToken[dev][token]) {
                _devHasToken[dev][token] = true;
                devFeeTokens[dev].push(token);
            }

            emit FeesDeposited(poolId, dev, token, devAmount, protocolAmount);
        } else {
            // ── Unknown dev: escrow under poolId ──
            bytes32 poolKey = poolId;

            unclaimedFees[poolKey][token] += devAmount;

            // Set timestamp on first deposit
            if (unclaimedDepositedAt[poolKey] == 0) {
                unclaimedDepositedAt[poolKey] = block.timestamp;
            }

            // Track token list
            if (!_unclaimedHasToken[poolKey][token]) {
                _unclaimedHasToken[poolKey][token] = true;
                unclaimedFeeTokens[poolKey].push(token);
            }

            emit FeesEscrowed(poolId, token, devAmount);
        }
    }

    // ─── Dev Assignment (after verification) ─────────────

    /// @notice Assign a verified dev to an unclaimed pool's escrowed fees.
    function assignDev(bytes32 poolId, address dev) external onlyOwner {
        if (dev == address(0)) revert ZeroAddress();

        bytes32 poolKey = poolId;
        if (poolAssigned[poolKey]) revert PoolAlreadyAssigned();

        address[] storage tokens = unclaimedFeeTokens[poolKey];
        uint256 len = tokens.length;
        if (len == 0) revert NoUnclaimedFees();

        uint256 totalTransferred = 0;

        // Move all escrowed fees to the dev's balance
        for (uint256 i; i < len; ++i) {
            address token = tokens[i];
            uint256 amount = unclaimedFees[poolKey][token];
            if (amount > 0) {
                unclaimedFees[poolKey][token] = 0;
                devFees[dev][token] += amount;
                totalDevFeesEarned[dev][token] += amount;
                totalTransferred += amount;

                if (!_devHasToken[dev][token]) {
                    _devHasToken[dev][token] = true;
                    devFeeTokens[dev].push(token);
                }
            }
        }

        poolAssigned[poolKey] = true;

        emit DevAssigned(poolId, dev, totalTransferred);
    }

    // ─── Expiry Sweep ────────────────────────────────────

    /// @notice Sweep expired unclaimed fees to protocol treasury.
    ///         Anyone can call this after the 30-day expiry period.
    /// @param poolId The pool whose unclaimed fees to sweep
    function sweepExpiredFees(bytes32 poolId) external {
        bytes32 poolKey = poolId;

        uint256 depositedAt = unclaimedDepositedAt[poolKey];
        if (depositedAt == 0) revert NoUnclaimedFees();
        if (block.timestamp < depositedAt + EXPIRY_PERIOD) revert NotExpiredYet();
        if (poolAssigned[poolKey]) revert PoolAlreadyAssigned();

        address[] storage tokens = unclaimedFeeTokens[poolKey];
        uint256 len = tokens.length;

        for (uint256 i; i < len; ++i) {
            address token = tokens[i];
            uint256 amount = unclaimedFees[poolKey][token];
            if (amount > 0) {
                unclaimedFees[poolKey][token] = 0;
                protocolFees[token] += amount;

                emit FeesExpired(poolId, token, amount);
            }
        }

        // Reset the timestamp so future fees get a fresh 30-day window
        unclaimedDepositedAt[poolKey] = 0;
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

    /// @notice Get unclaimed fee balances for a pool
    function getUnclaimedFeeBalances(bytes32 poolId) external view returns (
        address[] memory tokens,
        uint256[] memory balances,
        uint256 depositedAt,
        bool expired,
        bool assigned
    ) {
        bytes32 poolKey = poolId;
        tokens = unclaimedFeeTokens[poolKey];
        balances = new uint256[](tokens.length);
        for (uint256 i; i < tokens.length; ++i) {
            balances[i] = unclaimedFees[poolKey][tokens[i]];
        }
        depositedAt = unclaimedDepositedAt[poolKey];
        expired = depositedAt > 0 && block.timestamp >= depositedAt + EXPIRY_PERIOD;
        assigned = poolAssigned[poolKey];
    }

    /// @notice Get lifetime earnings for a dev across a specific token
    function getDevLifetimeEarnings(address dev, address token) external view returns (uint256) {
        return totalDevFeesEarned[dev][token];
    }

    // ─── Admin ───────────────────────────────────────────

    /// @notice Set the authorized depositor (V3: LPLocker, V4: Hook).
    function setAuthorizedDepositor(address _depositor) external onlyOwner {
        if (_depositor == address(0)) revert ZeroAddress();
        emit AuthorizedDepositorUpdated(authorizedDepositor, _depositor);
        authorizedDepositor = _depositor;
    }

    /// @notice Legacy alias for backwards compatibility
    function setHook(address _hook) external onlyOwner {
        if (_hook == address(0)) revert ZeroAddress();
        emit AuthorizedDepositorUpdated(authorizedDepositor, _hook);
        authorizedDepositor = _hook;
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
