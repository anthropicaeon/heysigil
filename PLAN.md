# Sigil

## What Is Sigil?

**Funding for dev projects without the weight of handling a community.**

Sigil doesn't mean you need to run your coin community. You provide your Sigil as a
stamp of approval to earn fees, then you continue doing what you do best — build.

### The Model

1. **Community deploys tokens** about tech projects they believe in
2. **Developer verifies** they own the project (GitHub, domain, tweet, social)
3. **Developer stamps their Sigil** — an on-chain seal of approval (EAS attestation)
4. **Developer earns USDC fees** from LP activity. Native tokens remain **locked**.
5. **Community votes on milestones** to decide if the developer gets tokens unlocked
6. **Either way, the developer retains USDC payments** — they keep building, keep earning

### Why This Works

| Stakeholder | Incentive |
|------------|-----------|
| **Developers** | Get funded without running a community. Stamp = approval. USDC fees flow immediately. Focus on building. |
| **Community** | Deploy tokens for projects they believe in. Milestone voting gives them control over token unlocks. |
| **LPs** | Provide liquidity for stamped (developer-approved) projects. Fee split incentivizes quality projects. |

### Key Principle

> Stamping your Sigil means your stamp of approval. You gain USDC fees from LPs while
> your native tokens remain locked. Community gets to choose if you get your tokens
> unlocked based on milestones. Otherwise you retain USDC payments.

---

## How It Differs From Bankr

Bankr.bot ties everything to X/Twitter API — identity, discovery, claiming. This breaks
because X API costs ~$50k/month, X has suspended Bankr before, and not all devs are on X.

Sigil removes the X API dependency entirely. 5 alternative verification methods, an
AI chat agent, and on-chain attestations replace everything X was doing.

---

## Verification Methods

### 1. GitHub Verification (Strongest for dev projects)

Three approaches, ordered by strength:

#### 1a. GitHub OAuth + Permission Check (Recommended)
User authenticates via GitHub OAuth. Backend verifies they have `admin` permission on
the claimed repo/org.

```
Flow:
1. Dev clicks "Verify with GitHub"
2. Redirect → github.com/login/oauth/authorize?scope=repo,read:org
3. GitHub redirects back with auth code
4. Backend exchanges code for access token
5. Backend calls GET /repos/{owner}/{repo}/collaborators/{username}/permission
6. If permission == "admin" → verified ✓
7. Create on-chain attestation linking GitHub identity → wallet address
```

**Libraries:** `octokit/octokit.js`, `passport-github2`
**API endpoints:**
- `GET /repos/{owner}/{repo}/collaborators/{username}/permission` → `{permission: "admin"}`
- `GET /orgs/{org}/members/{username}` → org membership check

#### 1b. GitHub Actions OIDC Token (Cryptographic proof)
Dev adds a GitHub Actions workflow to their repo. The workflow requests an OIDC token
from GitHub's OIDC provider. The JWT contains `repository`, `repository_owner` claims
that cryptographically prove the workflow runs from that specific repo.

```yaml
# .github/workflows/verify-ownership.yml
name: Verify Project Ownership
on: workflow_dispatch
permissions:
  id-token: write
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            const token = await core.getIDToken('your-verification-service')
            // POST token to your verification API
```

Only someone with write access to the repo can trigger this. JWT is validated against
GitHub's JWKS endpoint: `https://token.actions.githubusercontent.com/.well-known/jwks`

**Libraries:** `jose` for JWT verification

#### 1c. File-Based Verification (Simplest, no OAuth needed)
Like Google Search Console verification. Dev places a file in their repo.

```
Flow:
1. System generates unique code: verify-pool-claim-a1b2c3d4
2. Dev creates: .well-known/pool-claim.txt in repo root
3. File contains: verification code + wallet address + optional wallet signature
4. Backend calls: GET https://api.github.com/repos/{owner}/{repo}/contents/.well-known/pool-claim.txt
5. Parse and verify → claimed ✓
```

Works for public repos without any OAuth. Proves write access to the repo.

---

### 2. Facebook Verification

#### Facebook OAuth + Page Admin Check

```
Flow:
1. Dev clicks "Verify with Facebook"
2. Redirect → facebook.com/v21.0/dialog/oauth?scope=pages_show_list
3. Facebook redirects back with auth code
4. Backend exchanges code for user access token
5. Backend calls GET /me/accounts → returns list of Pages user administers
6. If claimed page appears in response → verified as admin ✓
```

**Libraries:** `passport-facebook`, Facebook JS SDK
**For profile ownership:** Simply completing OAuth + `GET /me` proves account ownership.

---

### 3. Instagram Verification

#### Instagram Graph API (Business/Creator accounts only)

**Important:** Instagram Basic Display API was retired Dec 2024. Only Business/Creator
accounts can be verified via official API (must be linked to a Facebook Page).

