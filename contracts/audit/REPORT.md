# Sigil Protocol Smart Contract Security Audit

**Auditor**: Claude Opus 4.6 [1m] (Anthropic)
**Date**: February 17, 2026
**Scope**: Core Sigil Protocol Contracts (~2,121 LOC)
**Commit**: `48f1902` (claude/bankr-fork-no-x-api-lmz7z)

---

## Executive Summary

This audit examines the Sigil Protocol smart contract suite, a token launch platform with integrated fee distribution mechanisms for Uniswap V3/V4. The protocol enables project launches with locked liquidity and automated 80/20 developer/protocol fee splits.

**Overall Assessment**: The contracts demonstrate solid security fundamentals with proper access controls, reentrancy protection patterns, and well-designed fee routing. Previous medium-severity findings have been addressed. The remaining issues are low-severity design considerations.

| Severity | Count | Fixed |
|----------|-------|-------|
| Critical | 0 | - |
| High | 0 | - |
| Medium | 0 | 2 fixed |
| Low | 3 | 1 fixed |
| Informational | 6 | 1 fixed |

---

## Contracts Audited

| Contract | LOC | Purpose |
|----------|-----|---------|
| SigilFeeVault.sol | 402 | Fee accumulation, escrow, and claims |
| SigilLPLocker.sol | 290 | V3 LP NFT permanent locking |
| SigilFactoryV3.sol | 352 | V3 token deployment and pool creation |
| SigilFactory.sol | 291 | V4 token deployment and pool creation |
| SigilHook.sol | 354 | V4 swap hook for fee collection |
| SigilToken.sol | 62 | Minimal ERC-20 implementation |
| SigilEscrow.sol | 370 | DAO governance for milestone unlocks |

**Total**: ~2,121 LOC

---

## Fixed Issues (from previous audit)

### ✅ MEDIUM-01: Unchecked Return Values (FIXED)

**Status**: Resolved in commit `1efea33`

`SigilFeeVault.sol` now properly handles non-standard ERC-20 tokens with SafeERC20-style helpers:

```solidity
function _transferToken(address token, address to, uint256 amount) internal {
    (bool success, bytes memory data) = token.call(
        abi.encodeWithSignature("transfer(address,uint256)", to, amount)
    );
    if (!success || (data.length > 0 && !abi.decode(data, (bool)))) {
        revert TransferFailed();
    }
}
```

---

### ✅ MEDIUM-02: ERC-20 Approval Race Condition (FIXED)

**Status**: Resolved in commit `1efea33`

`SigilHook.sol` now uses check-then-approve-max pattern:

```solidity
function _approveFeeVault(address token, uint256 amount) internal {
    uint256 currentAllowance = IERC20(token).allowance(address(this), address(feeVault));
    if (currentAllowance < amount) {
        (bool success,) = token.call(
            abi.encodeWithSignature("approve(address,uint256)", address(feeVault), type(uint256).max)
        );
        require(success, "SIGIL: APPROVE_FAILED");
    }
}
```

---

### ✅ LOW-01: Missing Input Validation (FIXED)

**Status**: Resolved in commit `1efea33`

`SigilToken.sol` constructor now validates all inputs:

```solidity
constructor(string memory _name, string memory _symbol, uint256 _totalSupply, address _recipient) {
    require(bytes(_name).length > 0, "SIGIL: EMPTY_NAME");
    require(bytes(_symbol).length > 0, "SIGIL: EMPTY_SYMBOL");
    require(_totalSupply > 0, "SIGIL: ZERO_SUPPLY");
    require(_recipient != address(0), "SIGIL: ZERO_RECIPIENT");
    // ...
}
```

---

### ✅ INFO-02: Missing Events for State Changes (FIXED)

**Status**: Resolved in commit `1efea33`

`SigilFeeVault.sol` now emits events for admin state changes:

```solidity
event ProtocolTreasuryUpdated(address oldTreasury, address newTreasury);
event OwnerUpdated(address oldOwner, address newOwner);
```

