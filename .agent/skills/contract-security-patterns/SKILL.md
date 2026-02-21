---
name: contract-security-patterns
description: Security patterns and checklist distilled from Hal's V3 contract audit for Sigil. Use when creating or modifying any Solidity contract.
---

# Sigil Contract Security Patterns

Security patterns distilled from the V3 contract hardening audit (Feb 2026).
Use this checklist when creating or modifying any Solidity contract.

---

## 1. Uniswap V3 Swap Callbacks

> **CAUTION**: V3 swap callbacks are called by the **pool**, but anyone can call your callback directly.

**Pattern**: Always validate `msg.sender` via `v3Factory.getPool()`:

```solidity
function uniswapV3SwapCallback(
    int256 amount0Delta,
    int256 amount1Delta,
    bytes calldata data
) external {
    (address pool, address t0, address t1) = abi.decode(data, (address, address, address));
    require(msg.sender == pool, "INVALID_CALLER");
    require(v3Factory.getPool(t0, t1, POOL_FEE) == pool, "INVALID_POOL");

    if (amount0Delta > 0) IERC20(t0).transfer(msg.sender, uint256(amount0Delta));
    else if (amount1Delta > 0) IERC20(t1).transfer(msg.sender, uint256(amount1Delta));
    else revert("NO_PAYMENT_DUE");
}
```

**Why dual check**: Callback data is attacker-controlled. `v3Factory.getPool()` is the unforgeable on-chain source of truth.

---

## 2. NFT Ownership Verification

> **WARNING**: Never register/track an NFT without verifying the contract actually owns it.

```solidity
require(positionManager.ownerOf(tokenId) == address(this), "NFT_NOT_OWNED");
```

**Why**: Without this, phantom positions can be registered, breaking fee accounting assumptions.

---

## 3. Pair Validation

> **IMPORTANT**: Validate that LP positions are for expected token pairs.

```solidity
if (token0 != usdc && token1 != usdc) revert("NOT_USDC_PAIR");
```

**Why**: Prevents registering positions for unrelated pools, which could drain fees meant for legitimate pools.

---

## 4. General Patterns

| Pattern | Rule |
|---------|------|
| **Callback validation** | Never trust callback data alone — verify against immutable on-chain state |
| **Access control** | Use `onlyFactory`, `onlyOwner` modifiers consistently |
| **Ownership transfer** | Always use 2-step transfer (`transferOwnership` + `acceptOwnership`) |
| **Interface hygiene** | Add `ownerOf()`, `getPool()` etc. to minimal interfaces when needed for validation |
| **Token transfers** | Use safe transfer wrappers for non-standard ERC-20s (USDT, etc.) |
| **State before external** | Follow checks-effects-interactions: validate → update state → external calls |
| **Pause mechanism** | Include `whenNotPaused` on fee collection for emergency stops |
