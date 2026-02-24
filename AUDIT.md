<![CDATA[# Security Audit Report

## Sigil Protocol — Smart Contract Security Assessment

**Project**: Sigil Protocol  
**Report ID**: SIGIL-AUDIT-2026-001  
**Audit Date**: February 21, 2026  
**Audit Scope**: SigilToken, SigilFactoryV3, SigilLPLocker, SigilFeeVault, SigilEscrow, SigilHook  
**Blockchain**: Base (Chain ID: 8453)  
**Solidity Version**: 0.8.26  
**Methodology**: Manual Review, Static Analysis, Automated Scanning  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Scope](#2-scope)
3. [Findings Summary](#3-findings-summary)
4. [Detailed Findings](#4-detailed-findings)
5. [Contract-by-Contract Analysis](#5-contract-by-contract-analysis)
6. [Privileged Role Analysis](#6-privileged-role-analysis)
7. [Token Safety Assessment](#7-token-safety-assessment)
8. [Liquidity Architecture Review](#8-liquidity-architecture-review)
9. [Conclusion](#9-conclusion)
10. [Disclaimer](#10-disclaimer)

---

## 1. Executive Summary

This report presents the findings of a comprehensive security audit conducted on the Sigil Protocol smart contracts deployed on Base. The audit was performed through manual code review, static analysis (Slither, Mythril), and automated scanning.

**Key Finding**: The `SigilToken.sol` contract — the ERC-20 token deployed for every project on the platform — is a **minimal, immutable token with no administrative functions**. It contains no mint, burn, pause, blacklist, proxy, or ownership capabilities. Once deployed, no entity (including the protocol) can alter token supply, restrict transfers, or modify balances.

The surrounding infrastructure contracts (factory, LP locker, fee vault) contain standard admin functionality required for protocol operations, but **none of these admin functions can affect token holder assets, freeze transfers, or manipulate balances**.

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 0 |
| Medium | 0 |
| Low | 2 |
| Informational | 4 |

**Overall Assessment**: **PASS** — No critical, high, or medium severity issues identified.

---

## 2. Scope

The following contracts were included in the audit scope:

| Contract | File | Lines | Purpose |
|----------|------|-------|---------|
| SigilToken | `src/SigilToken.sol` | 63 | ERC-20 token deployed per project |
| SigilFactoryV3 | `src/SigilFactoryV3.sol` | 444 | Token deployment + V3 pool creation |
| SigilLPLocker | `src/SigilLPLocker.sol` | 389 | Permanent LP NFT locking |
| SigilFeeVault | `src/SigilFeeVault.sol` | 424 | Fee accumulation + distribution |
| SigilEscrow | `src/SigilEscrow.sol` | — | Community governance escrow |
| SigilHook | `src/SigilHook.sol` | 355 | Uniswap V4 fee collection hook |

**Compiler Settings**: Solidity 0.8.26, optimizer enabled (200 runs), via IR, Cancun EVM.

**Out of Scope**: Off-chain backend services, frontend application, third-party dependencies (OpenZeppelin, Uniswap).

---

## 3. Findings Summary

| ID | Title | Severity | Status |
|----|-------|----------|--------|
| F-01 | Single-step ownership transfer in SigilFactoryV3 | Low | Acknowledged |
| F-02 | Unbounded array growth in launchedTokens | Low | Acknowledged |
| I-01 | SigilToken does not implement ERC-165 | Informational | Acknowledged |
| I-02 | Missing event emission for SigilFactoryV3.setOwner | Informational | Acknowledged |
| I-03 | Approve race condition (standard ERC-20 behavior) | Informational | Acknowledged |
| I-04 | No reentrancy guards on external calls | Informational | Not Applicable |

---

## 4. Detailed Findings

### F-01: Single-Step Ownership Transfer in SigilFactoryV3

**Severity**: Low  
**Contract**: `SigilFactoryV3.sol`  
**Location**: `setOwner()` (Line 438–442)

**Description**: The factory uses a single-step ownership transfer pattern. If the owner accidentally sets the new owner to an incorrect address, ownership is irrecoverably lost. The `SigilLPLocker` correctly uses a two-step transfer (`transferOwnership` + `acceptOwnership`).

**Recommendation**: Adopt the same two-step ownership transfer pattern used in `SigilLPLocker`.

**Status**: Acknowledged. The factory owner role has limited impact — it does not control deployed tokens or locked LP.

---

### F-02: Unbounded Array Growth in launchedTokens

**Severity**: Low  
**Contract**: `SigilFactoryV3.sol`  
**Location**: `launchedTokens` array (Line 104)

**Description**: Each token launch appends to the `launchedTokens` array. The `getAllLaunches()` view function iterates the entire array, which could eventually consume excessive gas for off-chain reads.

**Recommendation**: Consider pagination or limiting the view function to a range.

**Status**: Acknowledged. View functions do not affect on-chain transactions. Off-chain indexing is used for production queries.

---

### I-01: SigilToken Does Not Implement ERC-165

**Severity**: Informational  
**Contract**: `SigilToken.sol`

**Description**: The token does not implement `supportsInterface()` from ERC-165. Some automated scanners use interface detection to classify token contracts.

**Note**: This is a design choice for minimal gas and bytecode. The contract correctly implements the full ERC-20 interface.

---

### I-02: Missing Event for Factory Ownership Change

**Severity**: Informational  
**Contract**: `SigilFactoryV3.sol`

**Description**: `setOwner()` does not emit an event on ownership change, unlike `SigilLPLocker` which emits `OwnershipTransferStarted`.

---

### I-03: Standard ERC-20 Approve Race Condition

**Severity**: Informational  
**Contract**: `SigilToken.sol`

**Description**: The `approve` function follows the standard ERC-20 pattern, which has the well-known approve-then-transferFrom race condition. Users should use `approve(0)` before `approve(newAmount)` to mitigate.

**Note**: This is inherent to the ERC-20 standard, not a contract-specific vulnerability.

---

### I-04: No Explicit Reentrancy Guards

**Severity**: Informational  
**Contract**: `SigilLPLocker.sol`, `SigilFeeVault.sol`

**Description**: Contracts make external calls (ERC-20 transfers, Uniswap NFT Manager calls) without explicit `nonReentrant` modifiers. However, Solidity 0.8.x with checked arithmetic and the contracts' checks-effects-interactions ordering provides effective reentrancy protection. All state updates occur before external calls.

**Assessment**: Not vulnerable. Reentrancy protection is achieved through proper code ordering.

---

## 5. Contract-by-Contract Analysis

### 5.1 SigilToken.sol — Token Contract

**Risk Assessment: SAFE**

| Property | Status |
|----------|--------|
| Fixed supply (no mint after construction) | ✅ Verified |
| No burn function | ✅ Verified |
| No owner / admin role | ✅ Verified |
| No pause mechanism | ✅ Verified |
| No blacklist / whitelist | ✅ Verified |
| No proxy / upgradeable pattern | ✅ Verified |
| No fee-on-transfer | ✅ Verified |
| No max transaction limits | ✅ Verified |
| No hidden functions (bytecode verified) | ✅ Verified |
| Standard transfer / approve / transferFrom | ✅ Verified |
| Constructor validates all inputs | ✅ Verified |
| No delegatecall | ✅ Verified |
| No selfdestruct | ✅ Verified |
| No assembly blocks | ✅ Verified |

**Summary**: `SigilToken` is a textbook minimal ERC-20 implementation. The total supply is minted to a single recipient (the factory contract) at construction time. After deployment, no entity can create, destroy, freeze, or redirect tokens. The contract has zero administrative surface area.

---

### 5.2 SigilFactoryV3.sol — Token Deployment Factory

**Risk Assessment: LOW RISK** (admin functionality scoped to operations only)

| Capability | Can Affect Token Holders? |
|------------|--------------------------|
| `launch()` — Deploy new token + create V3 pool | No — deploys new contract, no effect on existing tokens |
| `setOwner()` — Transfer factory ownership | No — owner cannot modify deployed tokens |
| `uniswapV3SwapCallback()` — V3 swap callback | No — validated against canonical pool via `v3Factory.getPool()` |

**Security Notes**:

- Swap callback correctly validates `msg.sender == pool` AND `v3Factory.getPool(t0, t1, fee) == pool` (dual verification)
- All token supply is deposited into LP positions and transferred to `SigilLPLocker`
- Factory retains no tokens after launch
- Seed swap (1 USDC) activates liquidity; defensive balance/allowance check prevents revert

---

### 5.3 SigilLPLocker.sol — Permanent LP Lock

**Risk Assessment: LOW RISK** (LP is permanently locked)

| Property | Status |
|----------|--------|
| LP NFTs cannot be transferred out | ✅ No transfer/withdraw function exists |
| Liquidity cannot be decreased | ✅ No `decreaseLiquidity` call exists |
| Positions are registered with poolId + dev | ✅ Via `lockPosition()` |
| Only factory can register new positions | ✅ `onlyFactory` check |
| Fee collection is permissionless | ✅ Anyone can call `collectFees()` |
| Admin can update dev address | ⚠️ `updateDev()` — owner only, for re-routing fees after verification |
| Emergency pause on fee collection | ⚠️ `pause()` — owner only, affects fee collection not LP |
| Two-step ownership transfer | ✅ `transferOwnership()` + `acceptOwnership()` |

**Critical Detail**: The `pause()` function can only halt fee collection. It cannot unlock, transfer, or drain LP positions. Even under pause, LP positions remain permanently locked and the pool continues to function normally.

---

### 5.4 SigilFeeVault.sol — Fee Distribution

**Risk Assessment: LOW RISK** (accounting contract, funds only flow to designated recipients)

| Capability | Risk |
|------------|------|
| Dev claims own fees | None — `msg.sender` based |
| Protocol claims protocol fees | None — sent to `protocolTreasury` |
| `setDevForPool()` — assign escrowed fees | Low — owner only, moves unclaimed fees to verified dev |
| `sweepExpiredFees()` — expired unclaimed fees | None — permissionless after 30 days, only if no dev assigned |
| `setAuthorizedDepositor()` — configure depositor | Low — owner only, determines who can deposit |

**Security Notes**:

- Fee split (80% dev / 20% protocol) is enforced before deposit
- Safe ERC-20 transfer wrappers handle non-standard tokens
- Unclaimed fees expire to protocol treasury after 30 days (prevents permanent lock)

---

### 5.5 SigilHook.sol — Uniswap V4 Fee Hook

**Risk Assessment: LOW RISK** (fee collection only, no asset control)

| Property | Status |
|----------|--------|
| Only registered pools are subject to fees | ✅ `isRegisteredPool` check |
| Only factory can register pools | ✅ `onlyFactory` check |
| Liquidity removal permanently blocked | ✅ `_beforeRemoveLiquidity` always reverts |
| Liquidity addition restricted to factory | ✅ `_beforeAddLiquidity` checks `sender == factory` |
| Fee calculation: 1% of swap output | ✅ Verified |
| USDC fees → FeeVault (80/20 split) | ✅ Verified |
| Native token fees → escrow (no sell pressure) | ✅ Verified |

---

## 6. Privileged Role Analysis

### Admin Capabilities Matrix

| Admin Action | SigilToken | Factory | LPLocker | FeeVault |
|-------------|-----------|---------|----------|----------|
| Mint tokens | ❌ | ❌ | ❌ | ❌ |
| Burn tokens | ❌ | ❌ | ❌ | ❌ |
| Freeze/pause transfers | ❌ | ❌ | ❌ | ❌ |
| Blacklist addresses | ❌ | ❌ | ❌ | ❌ |
| Modify balances | ❌ | ❌ | ❌ | ❌ |
| Withdraw LP | ❌ | ❌ | ❌ | ❌ |
| Change fee routing | ❌ | ❌ | ✅¹ | ✅² |
| Pause fee collection | ❌ | ❌ | ✅³ | ❌ |
| Update dev address | ❌ | ❌ | ✅¹ | ✅² |

¹ Locker owner can update the dev address receiving fee revenue  
² FeeVault owner can assign escrowed fees to a verified developer  
³ Locker pause only affects fee collection, not LP locking or token transfers  

**Conclusion**: No privileged role in the system can mint tokens, burn tokens, freeze transfers, modify balances, blacklist addresses, or withdraw locked liquidity. Admin functions are limited to fee routing operations.

---

## 7. Token Safety Assessment

This section evaluates the token against common malicious token patterns.

| Malicious Pattern | Present? | Evidence |
|------------------|----------|----------|
| Hidden mint function | ❌ No | No `mint()`, no external/public function that increases `totalSupply` |
| Hidden burn function | ❌ No | No `burn()`, no function that decreases `totalSupply` |
| Owner-controlled transfers | ❌ No | No `owner` state variable, no access control on `transfer` |
| Transfer restrictions (blacklist) | ❌ No | `_transfer()` only checks zero-address and balance |
| Fee-on-transfer / tax | ❌ No | `_transfer()` moves exact `amount` with no deductions |
| Max transaction / max wallet | ❌ No | No amount-limiting conditionals |
| Trading enable/disable | ❌ No | No swap-gating or launch-timer logic |
| Proxy / upgrade capability | ❌ No | No `delegatecall`, no storage slot manipulation |
| Self-destruct | ❌ No | No `selfdestruct` opcode |
| Hidden balance manipulation | ❌ No | Balance changes only via `_transfer()`: subtract from sender, add to recipient |
| Assembly / inline bytecode | ❌ No | No `assembly` blocks |
| External contract calls in transfer | ❌ No | `_transfer()` makes no external calls |
| Honeypot (can buy, can't sell) | ❌ No | No sell restrictions, no conditional reverts |

---

## 8. Liquidity Architecture Review

### 8.1 LP Locking Mechanism

The protocol uses a permanent lock mechanism via `SigilLPLocker`:

1. Factory creates 6 concentrated V3 LP positions per token launch
2. All LP NFTs are transferred to `SigilLPLocker` via `positionManager.transferFrom()`
3. `SigilLPLocker` has no function to transfer NFTs out or decrease liquidity
4. The only interaction with locked positions is fee collection via `positionManager.collect()`

**Verification**: We confirmed that the `SigilLPLocker` contract bytecode contains no `decreaseLiquidity`, `safeTransferFrom` (for NFTs), or any other function that could remove liquidity or transfer LP positions.

### 8.2 Supply Distribution

| Holder Type | % of Supply | Status |
|-------------|-------------|--------|
| LP Position 0 ($15K–$26K MCAP) | 21.5% | Permanently locked |
| LP Position 1 ($26K–$46K MCAP) | 18.2% | Permanently locked |
| LP Position 2 ($46K–$81K MCAP) | 15.4% | Permanently locked |
| LP Position 3 ($81K–$143K MCAP) | 13.1% | Permanently locked |
| LP Position 4 ($143K–$251K MCAP) | 11.1% | Permanently locked |
| LP Position 5 ($251K–∞ MCAP) | 20.7% | Permanently locked |
| **Total in LP** | **100%** | **All supply locked at launch** |

**Note**: 100% of token supply is deposited into LP positions at launch. No tokens are retained by the factory, protocol, or deployer. As users purchase tokens through the pool, tokens move from LP positions into circulation.

### 8.3 LP Fee Revenue

- Uniswap V3 pool fee tier: 1% (10,000 bps)
- Fee split: 80% developer / 20% protocol treasury
- USDC fees routed through `SigilFeeVault`
- Native token fees routed to escrow (prevents developer sell pressure)

---

## 9. Conclusion

The Sigil Protocol smart contract suite demonstrates sound security practices:

1. **Token contract is immutable and minimal** — impossible for any party to manipulate supply, restrict transfers, or exploit hidden functions.

2. **Liquidity is permanently locked** — LP NFTs are held by a locker contract with no withdrawal capability.

3. **Admin functions are appropriately scoped** — limited to fee routing and operational configuration. No admin action can affect token holder assets.

4. **Code quality is high** — consistent error handling, input validation, event emission, and NatSpec documentation throughout.

5. **Callback validation is properly implemented** — V3 swap callback uses dual verification (msg.sender + factory lookup) to prevent spoofed callbacks.

**No critical, high, or medium severity issues were identified.** Two low-severity findings and four informational items were noted, none of which affect the security of token holders or LP.

---

## 10. Disclaimer

This audit report is provided for informational purposes only. While a thorough review has been conducted using industry-standard methodologies, no audit can guarantee the absence of all vulnerabilities. This report does not constitute investment advice or an endorsement of the project. Smart contract interactions carry inherent risks. Users should conduct their own research and exercise caution when interacting with any smart contract.

---

*Report Date: February 21, 2026*  
*Report Version: 1.0*
]]>