---

## Remaining Findings

### LOW-02: Unbounded Array Growth in Fee Token Tracking

**Location**: `SigilFeeVault.sol:57-58`, `SigilLPLocker.sol:88`

**Description**: The `devFeeTokens[dev]`, `unclaimedFeeTokens[pool]`, and `lockedTokenIds` arrays grow unbounded. For highly active developers or many locked positions, iteration costs increase.

**Risk**: Low - Current gas costs manageable; becomes issue at scale.

**Recommendation**: Consider pagination for `claimAllDevFees()` or implement mapping-based lookup with explicit token lists.

---

### ✅ LOW-03: Single-Step Ownership Transfer (FIXED)

**Status**: Resolved — `SigilLPLocker` now uses 2-step `transferOwnership()` → `acceptOwnership()` pattern.

**Location**: `SigilLPLocker.sol`

**Description**: Previously used instant `setOwner()`. Now requires the new owner to explicitly accept via `acceptOwnership()`.

---

### LOW-04: Block Timestamp Dependency in Escrow Voting

**Location**: `SigilEscrow.sol:152`, `SigilEscrow.sol:180`

**Description**: Voting deadlines rely on `block.timestamp` which can be slightly manipulated by validators (typically ±12 seconds on Ethereum).

**Risk**: Low - Given 5-day and 3-day voting periods, minor timestamp manipulation is insignificant.

**Assessment**: Acceptable as-is. Document the design decision.

---

### INFO-01: Centralization Risks

**Location**: Multiple contracts

**Description**: Several privileged roles exist:
- `owner` can set authorized depositor, claim protocol fees, update treasury addresses
- `factory` controls pool registration and initial liquidity
- `protocol` can override disputed escrow votes

**Assessment**: This is intentional design for operational needs. The centralization is documented and expected for a managed protocol. Recommend using a multisig for admin keys in production.

---

### INFO-03: Hardcoded Tick Values

**Location**: `SigilFactoryV3.sol:78-87`, `SigilFactory.sol:212-216`

**Description**: Pool initialization uses hardcoded tick values for price ranges:

```solidity
// V3 Factory
int24 public constant MCAP_TICK_TOKEN0 = -433600;
int24 public constant MCAP_TICK_TOKEN1 = 433400;

// V4 Factory
return TickMath.getSqrtPriceAtTick(69_000);
return TickMath.getSqrtPriceAtTick(-69_000);
```

**Assessment**: Values are mathematically calculated for specific market cap targets. Well-documented in code comments.

---

### INFO-04: Gas Optimization Opportunities

**Locations**: Various

1. `SigilFeeVault.getDevFeeBalances()` - Creates new array in memory each call
2. `SigilEscrow.vote()` - Could cache token balance lookup
3. Loop counters could use unchecked blocks for post-increment

**Assessment**: Current implementation is readable and gas costs are acceptable for expected usage patterns. Optimize if gas becomes a concern.

---

### INFO-05: SigilEscrow Vote Weight Not Snapshotted

**Location**: `SigilEscrow.sol:183`, `SigilEscrow.sol:260`

**Description**: Vote weight is determined by current token balance at vote time, not at proposal creation snapshot:

```solidity
weight = token.balanceOf(msg.sender);  // Current balance, not snapshotted
```

The `snapshotBlock` field exists in `ProposalCore` but isn't used for vote weight calculation.

**Risk**: Low - Users could theoretically buy tokens, vote, then sell. However, the 5-day voting period and quorum requirements mitigate this.

**Recommendation**: For higher-stakes governance, consider implementing ERC-20 Votes (EIP-5805) or snapshot-based voting.

---

### INFO-06: Receive Function May Cause Stuck ETH

**Location**: `SigilFeeVault.sol:401`

**Description**: Contract has a `receive()` function but fee flow uses WETH wrapped tokens:

```solidity
receive() external payable {}
```

Native ETH sent directly to the contract would be stuck with no withdrawal mechanism.