```
Flow:
1. Authenticate via Facebook OAuth (Instagram Graph API uses Facebook auth)
2. Request instagram_basic + pages_show_list scopes
3. Call GET /me/accounts to get Facebook Pages
4. For each page: GET /{page-id}?fields=instagram_business_account
5. Call GET /{ig-user-id}?fields=id,username
6. If username matches claimed account → verified ✓
```

**For personal accounts:** Use zkTLS approaches (Reclaim Protocol, Opacity Network)
that can cryptographically prove account ownership without API access.

---

### 4. Tweet-a-Code Verification

Dev tweets a verification code. Two approaches to check it WITHOUT the X API:

#### 4a. zkTLS / Web Proofs (No API needed — recommended)

Uses TLS notarization to cryptographically prove a tweet exists and contains the
verification code, without needing X's cooperation or API.

| Protocol | How it works | Library |
|----------|-------------|---------|
| **Opacity Network** | MPC-TLS notary witnesses encrypted session with x.com. Proof verified on-chain via EigenLayer. | opacity.network |
| **Reclaim Protocol** | Attestor node witnesses TLS session. ZK proof generated. 2500+ data source providers including X. | `reclaim-js-sdk` |
| **vlayer Web Proofs** | Browser extension captures TLS session. Proof verified in Solidity. | `@vlayer/sdk` |

```
Flow:
1. System generates code: claim-pool-xyz789
2. Dev tweets: "Verifying ownership for @YourProtocol. Code: claim-pool-xyz789"
3. Dev opens the tweet in browser with Reclaim/vlayer/Opacity extension
4. Extension generates cryptographic proof of tweet content + authorship
5. Proof submitted to your verification contract on-chain
6. Contract verifies proof → claimed ✓
```

**Why this is better than scraping:** Cryptographic proof, verifiable on-chain, no API
cost, no rate limits, no legal risk.

#### 4b. Base Verify (Coinbase)

Proves ownership of X account without sharing credentials. Each verified account
produces a deterministic token for Sybil resistance (1 account = 1 token = 1 claim).

**Repo:** `base/base-verify-demo` (Next.js reference app, uses SIWE)

---

### 5. Website Footer / Domain Verification

Dev proves they control the project's domain. Three methods (like Google Search Console):

#### 5a. DNS TXT Record (Strongest — proves domain-level control)
```
Flow:
1. Generate code: pool-claim-verify=0x1234abcd:a1b2c3d4
2. Dev adds DNS TXT record: _poolclaim.example.com TXT "pool-claim-verify=0x1234abcd:a1b2c3d4"
3. Backend queries: dns.resolveTxt('_poolclaim.example.com')
4. Parse and verify → claimed ✓
```
**Library:** Node.js built-in `dns.promises.resolveTxt()` — zero dependencies.
**Propagation time:** 15 min to 72 hours. Re-check periodically.

#### 5b. Well-Known File (Medium — proves hosting control)
```
Flow:
1. Generate token
2. Dev places file at: https://example.com/.well-known/pool-claim.txt
   Content: verification-token={token}\nwallet-address=0x1234...
3. Backend fetches URL and parses content → verified ✓
```
**Precedent:** Brave Rewards (`/.well-known/brave-rewards-verification.txt`),
Let's Encrypt ACME (`/.well-known/acme-challenge/{token}`)

#### 5c. HTML Meta Tag (Easiest — just edit one page)
```html
<meta name="pool-claim-verification" content="0x1234abcd:a1b2c3d4" />
```
Backend fetches page, parses with `cheerio`, extracts meta tag.

---

## Twitter Without API: The OpenClaw Bot Question

**Yes, it's possible.** There are three approaches:

### Option 1: Internal GraphQL API (Cookie-Based)
Mimics the browser's HTTP requests to Twitter's undocumented GraphQL endpoints.
Authenticates using session cookies (`auth_token`, `ct0`) instead of API keys.

**Key project:** `elizaOS/agent-twitter-client` — TypeScript library, supports
posting tweets, reading timelines, searching. Used by thousands of AI agents.

**Problems:**
- Twitter rotates GraphQL `queryId` values every 2-4 weeks (breaks hardcoded IDs)
- Arkose Labs CAPTCHAs on login (nearly unsolvable automatically)
- ~10-15 hours/month maintenance to keep working
- Account suspension risk — any account used this way can be banned
- ElizaOS is already migrating to official API v2 because this approach is too fragile

### Option 2: Browser Automation (Playwright/Puppeteer)
Drives a real Chrome instance to interact with twitter.com UI.

**Key project:** OpenClaw uses Playwright-based browser automation with AI-optimized
semantic snapshots. Shares cookies with a managed Chrome profile via the `bird` CLI.

