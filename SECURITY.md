# Sigil Security Architecture

## Overview

Sigil is a token launchpad on Base (L2). Tokens deployed through Sigil are **minimal, immutable ERC-20 contracts** with no admin functions. All supply is deposited as liquidity in Uniswap V3 concentrated positions and locked permanently.

---

## Token Contract (`SigilToken.sol`)

Every token launched through Sigil uses the same `SigilToken.sol` contract:

- **Fixed supply** — minted once in the constructor, no `mint()` function exists
- **No burn** — no `burn()` function exists
- **No owner** — no `owner`, `admin`, or `Ownable` pattern
- **No pause** — no `pause()` or `unpause()` function
- **No blacklist** — no `blocklist()`, `deny()`, or transfer restrictions
- **No proxy** — not upgradeable, no `delegatecall`
- **Standard ERC-20** — `transfer`, `transferFrom`, `approve`, `allowance`, `balanceOf`

The full source is verified on Basescan for every deployed token.

---

## Liquidity Architecture

### LP Locking (`SigilLPLocker.sol`)

All liquidity is **permanently locked**:

1. Factory creates 6 concentrated LP positions via Uniswap V3 `NonfungiblePositionManager`
2. All 6 LP NFTs are transferred to `SigilLPLocker`
3. The Locker has **no `decreaseLiquidity`** capability — liquidity cannot be removed
4. The Locker has **no `transferFrom`** for NFTs — positions cannot be moved out
5. LP fees are collected and routed: 80% to developer, 20% to protocol

### LP Position Distribution

| Position | MCAP Range | Supply % |
|----------|-----------|----------|
| 0 | $15K → $26K | 21.5% |
| 1 | $26K → $46K | 18.2% |
| 2 | $46K → $81K | 15.4% |
| 3 | $81K → $143K | 13.1% |
| 4 | $143K → $251K | 11.1% |
| 5 | $251K → ∞ | 20.7% |

---

## Fee System (`SigilFeeVault.sol`)

- 1% swap fee on every trade (V3 LP fee tier)
- 80% of USDC fees → developer wallet
- 20% of USDC fees → protocol treasury
- Native token fees → community escrow (no sell pressure)

---

## Admin Functions

Admin functions exist only on **infrastructure contracts** (factory, locker, fee vault), NOT on the token itself:

| Contract | Admin Function | Purpose |
|----------|---------------|---------|
| SigilLPLocker | `updateDev()` | Reassign fee recipient after developer verification |
| SigilLPLocker | `pause()`/`unpause()` | Emergency halt fee collection only |
| SigilLPLocker | `setFeeVault()` | Migrate to upgraded fee vault |
| SigilFeeVault | `setDevForPool()` | Assign escrowed fees to verified developer |
| SigilFeeVault | `setAuthorizedDepositor()` | Configure which contract can deposit fees |
| SigilFactoryV3 | `setOwner()` | Transfer factory ownership |

**None of these functions can**:
- Mint or burn tokens
- Freeze or restrict transfers
- Modify token balances
- Withdraw or rug liquidity

---

## Deployed Contracts (Base Mainnet)

| Contract | Purpose |
|----------|---------|
| `SigilFactoryV3` | Deploys tokens and creates V3 pools |
| `SigilLPLocker` | Permanently holds LP NFTs |
| `SigilFeeVault` | Accumulates and distributes swap fees |

---

## Contact

- GitHub: [heysigil](https://github.com/heysigil)
- Website: [heysigil.fund](https://heysigil.fund)