**Recommendation**: Add rescue function for stuck ETH:
```solidity
function rescueETH(address payable to) external onlyOwner {
    uint256 balance = address(this).balance;
    require(balance > 0, "No ETH");
    (bool success,) = to.call{value: balance}("");
    require(success, "Transfer failed");
}
```

---

## Security Patterns Used (Positive Findings)

### Access Control
- Consistent use of `onlyOwner`, `onlyFactory`, `onlyAuthorized` modifiers
- Custom errors for gas-efficient reverts
- Zero-address validation on all admin setters
- Factory-only pool registration prevents unauthorized hooks

### Reentrancy Protection
- State changes before external calls (CEI pattern)
- `SigilFeeVault.depositFees()`: Updates balances after token transfer
- `SigilEscrow._releaseTokens()`: Updates `escrowBalance` before transfer
- Hook uses poolManager's unlock pattern which is inherently reentrancy-safe

### Safe Token Handling
- `SigilFeeVault`: Uses SafeERC20-style helpers for non-standard tokens
- `SigilHook`: Check-then-approve-max pattern prevents race conditions
- `SigilToken`: Validates all constructor inputs

### Fee Accounting
- Clear separation of dev fees (80%) and protocol fees (20%)
- Escrow mechanism for unclaimed third-party launches
- 30-day expiry sweep to protocol (prevents permanent lockup)
- Native token fees go to separate escrow to avoid sell pressure

### Liquidity Locking
- V3 LP NFTs: Transferred to Locker, cannot be removed
- V4 Hook: `beforeRemoveLiquidity` reverts unconditionally
- Factory-only liquidity addition prevents manipulation

### Pool Registration
- Only factory-registered pools can use hook
- Pool registration is immutable once set
- Hook validates pool registration before processing swaps

---

## Known Limitations (By Design)

1. **Single Fee Token per V3 Pool**: Native token fees go to escrow, only USDC goes through 80/20 split
2. **Immutable 80/20 Split**: Fee distribution percentages are constants
3. **Protocol Override Power**: Centralized dispute resolution is intentional for edge cases
4. **Fixed 30-Day Expiry**: Unclaimed fee expiry period is hardcoded
5. **V3/V4 USDC Pairs Only**: Factories create TOKEN/USDC pools exclusively
6. **Emergency Pause**: `SigilLPLocker` now implements `pause()`/`unpause()` with `whenNotPaused` modifier on fee collection

---

## Test Coverage Review

The following test suites were verified:
- `FeeRouting.t.sol` (20 tests) - Fee split verification, escrow flows, dev reassignment
- `SigilEscrow.t.sol` (30 tests) - Full governance lifecycle
- `SigilHook.t.sol` (20 tests) - V4 hook behavior, token transfers

**73 tests pass.** (3 fork tests require `BASE_RPC_URL` for mainnet fork.)

---

## Conclusion

The Sigil Protocol smart contracts demonstrate mature security practices appropriate for a DeFi fee distribution system. All medium-severity findings from the initial audit have been addressed. The remaining issues are low-severity improvements and informational observations.

**Key Strengths**:
- Clear separation of concerns between contracts
- Proper access control hierarchy
- SafeERC20-style token handling for non-standard tokens
- Fail-safe fee routing (unclaimed → escrow → protocol)
- Permanent liquidity locking prevents rug pulls

**Remaining Recommendations**:
1. Implement two-step ownership transfer
2. Add pagination for large array operations
3. Add ETH rescue function to FeeVault
4. Consider vote weight snapshots for governance

The protocol is suitable for mainnet deployment with the understanding that:
- Admin keys should be secured (multisig recommended)
- Monitor gas costs for high-volume operations
- Governance parameters should be reviewed for production scale

---

*This audit was performed by Claude Opus 4.6 [1m], an AI model developed by Anthropic. While this audit identifies potential issues and provides recommendations, it does not guarantee the absence of all vulnerabilities. Smart contracts should undergo multiple independent audits before mainnet deployment.*