**Problems:**
- Slow (full browser rendering vs direct HTTP)
- Resource intensive (headless Chrome per bot instance)
- Still detectable (TLS fingerprinting, CDP fingerprinting)
- Manual login required (CAPTCHAs block automated login)

### Option 3: MCP Server Wrappers
Model Context Protocol servers that wrap `agent-twitter-client` to let AI agents
interact with Twitter. Multiple implementations exist.

### Verdict on Twitter Bot Without API

**It works, but it's fragile and high-maintenance.** For the verification use case
specifically, zkTLS (Option 4a above) is far superior — it doesn't require running a
bot at all. The dev proves their own tweet exists using client-side cryptographic proofs.

If you still want an automated Twitter presence (posting, engagement), the
cookie-based approach via `agent-twitter-client` is the most battle-tested option, but
plan for breakage every 2-4 weeks and potential account suspension.

---

## On-Chain Attestation Layer

After verification passes (any method), issue an on-chain attestation using
**Ethereum Attestation Service (EAS)** that the pool reward contract can check.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐     ┌──────────────┐
│ Dev verifies │────▶│ Verification     │────▶│ EAS         │────▶│ Pool Reward  │
│ (GitHub,     │     │ Backend          │     │ Attestation │     │ Contract     │
│  DNS, tweet, │     │ (validates proof)│     │ (on-chain)  │     │ (checks att.)│
│  etc.)       │     └──────────────────┘     └─────────────┘     └──────────────┘
└─────────────┘
```

### EAS Schema for Pool Claims

```solidity
// Schema: "string platform, string projectId, address wallet, uint64 verifiedAt, bool isOwner"

