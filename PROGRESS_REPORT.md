# Sigil — Progress Report
**Date:** February 15, 2026  
**Status:** 🟡 Pre-Alpha — Core systems built, pending infrastructure + contract deployment

---

## Executive Summary

Sigil's backend, frontend, and smart contracts are functionally complete. The AI chat agent handles launch, trading, and verification intents. Local hosting issues have been resolved and the full stack runs locally. **Remaining work is infrastructure setup (database, API keys, contract deployment) and integration testing.**

---

## What's Built ✅

### Backend (Hono + TypeScript)
- **AI Chat Agent** — Dual-mode: LLM-powered (Claude) or offline regex fallback
  - 10 intents: `swap`, `bridge`, `send`, `price`, `balance`, `launch_token`, `verify_project`, `claim_reward`, `pool_status`, `help`
  - Live price feeds via CoinGecko, live on-chain balance checks via RPC
  - Token launch with server-side deployer (gasless for users)
- **Verification System** — GitHub OAuth, GitHub File, DNS TXT, Well-Known File, HTML Meta Tag, Tweet+zkTLS, Instagram Graph API
- **Universal Link Parser** — Accepts messy user input (URLs, handles, bare repos) and normalizes into structured project identities
- **Deployer Service** — Hot wallet for gasless token launches with rate limiting (3/hr) and auto name/symbol generation
- **EAS Attestation** — On-chain attestation creation and reading via Ethereum Attestation Service
- **API Routes** — `/api/chat`, `/api/verify/*`, `/api/launch`, `/api/claim`, `/api/methods`, `/health`

### Frontend (Next.js 15 + React 19)
- **Landing Page** — Brand positioning, feature showcase
- **Verify Page** — Multi-step wizard: Method → Details → Challenge → Stamp
- **Chat Page** — Real-time AI chat with markdown rendering, suggestions, typing indicators
- **Developers Page** — Builder-focused content
- **Wallet Connect** — RainbowKit + wagmi integration

### Smart Contracts (Solidity + Foundry)
- **SigilFactory** — Deploys ERC-20 tokens + creates Uniswap V4 pools in one transaction
- **SigilHook** — Uniswap V4 hook capturing swap fees for developer rewards
- **SigilFeeVault** — Holds and distributes USDC fees to verified developers
- **PoolReward** — Milestone-based token unlock with community governance
- **Test Suite** — Mock contracts for EAS, comprehensive unit tests

### Agent Demo (Working Without API Keys)

The agent responds to all intents in offline mode:

| Command | Response |
|---------|----------|
| `hello` | Full help menu with all available commands |
| `price ETH` | 📈 ETH: $2,084.57 (24h +1.55%) — live data |
| `swap 0.1 ETH to USDC` | Swap preview, prompts wallet connect |
| `launch token for github.com/org/repo` | 🚀 Launch Preview with auto-generated name/symbol |
| `verify github.com/org/repo` | GitHub OAuth + file-based verification instructions |

---

## What's In Progress 🟡

| Item | Status | Notes |
|------|--------|-------|
| Database (Postgres) | ⏳ Need to provision | Neon free tier recommended |
| API Keys | ⏳ Need to obtain | Anthropic, GitHub OAuth |
| Contract Deployment | ⏳ Need to deploy to Base | 4 contracts in order |
| Frontend Deployment | ⏳ Vercel setup started | `npx vercel` initiated |
| Backend Deployment | ⏳ Not started | Railway recommended |

---

## Known Bugs 🔴

| Bug | Severity | Fix |
|-----|----------|-----|
| DB schema missing 3 columns (`poolId`, `deployTxHash`, `deployedBy`) in `projects` table | **Critical** — crashes token launch at runtime | Add columns to `schema.ts`, run migration |
| Swap/bridge/send handlers are preview-only stubs | **Medium** — no actual DEX execution | Integrate 0x or 1inch aggregator API |
| `pool_status` handler returns placeholder | **Low** — cosmetic | Wire to PoolReward contract read |

