---
name: sigil-project-playbook
description: Complete playbook distilled from the Sigil project — 298 commits of bugs, redesigns, security hardening, deployment lessons, smart contract evolution, and architectural decisions. Use this when starting or running any full-stack Web3 project to avoid repeating mistakes.
---

# Sigil Project Playbook

> Distilled from 298 commits across 5 days of building Sigil — a full-stack Web3 platform (Next.js frontend, Hono backend, Solidity contracts on Base, AI chat agent, Privy auth). Every section comes from real bugs hit, real redesigns done, and real production breakages fixed.

---

## Table of Contents

1. [Project Architecture Decisions](#1-project-architecture-decisions)
2. [Deployment & CI/CD Lessons](#2-deployment--cicd-lessons)
3. [Privy Authentication — The Full Saga](#3-privy-authentication--the-full-saga)
4. [Smart Contract Evolution (V3 → V4)](#4-smart-contract-evolution-v3--v4)
5. [Fee Pipeline Debugging](#5-fee-pipeline-debugging)
6. [Security Hardening Checklist](#6-security-hardening-checklist)
7. [Design System Evolution](#7-design-system-evolution)
8. [Refactoring Patterns That Worked](#8-refactoring-patterns-that-worked)
9. [AI Agent Integration Lessons](#9-ai-agent-integration-lessons)
10. [Wallet & Identity Management](#10-wallet--identity-management)
11. [Frontend Bug Patterns](#11-frontend-bug-patterns)
12. [Backend Bug Patterns](#12-backend-bug-patterns)
13. [UX Psychology Patterns Applied](#13-ux-psychology-patterns-applied)
14. [Performance Optimizations](#14-performance-optimizations)
15. [Post-Refactor Guardrails](#15-post-refactor-guardrails)
16. [Pre-Launch Checklist Template](#16-pre-launch-checklist-template)

---

## 1. Project Architecture Decisions

### Stack Selection
| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js 15 (App Router) | SSR for OAuth callbacks, SEO, server components |
| Backend | Hono on Bun | Lightweight, fast, Bun-native, OpenAPI support |
| Auth | Privy | Embedded wallets, social login, no custody liability |
| Database | PostgreSQL + Drizzle ORM | Type-safe queries, migration system, Railway-hosted |
| Contracts | Foundry + Solidity | Fast tests, mainnet forking, reliable deploys |
| Chain | Base (L2) | Low gas (~$0.05/launch), EAS deployed, growing ecosystem |
| AI Agent | Claude (Anthropic) | Multi-step tool use, structured outputs |
| Attestations | EAS (Ethereum Attestation Service) | Permissionless, multi-chain, proven, free to use |
| Cache | Redis | Session store, rate limiting, pub/sub |
| Logging | Pino | Structured JSON logs, log levels, production-safe |

### Monorepo Layout
```
root/
├── src/                  # Backend (Hono API, agent engine, services)
│   ├── agent/            # AI chat agent with tool definitions
│   ├── api/              # REST routes, middleware, OpenAPI spec
│   ├── verification/     # GitHub, domain, social verification
│   ├── attestation/      # EAS attestation creation
│   ├── db/               # Drizzle schema, migrations, repositories
│   └── services/         # Launch, trading, identity, wallet services
├── web/                  # Frontend (Next.js 15)
│   └── src/app/          # App Router pages, components, hooks
├── contracts/            # Foundry Solidity contracts
│   └── src/              # SigilFactory, FeeVault, Hook, Token, etc.
├── packages/             # Shared packages (SDK, MCP server)
├── test/                 # E2E tests, fixtures
└── scripts/              # Deploy, migration, schema registration
```

### Key Architectural Decision: Two Package Managers
- **Root (`/`)**: Uses `npm` (for Railway backend deploys)
- **Frontend (`/web`)**: Uses `Bun` (faster installs, native TS)
- This split caused **5+ deployment failures** before we locked it down
- **Rule**: NEVER run `npm install` in `/web` and NEVER run `bun install` in `/`

---

## 2. Deployment & CI/CD Lessons

### The Lockfile Wars (5 commits to fix)

**Timeline of pain:**
1. `fae3153` — regenerate bun.lock for Railway frozen-lockfile → failed
2. `8d77cfa` — add railway.toml to override frozen-lockfile → failed
3. `23cb655` — remove bun.lock, use npm/package-lock.json → failed
4. `c1bd353` — regenerate package-lock.json for npm ci → failed
5. `c523dd9` — sync web/package-lock.json for Railway CI → finally worked

**Lesson**: When Railway runs `bun install --frozen-lockfile`, it needs an up-to-date `bun.lock` that EXACTLY matches `package.json`. If you've been using `npm`, the lockfile is stale. Always use the correct package manager per directory.

### ESLint/Prettier Build Blockers (3 commits)
```
9acfbea → fix: downgrade prettier to warn to unblock Railway build
31536b5 → fix: skip eslint during next build (pre-existing prettier warnings)
02fdf22 → fix: disable prettier/prettier eslint rule to unblock Railway builds
```

**Lesson**: Pre-existing lint warnings can block production deploys when the CI treats warnings as errors. Fix early or configure `next.config.ts`:
```ts
eslint: { ignoreDuringBuilds: true }
```

### Vercel → Railway Migration
Started on Vercel, migrated to Railway when backend needed persistent processes (WebSocket, cron jobs, agent sessions).

**Vercel gotchas hit:**
- `ignoreCommand: exit 1` always builds (inverted logic)
- Missing `@types/node` fails build silently
- `next.config` complexity breaks edge functions

**Railway config that worked:**
```toml
[build]
buildCommand = "npm install && npm run build"

[deploy]
startCommand = "npm start"
```

### Environment Variable Rules
| Rule | Why |
|------|-----|
| Client-side vars MUST have `NEXT_PUBLIC_` prefix | Next.js strips unprefixed vars from client bundles |
| `NEXT_PUBLIC_` vars bake at BUILD time, not runtime | Must redeploy to pick up changes |
| Never commit `.env` files | Use `.env.example` as template |
| Check Railway env vars after every new feature | Missing vars cause silent failures |

---

## 3. Privy Authentication — The Full Saga

> This section documents 12+ commits spanning 3 days of Privy integration bugs. Every Web3 auth project will hit similar issues.

### The Problem Chain

**Phase 1: Initial Integration**
```
36fbf1d → feat: Privy login system, Sentinel security, portfolio sidebar
```
Worked locally, broke in production.

**Phase 2: Hook Ordering Catastrophe (4 commits)**
```
8028a0d → fix: eliminate conditional hook calls in useOptionalPrivy via context bridge
d230e29 → fix: redesign Privy hooks with context bridge — no conditional hooks
b445047 → fix: add missing useIsPrivyConfigured, usePrivyWallets, useOptionalWallets exports
f17b728 → fix: add null guard for privy in NavLoginButton
```

**Root cause**: React hooks cannot be called conditionally. The original `useOptionalPrivy` used a dynamic `require()` pattern that broke:
```tsx
// ❌ BROKEN — conditional hook call
function useOptionalPrivy() {
  try {
    const privy = require("@privy-io/react-auth");
    return privy.usePrivy();  // Hook called conditionally!
  } catch {
    return null;
  }
}
```

**Fix**: Context bridge pattern — wrap Privy in a provider, expose via context:
```tsx
// ✅ FIXED — static import, context bridge
const PrivyBridge = createContext<PrivyState | null>(null);

function PrivyBridgeProvider({ children }) {
  const privy = usePrivy();  // Always called
  return <PrivyBridge.Provider value={privy}>{children}</PrivyBridge.Provider>;
}

function useOptionalPrivy() {
  return useContext(PrivyBridge);  // Safe, not a hook rules violation
}
```

**Phase 3: Modal Visibility**
```
e0940b9 → fix: add CSS z-index overrides for Privy auth modal visibility
```
Privy's modal was rendering BEHIND the app's content. Fix:
```css
#privy-modal-root, #privy-dialog, [data-privy-dialog], [data-privy-modal] {
  z-index: 2147483647 !important;
}
```

**Phase 4: Login Methods Misconfiguration**
```
aa6e033 → feat: update Privy login methods to email, wallet, github, telegram
c7c7412 → fix: simplify Privy config, remove telegram/embeddedWallets
```
**Lesson**: Only include login methods that are actually configured in the Privy dashboard. Including `telegram` without dashboard setup causes silent failures.

**Phase 5: Loading State Stuck**
```
43b7711 → fix: add 3s timeout for Privy loading state to prevent stuck Loading...
```
Privy's `ready` state can hang forever if the app ID is wrong or the domain isn't whitelisted. Add a timeout fallback.

### Privy Rules for Future Projects
1. Use static imports only — no dynamic `require()`
2. Wrap in a context bridge provider for optional access
3. CSS z-index override is mandatory (add to globals.css)
4. Only enable dashboard-configured login methods
5. `NEXT_PUBLIC_PRIVY_APP_ID` bakes at build time — redeploy to change
6. Add allowed origins in Privy dashboard for every deploy domain
7. Add loading timeout (3s) to prevent infinite "Loading..." states
8. Test auth flow on deployed URL, not just localhost

---

## 4. Smart Contract Evolution (V3 → V4)

### Contract Architecture
```
SigilFactory ──deploys──▶ SigilToken (ERC-20)
     │                          │
     ├──creates──▶ Uniswap V3 Pool (token/USDC pair)
     │                          │
     ├──mints──▶ LP Position (locked in SigilLPLocker)
     │
     ├──registers──▶ SigilFeeVault (fee distribution)
     │
     └──attests──▶ EAS (on-chain ownership proof)

SigilHook ──hooks──▶ Uniswap V4 PoolManager (swap hooks)
SigilEscrow ──holds──▶ Native token escrow (milestone-based unlock)
```

### V3 Factory Issues (3+ commits to fix)
```
8ef35c2 → fix: V3 factory sqrtPriceX96 for single-sided LP mint
532dc31 → fix: V3 pool pricing + seed swap + chat UI
1a27442 → fix: SigilFactory IUnlockCallback for V4 ManagerLocked
```

**`sqrtPriceX96` calculation was wrong:**
The initial price for a Uniswap V3 pool needs precise sqrt(price) × 2^96 encoding. Getting this wrong means:
- LP mint reverts with cryptic errors
- Pool creates but with wrong price (no tradeable range)

**Single-sided LP mint fix:**
When you want to mint LP with only one token (the project token), the tick range and sqrtPriceX96 must align so the pool accepts single-sided liquidity.

### Fee Pipeline Architecture
```
Swap happens on Uniswap ──▶ SigilHook captures fee
    ──▶ SigilFeeVault.distributeFees() splits:
         80% → Developer wallet
         20% → Protocol treasury
    ──▶ Frontend queries claimable fees
    ──▶ Backend sponsors gas for claim tx
    ──▶ USDC transferred to developer
```

### Nonce Collision on Batch Transactions
```
f7d80f0 → fix: add delay between assignDev txs to prevent nonce collision
6ec836c → fix: skip poolAssigned pre-check, call assignDev directly with RPC delays
```

**Lesson**: When sending multiple transactions from the same wallet in quick succession (e.g., backfilling `assignDev` for multiple tokens), nonce collisions occur. Fix:
```ts
for (const token of tokens) {
  await assignDevWallet(token);
  await sleep(2000); // Wait for tx to propagate
}
```

### Auto-Verify on Basescan
```
8e6e456 → feat: auto-verify SigilToken on Basescan after every launch
```
Every deployed token contract is automatically verified on Basescan using the Foundry verify API. This builds trust and lets users read the source code.

### Smart Contract Audit Findings Implemented
```
1efea33 → fix: Implement smart contract audit recommendations
877b9c4 → docs: Update security audit report (post-fix)
```
Audit findings addressed:
- Reentrancy guards on all external calls
- Access control on admin functions
- Safe math for fee calculations
- Slippage protection on swaps

---

## 5. Fee Pipeline Debugging

> The fee pipeline was the single hardest debugging challenge — 10+ commits across 4 days.

### Issues Hit (in order)

**1. SQL query bug: ANY() doesn't work in Drizzle**
```
bec1c8c → fix: broken ANY() SQL in fee query — use inArray() instead
```
PostgreSQL's `ANY()` syntax doesn't translate through Drizzle ORM. Use `inArray()`:
```ts
// ❌ BROKEN
where: sql`wallet_address = ANY(${walletAddresses})`

// ✅ FIXED
where: inArray(schema.walletAddress, walletAddresses)
```

**2. NULL projectId on fee distributions**
```
f04cabd → fix: backfill NULL projectId on feeDistributions at startup
```
Early fee records had NULL projectId because the token launch didn't link back to the project record. Added startup backfill migration.

**3. Multi-wallet query (embedded + custodial)**
```
33363bf → fix: query projects by all user wallet addresses (embedded + custodial)
```
Users have both a Privy embedded wallet AND a server-created custodial wallet. Fee queries must check BOTH addresses.

**4. Fee vault dev assignment**
```
973aaf8 → fix: assign dev wallets on SigilFeeVault for escrowed fees
```
The `SigilFeeVault` contract requires `assignDev(tokenAddress, devWallet)` to be called before the dev can claim fees. This was missing from the launch flow.

**5. Gas sponsorship for claims**
```
c757e62 → fix: auto-fund gas inside claim endpoint, remove separate gas step
5f2185b → feat: server-side fee claiming — remove Privy signer dependency
364cc00 → feat: gasless fee claims via backend-sponsored gas
```
Users shouldn't need ETH to claim USDC fees. The backend sponsors gas by:
1. Checking if user's wallet has enough ETH for gas
2. If not, sending 0.0005 ETH from the deployer wallet
3. Then executing the claim transaction server-side

**6. Frontend display showing $0.00**
Fee display was $0.00 even when on-chain fees existed because:
- Frontend queried wrong contract address
- ABI was outdated (missing `devFees` mapping)
- Query used wrong wallet address (embedded vs. custodial)

### Fee Pipeline Checklist for Future Projects
- [ ] Contract `assignDev()` called during token launch
- [ ] Fee queries check ALL user wallet addresses
- [ ] NULL projectId records backfilled
- [ ] Use `inArray()` not `ANY()` in Drizzle
- [ ] Gas sponsorship for claim transactions
- [ ] Server-side claim execution (no client-side signing needed)
- [ ] Correct contract address + ABI in frontend config

---

## 6. Security Hardening Checklist

### Vulnerabilities Found & Fixed

| Commit | Vulnerability | Severity | Fix |
|--------|--------------|----------|-----|
| `56c055e` | Fallback encryption key in production | CRITICAL | Require `ENCRYPTION_KEY` env var, crash if missing |
| `d9138b1` | Verification endpoint exposes wallet addresses | HIGH | Remove wallet from public status response |
| `399309d` | Chat session endpoint leaks wallet address | HIGH | Strip wallet from session response |
| `ecca724` | Claim status shows ownerWallet | MEDIUM | Remove ownerWallet from public response |
| `d4cef97` | Private key export without exact phrase match | HIGH | Require exact phrase "I understand this is dangerous" |
| `7fab5e9` | Unknown token addresses accepted for swap | HIGH | Reject addresses not in allowlist |
| `de07b6c` | No slippage tolerance on swap quotes | MEDIUM | Add 1% default slippage |
| `735520f` | Rate limiting bypassed behind proxy | MEDIUM | Add TRUST_PROXY config |
| `e95f140` | Next.js 15.1.1 critical CVEs | HIGH | Upgrade to 15.1.11 |

### Security Architecture
```
10b9da3 → OpSec: privyAuth middleware | Security Headers and CORS | Rate Limiting | Filtering
```

**Implemented layers:**
1. **Privy auth middleware** — validates JWT on authenticated routes
2. **Security headers** — CSP, HSTS, X-Frame-Options, X-Content-Type-Options
3. **CORS** — whitelist specific origins only
4. **Rate limiting** — per-IP and per-developer with Redis-backed counters
5. **Input filtering** — Zod validation on all request bodies
6. **Sentinel pipeline** — composable security checks before handlers

### Security Rules for Future Projects
1. **NEVER** use fallback encryption keys in production — crash instead
2. **NEVER** expose wallet addresses in public API responses
3. **ALWAYS** require exact phrase confirmation for dangerous actions
4. **ALWAYS** validate token addresses against an allowlist before swaps
5. **ALWAYS** add slippage tolerance to DEX swap quotes
6. **ALWAYS** set `TRUST_PROXY` when behind a reverse proxy (Railway, Vercel)
7. **ALWAYS** wrap database operations that modify multiple rows in transactions
8. **ALWAYS** keep framework dependencies updated (Next.js CVEs are common)

---

## 7. Design System Evolution

### Timeline: 4 Major Redesigns

**Phase 1: Apple-Inspired** (Feb 14)
```
2f8e76a → Rebrand front-end UI with Sigil brand palette and Apple-inspired design
```
Clean whites, subtle grays, San Francisco font — too generic.

**Phase 2: Border-Centric (SavageOps)** (Feb 16-17)
```
ff7ebd8 → feat(web): complete UI/UX refresh with border-centric design system
d495a2a → refactor: apply border-centric design to pages and governance dashboard
9e7be2e → refactor: apply border-centric design to all blog pages
```
The defining design language: centered container with left/right borders as structural spine. No rounded corners, no shadows, no card elevation. Structure from borders only. Pastel color bands for rhythm.

**Phase 3: Memorable Enhancement** (Feb 17-18)
```
babaec7 → feat: comprehensive hero page enhancement with memorable border-centric design
561a34e → feat: memorable developers page with PixelCard hero
58d737b → feat: memorable dashboard with PixelCard hero, visual flows
343b080 → feat: memorable proposal detail view with PixelCard hero
2965ecf → feat: memorable governance header with PixelCard, briefings
```
Added PixelCard interactive hover effects, briefing cards (mini data visualizations), and dramatic visual flows while maintaining border-centric structure.

**Phase 4: 3D Model Hero** (Feb 18)
```
e3b1314 → feat(web): upgrade hero with interactive 3D model
bba7752 → fix: add ts-ignore for OBJLoader import (three v170+ types)
```
Interactive 3D OBJ model in the hero section using Three.js. Hit TypeScript compatibility issue with `three@v170+` — OBJLoader types changed.

### Design Anti-Patterns Learned
- ❌ No `rounded-*` on containers (squares only)
- ❌ No `shadow-*` for elevation
- ❌ No TailwindCSS gap-based grid separators — use `border-*` or `divide-*`
- ❌ No floating cards — everything is inline in the border spine
- ❌ No Title Case headings — always `lowercase` for h1/h2
- ❌ No saturated backgrounds — only pastel tints at `/30` or `/50`

### Revert Lesson
```
4d766f3 → revert: undo border-centric changes to governance dashboard
4d00242 → refactor: full border-centric governance dashboard with screen height adherence
```
First attempt at governance dashboard redesign didn't maintain screen height. Reverted, then re-did it properly with `min-h-screen` adherence.

---

## 8. Refactoring Patterns That Worked

> 40+ refactoring commits. These patterns emerged as reliable:

### Extract → Centralize → Delete
1. **Extract** repeated logic into a shared utility
2. **Centralize** all consumers to use the new utility
3. **Delete** the old inline implementations

**Examples:**
```
29ad8d9 → Extract error message utility → used in 12 files
ac4cc4d → Centralize format utilities → eliminated 6 duplicates
71725fa → Consolidate currency formatting → single source of truth
7deee5d → Extract duplicated encryption utilities → shared module
e3b420d → Consolidate OAuth verification patterns → base class
```

### Decompose → Modularize
Split monolith files into focused modules:
```
27a8ac4 → Decompose agent engine into focused modules
6655e6e → Decompose sentinel into composable security pipeline
4393933 → Decompose GovernanceDashboard into focused components
7a82946 → Decompose ProfileDashboard into focused components
16f6e30 → Split GovernanceDashboard into modular folder structure
322efe1 → Split VerifyFlow into step-based modules
a05c455 → Split large router.ts into domain-specific handlers
3c39c2b → Split trading service into focused modules
```

**Pattern**: When a file exceeds ~300 lines, decompose by domain concern:
```
engine.ts (800 lines) →
  engine/index.ts       (orchestration)
  engine/tools.ts       (tool definitions)
  engine/helpers.ts     (helper functions)
  engine/llm.ts         (LLM provider abstraction)
```

### Type Safety Improvements
```
5a7ca26 → Use discriminated union for VerificationResult
4f9add0 → Add Platform literal union type
dc4337f → Add typed Chat API response handling
f1e8641 → Add centralized address validation utilities
eeebbe6 → Add tool input validation
9b00f21 → Add runtime validation to request helpers
```

**Pattern**: Replace `string` with literal unions, replace `any` with proper types:
```ts
// ❌ Before
type Platform = string;
type Result = { success: boolean; data?: any; error?: string };

// ✅ After
type Platform = "github" | "domain" | "twitter" | "facebook" | "instagram";
type Result = 
  | { success: true; data: VerificationData }
  | { success: false; error: string };
```

---

## 9. AI Agent Integration Lessons

### Architecture
```
b712353 → feat(chat): add multi-step AI agent with border-centric design
7efc288 → feat: enable full AI chat features with multi-part responses
```

The agent uses Claude with tool definitions for:
- Token launches (deploy via SigilFactory)
- Wallet operations (balances, transfers)
- Trading (swap via Uniswap)
- Verification (GitHub, domain)
- Transaction history

### Anti-Fabrication Safeguard
```
036f558 → fix: add anti-fabrication safeguard for token deployments
```
The AI agent would sometimes claim it deployed a token when it actually failed. Fix: validate on-chain that the token contract exists before telling the user it succeeded.

### Anthropic API Payload Size
```
6f4f32c → fix: Reduce Anthropic API Payload Size with Message Truncation
```
Long conversations exceed Claude's context window. Implement message truncation:
- Keep system prompt + last N messages
- Summarize older messages into a condensed history
- Strip tool results that are no longer relevant

### Chat UI Fixes
```
41210f7 → fix: accept null sessionId + fix chat scroll
c6e44c3 → fix: sticky chat input + token launch confirmation step
c1cf1ef → fix: prevent React crash when backend returns error objects
d345b3d → fix: add ErrorBoundary + dynamic Privy import to prevent crashes
b4e87c2 → fix(chat): wire chat page to real backend API instead of setTimeout mock
```

**Key lesson**: Always add an ErrorBoundary around the chat component. Backend errors (500, timeouts, malformed JSON) will crash React if not caught.

### Confirmation Step for Destructive Actions
```
e2cb859 → fix: pass confirmed param through to launch handler
065233c → fix: export key confirmation never matched — rawText wasn't passed to handlers
```
Token launches and key exports require explicit user confirmation. The confirmation text matching was broken because `rawText` (the user's actual message) wasn't being passed to the confirmation handler — only the parsed intent was.

---

## 10. Wallet & Identity Management

### Wallet Types in the System
| Wallet Type | When Created | Who Controls | Used For |
|-------------|-------------|-------------|----------|
| Privy Embedded | On Privy login | User (client-side) | Frontend signing |
| Server Custodial | On chat session start | Backend (encrypted) | Token launches, gas sponsorship |
| Deployer | Pre-provisioned | Backend | Contract deployments, gas funding |

### Wallet Creation Flow
```
5925bd5 → feat: auto-create wallet on Privy login (identity-based)
c5afec1 → feat: auto-create wallet when session starts
d1a4eda → feat: auto-create custodial wallet for every chat session
```

**Pattern**: Create server-side wallet automatically on first interaction. Don't make users explicitly "create" a wallet.

### Wallet Encryption Evolution
```
96ad39c → fix: HDNodeWallet.encrypt() doesn't accept scrypt options
327dfbf → fix: use ethers.encryptKeystoreJson() for scrypt options
9fa9060 → feat: Upgrade wallet encryption to ethers keystore
```
Started with AES-256-GCM encryption, upgraded to ethers.js keystore format (industry standard, scrypt-based KDF). The `HDNodeWallet.encrypt()` API changed between ethers versions — use `ethers.encryptKeystoreJson()` directly.

### Multi-Wallet Query Pattern
```
33363bf → fix: query projects by all user wallet addresses (embedded + custodial)
73677fb → unify wallet: use server-side user wallet everywhere
```
Users have multiple wallets. Any query for "user's projects" or "user's fees" must check ALL wallet addresses:
```ts
const allWallets = [embeddedWallet, custodialWallet].filter(Boolean);
const projects = await db.query.projects.findMany({
  where: inArray(schema.walletAddress, allWallets),
});
```

---

## 11. Frontend Bug Patterns

### Pattern: `[object Object]` in Error Messages
```
7d3b605 → fix: prevent [object Object] in API error messages
8fd49a4 → fix: auto-create embedded wallet on login & fix [object Object] error
```
When the backend returns an error object `{ message: "..." }` and the frontend does `setError(err)` where `err` is the whole object, React renders `[object Object]`. Always extract the message:
```ts
// ❌ BROKEN
catch (err) { setError(err) }

// ✅ FIXED
catch (err) { setError(err instanceof Error ? err.message : String(err)) }
```

### Pattern: Header Merging Drops Authorization
```
766949d → fix: header merging bug dropping Authorization token
```
When using spread to merge headers, a later spread can overwrite the Authorization header:
```ts
// ❌ BROKEN — second spread overwrites Authorization
const headers = { Authorization: `Bearer ${token}`, ...otherHeaders };

// ✅ FIXED — Authorization added last
const headers = { ...otherHeaders, Authorization: `Bearer ${token}` };
```

### Pattern: Claimable Token Detection
```
e47b6ba → fix: claimable token detection and verify CTA URL
624c1ad → feat: claimable token detection + enriched project cards
```
Detecting if a user can claim a token requires checking:
1. Does the project exist in the DB?
2. Has the user verified ownership?
3. Is there an EAS attestation?
4. Are there unclaimed fees in the FeeVault?

Each layer can fail independently — check all of them.

### Pattern: React Hook Order Violations
```
1f538a6 → Fix hook order issue in fee vault wallet hook
8028a0d → fix: eliminate conditional hook calls in useOptionalPrivy via context bridge
```
React hooks must be called in the same order every render. Conditional hooks break this. Solutions:
- Context bridge pattern (see Privy section)
- Call hook unconditionally, handle `null`/`undefined` in the result
- Move conditional logic AFTER the hook call

---

## 12. Backend Bug Patterns

### Pattern: In-Memory State Doesn't Survive Restarts
```
e63270e → fix: Replace in-memory stores with database persistence
```
In-memory Maps/Sets for sessions, rate limits, or token registries are lost on every deploy. Use PostgreSQL or Redis.

### Pattern: Duplicated Token Registry
```
3d0f77e → fix: Extract duplicated token registry across trading.ts and wallet.ts
```
Multiple files maintained their own copy of "which tokens are tradeable." Changes to one didn't propagate. Centralize to a single source of truth.

### Pattern: Rate Limit Garbage Collection
```
4b667a6 → fix: Implement rate limit cleanup with scheduled garbage collection
```
In-memory rate limit maps grow unbounded. Add periodic cleanup:
```ts
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.timestamp > WINDOW_MS) rateLimitMap.delete(key);
  }
}, 60_000);
```

### Pattern: Sequential → Parallel for Token Balances
```
1e299a1 → fix: Replace sequential token balance checks with parallel multicall
```
Checking 10 token balances sequentially = 10 RPC calls × 200ms = 2s. Use multicall to batch into 1 call:
```ts
// ❌ Sequential (slow)
for (const token of tokens) {
  const balance = await getBalance(token);
}

// ✅ Parallel multicall (fast)
const results = await multicall({ contracts: tokens.map(t => ({
  address: t, abi: erc20Abi, functionName: "balanceOf", args: [wallet]
}))});
```

### Pattern: Database Transaction for Multi-Row Updates
```
a9ffa2f → fix: Wrap claim database operations in transaction for atomicity
```
If claiming fees requires updating multiple tables (feeDistributions + projects + claims), wrap in a transaction. A crash between updates leaves data inconsistent.

---

## 13. UX Psychology Patterns Applied

These were applied to the Sigil frontend to improve user engagement:

| Pattern | Commit | Application |
|---------|--------|-------------|
| **Fitts's Law** | `105585c` | Larger click targets for primary actions |
| **Von Restorff Effect** | `105585c` | Primary CTA visually distinct from surroundings |
| **Jakob's Law** | `105585c` | UI patterns familiar from other Web3 apps |
| **Miller's Law** | `85b9773` | Chunk dashboard data into groups of 5-7 |
| **Loss Aversion** | `85b9773` | Frame unclaimed fees as "money you're leaving" |
| **Hick's Law** | `593c2f0` | Reduce verification method choices (progressive disclosure) |
| **Zeigarnik Effect** | `efbb3c0` | Show endowed progress (Step 1 of 4 ✓) |
| **Peak-End Rule** | `0b2643b` | Memorable success state after verification |
| **Serial Position** | `bc4324e` | Most important nav items first and last |
| **Social Proof** | `2b2f153` | Show verification count stats |
| **Progressive Disclosure** | `79b6d95` | Show simple first, reveal complexity on demand |
| **Cognitive Load Theory** | `8070231` | Simplify proposal form to essential fields |

---

## 14. Performance Optimizations

```
6110689 → perf: Memoize tab definitions in ProfileDashboard
5f0268b → perf: Memoize TokenCard component with React.memo
d00fc9c → perf: Add useMemo to GovernanceDashboard proposal filtering
1e299a1 → fix: Replace sequential token balance checks with parallel multicall
```

### Rules
1. **Memoize component lists** with `React.memo` when parent re-renders frequently
2. **Memoize expensive computations** with `useMemo` (filtering, sorting)
3. **Memoize static data** (tab definitions, column configs) with `useMemo([], [])`
4. **Batch RPC calls** with multicall instead of sequential requests
5. **Truncate AI conversation history** to prevent payload bloat

---

## 15. Post-Refactor Guardrails

> From the Feb 17 breakage: a refactor introduced 3 different import bugs that broke production.

### After ANY refactor (>5 files changed):

```bash
# 1. TypeScript compilation
npx tsc --noEmit                         # Backend
cd web && npx tsc --noEmit               # Frontend

# 2. Import verification
grep -rn "from.*changed-module" src/ web/src/ --include="*.ts" --include="*.tsx"

# 3. Lockfile sync
cd web && bun install && git add bun.lock  # If web packages changed
npm install && git add package-lock.json   # If root packages changed

# 4. Critical path smoke test
# - Auth flow (sign in → dashboard)
# - Chat (send message → get response)
# - Verify (start verification flow)
# - Wallet (view balance)
```

### Common Post-Refactor Breakages

| Symptom | Cause | Fix |
|---------|-------|-----|
| `X is not defined` at runtime | Missing import | Add import statement |
| `X is not exported from Y` | Export moved during refactor | Update import path |
| `bun install --frozen-lockfile` fails | Stale `bun.lock` | Run `bun install` |
| Build works, app crashes | Runtime import error | Check deploy logs |

---

## 16. Pre-Launch Checklist Template

### Infrastructure
- [ ] Production database provisioned (PostgreSQL)
- [ ] Redis instance for sessions/cache
- [ ] Backend deployed (Railway recommended)
- [ ] Frontend deployed (Railway or Vercel)
- [ ] Custom domain configured with SSL
- [ ] `BASE_URL` and `FRONTEND_URL` set to production domains

### Smart Contracts
- [ ] All contracts deployed to mainnet
- [ ] Contracts verified on block explorer
- [ ] Contract addresses set in env vars
- [ ] EAS schema registered
- [ ] Deployer wallet funded with gas (~0.005 ETH)

### Auth & API Keys
- [ ] Privy app created with correct allowed origins
- [ ] `NEXT_PUBLIC_PRIVY_APP_ID` set (requires rebuild to apply)
- [ ] GitHub OAuth app created with production callback URL
- [ ] Anthropic API key set for AI agent
- [ ] `ENCRYPTION_KEY` set (NO fallback allowed)

### Security
- [ ] No fallback encryption keys
- [ ] No wallet addresses in public API responses
- [ ] Rate limiting enabled with Redis backend
- [ ] CORS whitelist configured
- [ ] Security headers enabled
- [ ] `TRUST_PROXY` set if behind reverse proxy
- [ ] Next.js updated to latest patch version

### Monitoring
- [ ] Structured logging enabled (Pino)
- [ ] Error tracking in place
- [ ] Deploy logs monitored for 5 minutes after each push
- [ ] Database backups configured

---

## Appendix: Full Commit Timeline

### Day 1 (Feb 14) — Foundation
- Architecture plan, verification backend, pool reward contract
- Vercel deployment + build fixes
- Rename to Sigil, add chat agent

### Day 2 (Feb 15) — Core Features
- Apple-inspired UI redesign
- Sigil V4 contracts (Hook, FeeVault, Factory, Token)
- Privy login system, Sentinel security
- Figma landing page copy

### Day 3 (Feb 16) — Polish & Deploy
- Hero layout restructure, governance + dashboard pages
- Railway migration, lockfile fixes
- OpSec layer (auth middleware, CORS, rate limiting, security headers)
- ESLint/Prettier configuration
- Redis integration
- Extended test coverage
- Security audit + fixes
- UX psychology patterns
- 40+ refactoring commits (decompose, extract, centralize)
- Structured logging with Pino

### Day 4 (Feb 17) — Auth & Design
- Border-centric design system (complete UI/UX refresh)
- Privy auth saga (10+ fixes for hooks, modal, config)
- Dashboard real data integration
- GitHub verification unification
- Blog pages with border-centric design
- Chat agent with multi-step responses
- Governance pages
- Post-refactor guardrails skill created

### Day 5 (Feb 18) — Fees & Polish
- Fee pipeline debugging (SQL, multi-wallet, gas sponsorship)
- Gasless fee claims (backend-sponsored gas)
- Server-side fee claiming
- PixelCard hero enhancements
- 3D model hero upgrade
- Agent key-pair attestations
- Agents page redesign
- MCP server package
- Final build fixes (OBJLoader types, lockfile sync)