// Example attestation data:
{
  platform: "github",
  projectId: "github.com/org/repo",
  wallet: "0x1234...abcd",
  verifiedAt: 1708300800,
  isOwner: true
}
```

### Smart Contract Claim Flow

```solidity
function claimReward(bytes32 attestationUID) external {
    Attestation memory att = eas.getAttestation(attestationUID);

    require(att.attester == TRUSTED_VERIFIER, "Untrusted attester");
    require(att.recipient == msg.sender, "Not the verified owner");
    require(!att.revoked, "Attestation revoked");

    // Decode attestation data
    (string memory platform, string memory projectId, address wallet, uint64 verifiedAt, bool isOwner)
        = abi.decode(att.data, (string, string, address, uint64, bool));

    require(isOwner, "Not project owner");

    // Release pool rewards to msg.sender
    _releaseRewards(projectId, msg.sender);
}
```

**Libraries:**
- `@ethereum-attestation-service/eas-sdk`
- EAS deployed on Base, Ethereum, Optimism, Arbitrum, Polygon
- Explorer: easscan.org

### Optional: Sybil Resistance Layer

Prevent gaming with fake accounts:

| Method | What it proves | Library |
|--------|---------------|---------|
| **Gitcoin Passport** | Humanity score (20+ threshold) + GitHub/X stamps | `api.scorer.gitcoin.co` |
| **World ID** | Unique human (iris biometric + ZK proof) | IDKit SDK |
| **Base Verify** | 1 social account = 1 deterministic token | `base/base-verify-demo` |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    Verification Frontend (Web)                    │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌────────┐ ┌────────┐  │
│  │ GitHub   │ │ Facebook │ │ Instagram │ │ Tweet  │ │Website │  │
│  │ OAuth    │ │ OAuth    │ │ GraphAPI  │ │ zkTLS  │ │DNS/File│  │
│  └────┬─────┘ └────┬────┘ └─────┬─────┘ └───┬────┘ └───┬────┘  │
│       └─────────────┴───────────┴────────────┴──────────┘       │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│                    Verification Backend                            │
│  ┌────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ Verify GitHub  │  │ Verify Domain    │  │ Verify Social     │  │
│  │ (OAuth + API)  │  │ (DNS/file/meta)  │  │ (OAuth / zkTLS)   │  │
│  └────────┬───────┘  └────────┬─────────┘  └────────┬──────────┘  │
│           └───────────────────┴─────────────────────┘              │
│                               │                                    │
│                    ┌──────────▼──────────┐                         │
│                    │  Issue EAS          │                         │
│                    │  Attestation        │                         │
│                    │  (on-chain proof)   │                         │
│                    └──────────┬──────────┘                         │
└───────────────────────────────┼────────────────────────────────────┘
                                │
┌───────────────────────────────▼────────────────────────────────────┐
│                    Smart Contracts (Base)                           │
│  ┌─────────────────┐     ┌─────────────────────────────────────┐   │
│  │ EAS Registry    │────▶│ Pool Reward Contract                │   │
│  │ (attestations)  │     │ - checkAttestation(uid)             │   │
│  └─────────────────┘     │ - claimReward(attestationUID)       │   │
│                          │ - Maps projectId → pool balance     │   │
│                          └─────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
testoooor/
├── src/
│   ├── verification/
│   │   ├── github.ts          # GitHub OAuth + permission check
│   │   ├── github-oidc.ts     # GitHub Actions OIDC verification
│   │   ├── github-file.ts     # File-based (.well-known) verification
│   │   ├── facebook.ts        # Facebook OAuth + page admin check
│   │   ├── instagram.ts       # Instagram Graph API verification
│   │   ├── tweet-zktls.ts     # Tweet verification via zkTLS proofs
│   │   ├── domain-dns.ts      # DNS TXT record verification
│   │   ├── domain-file.ts     # Well-known file verification
│   │   ├── domain-meta.ts     # HTML meta tag verification
│   │   └── types.ts           # VerificationResult, VerificationMethod
│   ├── attestation/
│   │   ├── eas.ts             # EAS attestation creation + reading
│   │   ├── schema.ts          # Schema registration
│   │   └── types.ts
│   ├── contracts/
│   │   ├── PoolReward.sol     # Reward claiming contract
│   │   ├── Verifier.sol       # On-chain attestation checker
│   │   └── interfaces/
│   ├── api/
│   │   ├── server.ts          # Express/Hono API server
│   │   ├── routes/
│   │   │   ├── verify.ts      # POST /verify/github, /verify/domain, etc.
│   │   │   ├── claim.ts       # POST /claim (trigger on-chain claim)
│   │   │   └── status.ts      # GET /status/:projectId
│   │   └── middleware/
│   ├── db/
│   │   ├── schema.ts          # Drizzle schema
│   │   ├── migrations/
│   │   └── client.ts
│   ├── config/
│   │   └── env.ts             # Zod-validated env vars
│   └── index.ts
├── web/                       # Verification frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── verify.tsx     # Verification flow UI
│   │   │   ├── claim.tsx      # Claim rewards UI
│   │   │   └── status.tsx     # Check verification status
│   │   └── components/
│   └── package.json
├── contracts/                 # Hardhat/Foundry project
│   ├── src/
│   ├── test/
│   └── foundry.toml
├── tests/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Implementation Phases

### Phase 1: GitHub Verification + EAS Attestation
- GitHub OAuth flow (strongest signal for dev projects)
- EAS schema registration + attestation creation on Base
- Basic API server with `/verify/github` endpoint
- Minimal frontend with "Verify with GitHub" button
- **End-to-end test:** GitHub login → verify admin → create attestation

### Phase 2: Domain Verification
- DNS TXT record checker
- Well-known file checker
- HTML meta tag checker
- Add `/verify/domain` endpoint

### Phase 3: Tweet-a-Code via zkTLS
- Integrate Reclaim Protocol or Opacity Network
- Dev tweets code, generates proof client-side
- Proof submitted and verified on-chain
- No Twitter API needed at any point

### Phase 4: Facebook + Instagram
- Facebook OAuth + page admin verification
- Instagram Graph API (Business/Creator accounts)
- Add `/verify/facebook` and `/verify/instagram` endpoints

### Phase 5: Pool Reward Smart Contract
- Solidity contract that reads EAS attestations
- `claimReward(attestationUID)` function
- Maps project identifiers to pool balances
- Deploy to Base

### Phase 6: Frontend + Polish
- Full verification flow UI
- Multiple method selection
- Status dashboard
- Sybil resistance integration (Gitcoin Passport or World ID)

---

## Key Decisions Needed

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Primary verification | GitHub vs Domain vs Tweet | GitHub first (strongest for dev projects) |
| Attestation protocol | EAS vs Verax vs custom | EAS (permissionless, multi-chain, proven) |
| zkTLS provider | Reclaim vs Opacity vs vlayer | Reclaim Protocol (most integrations, good docs) |
| Smart contract chain | Base vs Ethereum vs Optimism | Base (low gas, EAS deployed, Bankr native) |
| Contract framework | Foundry vs Hardhat | Foundry |
| Backend framework | Express vs Hono vs Fastify | Hono (lightweight, Bun-native) |
| Frontend | Next.js vs plain React vs Astro | Next.js (SSR for OAuth callbacks) |
| Twitter bot approach | agent-twitter-client vs OpenClaw vs none | None for MVP; optional later via cookie-based client |

---

## Environment Variables

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Facebook OAuth
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Instagram (uses Facebook auth)
# (same as Facebook vars above)

# EAS
EAS_CONTRACT_ADDRESS=0xC2679fBD37d54388Ce493F1DB75320D236e1815e
EAS_SCHEMA_UID=

# Reclaim Protocol (zkTLS for tweet verification)
RECLAIM_APP_ID=
RECLAIM_APP_SECRET=

# Database
DATABASE_URL=postgresql://...

# Server
PORT=3000
BASE_URL=https://your-domain.com

# No X/Twitter API keys needed!
```