---

## Alpha Launch Checklist

### Phase 1: Infrastructure (Estimated: 1-2 hours)
- [ ] Provision Postgres database → set `DATABASE_URL`
- [ ] Fix DB schema (add 3 missing columns)
- [ ] Run migrations: `npx drizzle-kit generate && npx drizzle-kit migrate`
- [ ] Obtain `ANTHROPIC_API_KEY` for full chat agent
- [ ] Create GitHub OAuth App → set `GITHUB_CLIENT_ID` + `SECRET`

### Phase 2: Contracts (Estimated: 2-3 hours)
- [ ] Deploy SigilHook to Base mainnet
- [ ] Deploy SigilFeeVault to Base mainnet
- [ ] Deploy SigilFactory to Base mainnet → set `SIGIL_FACTORY_ADDRESS`
- [ ] Deploy PoolReward to Base mainnet
- [ ] Register EAS schema → set `EAS_SCHEMA_UID`
- [ ] Generate + fund deployer wallet (~$15 ETH) → set `DEPLOYER_PRIVATE_KEY`
- [ ] Generate attestation signer key → set `ATTESTATION_SIGNER_KEY`

### Phase 3: Deployment (Estimated: 1 hour)
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Vercel
- [ ] Set production `BASE_URL` and `FRONTEND_URL`
- [ ] Update GitHub OAuth callback URLs to production

### Phase 4: Testing (Estimated: 2-3 hours)
- [ ] End-to-end: Launch a token via chat → verify ownership → claim fees
- [ ] Verify GitHub OAuth flow works in production
- [ ] Test wallet connect + transaction signing
- [ ] Load test agent chat (ensure rate limits work)
- [ ] Test error handling for all failure modes (no wallet, bad links, network errors)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│          Next.js 15 / React 19                   │
│   Landing │ Verify │ Chat │ Developers           │
│        RainbowKit + wagmi (wallet)               │
└──────────────────┬──────────────────────────────┘
                   │ HTTP
┌──────────────────▼──────────────────────────────┐
│                   Backend                        │
│              Hono (TypeScript)                   │
│                                                  │
│  ┌─────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Agent   │  │  Verify  │  │   Deployer     │  │
│  │ (Claude) │  │  System  │  │  (Hot Wallet)  │  │
│  └────┬─────┘  └────┬─────┘  └──────┬─────────┘  │
│       │             │               │            │
│  ┌────▼─────────────▼───────────────▼─────────┐  │
│  │         Router (10 intents)                │  │
│  └────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
   ┌─────────┐ ┌──────┐ ┌─────────┐
   │ Postgres │ │ Base │ │   EAS   │
   │   (DB)   │ │(L2)  │ │(Attest) │
   └──────────┘ └──────┘ └─────────┘
```

---

## Cost Estimates

| Item | Cost |
|------|------|
| Database (Neon) | Free tier |
| Anthropic API | ~$5-10/mo at moderate usage |
| Deployer gas (Base) | ~$0.05/launch, $15 covers 100+ |
| EAS attestation gas | ~$0.01/attestation |
| Vercel (frontend) | Free tier |
| Railway (backend) | ~$5/mo |
| **Total for alpha** | **~$25-30 initial + ~$15/mo** |

---

## Files Modified This Session

| File | Change |
|------|--------|
| `src/config/env.ts` | Relaxed mandatory env vars to have defaults |
| `src/db/client.ts` | Graceful `DatabaseUnavailableError` instead of crash |
| `src/api/server.ts` | Global error handler + widened CORS for localhost |
| `src/attestation/eas.ts` | Lazy dynamic imports (fixed ESM/CJS crash) |
| `src/agent/engine.ts` | Dual-mode: online (Claude) / offline (regex) |
| `src/agent/local-parser.ts` | **[NEW]** Regex-based intent parser for all 10 intents |
