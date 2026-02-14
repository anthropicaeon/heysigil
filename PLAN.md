# Bankr.bot Fork — No X API Dependency

## Problem Statement

Bankr.bot is an AI-powered crypto assistant that lets users trade, swap, bridge, and
manage digital assets via natural language. The original bot is tightly coupled to the
X (Twitter) API for:

1. **Listening for mentions** — polling `userMentionTimeline` every ~10s
2. **Replying to users** — posting tweet replies with results
3. **User identity** — wallets are tied to X account IDs via Privy
4. **Discovery** — users find the bot by tagging @bankrbot in public posts

The X API costs ~$50k/month at enterprise scale, X has suspended Bankr before, and
there is significant platform risk. This fork removes the X API dependency entirely.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Channel Adapters                    │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌────────┐  │
│  │ Telegram │ │ Discord │ │ Farcaster│ │  Web   │  │
│  │   Bot    │ │   Bot   │ │  Client  │ │Terminal│  │
│  └────┬─────┘ └────┬────┘ └────┬─────┘ └───┬────┘  │
│       └─────────────┴──────────┴────────────┘       │
│                        │                             │
│              Unified Message Bus                     │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│                   Core Engine                        │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ LLM Command  │  │   Action     │                 │
│  │   Parser     │──│   Router     │                 │
│  └──────────────┘  └──────┬───────┘                 │
│                           │                          │
│  ┌────────────────────────▼─────────────────────┐   │
│  │              Action Handlers                  │   │
│  │  swap │ bridge │ send │ balance │ launch │... │   │
│  └────────────────────────┬─────────────────────┘   │
└───────────────────────────┬─────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────┐
│                Infrastructure Layer                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Wallet  │  │  DEX /   │  │   Database /      │  │
│  │  Manager │  │  Bridge  │  │   User State      │  │
│  │ (Privy)  │  │  APIs    │  │   (PostgreSQL)    │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Project Scaffolding & Core Engine

#### 1.1 — Project Setup
- Initialize TypeScript project (Node.js / Bun)
- Set up ESLint, Prettier, tsconfig
- Define directory structure:
  ```
  src/
    adapters/        # Channel adapters (telegram, discord, farcaster, web)
    core/            # LLM parser, action router, message bus
    handlers/        # Action handlers (swap, send, balance, etc.)
    wallet/          # Wallet management abstraction
    db/              # Database models and migrations
    config/          # Environment and configuration
    types/           # Shared TypeScript types
  ```
- Set up environment variable schema (no X/Twitter vars)

#### 1.2 — Unified Message Interface
Define a platform-agnostic message type that all adapters produce:

```typescript
interface IncomingMessage {
  id: string;
  platform: 'telegram' | 'discord' | 'farcaster' | 'web';
  userId: string;          // platform-specific user ID
  username: string;        // display name / handle
  text: string;            // raw message text
  replyToMessageId?: string;
  channelId?: string;      // group/channel context
  timestamp: Date;
}

interface OutgoingMessage {
  platform: string;
  recipientId: string;
  text: string;
  replyToMessageId?: string;
  metadata?: Record<string, unknown>;
}
```

#### 1.3 — LLM Command Parser
- Integrate with an LLM (OpenAI, Anthropic, or Bankr's own LLM gateway)
- Parse natural language into structured actions:
  ```typescript
  interface ParsedAction {
    intent: 'swap' | 'send' | 'balance' | 'bridge' | 'launch_token' | 'price' | 'help';
    params: Record<string, string | number>;
    confidence: number;
  }
  ```
- Use function calling / tool use for structured output
- Handle ambiguity by asking follow-up questions

#### 1.4 — Action Router
- Map parsed intents to handler functions
- Handle errors, rate limiting, and retries
- Queue system for async operations (token launches, swaps)

---

### Phase 2: Channel Adapters (X API Replacements)

#### 2.1 — Telegram Bot (Primary — replaces X)
- **Why first:** Free API, 900M+ users, bot-native platform, rich UI (inline keyboards)
- Use `grammy` or `telegraf` library
- Support both private chats and group mentions
- Implement:
  - `/start` — onboarding, wallet creation
  - Natural language message handling (no slash commands needed)
  - Inline keyboards for confirmation (e.g., "Swap 0.1 ETH for USDC? [Confirm] [Cancel]")
  - Transaction status updates via message edits

#### 2.2 — Discord Bot
- Use `discord.js` v14
- Support slash commands and natural language in designated channels
- Thread-based conversations for multi-step operations
- Role-based access control for group wallets

#### 2.3 — Web Terminal
- Lightweight chat UI (React or plain HTML/JS)
- WebSocket connection for real-time responses
- Authentication via wallet connect (WalletConnect, Privy, or email)
- No platform dependency — fully self-hosted

#### 2.4 — Farcaster Integration (Optional)
- Use Neynar API or Farcaster Hub
- Monitor casts mentioning the bot
- Reply with results as casts
- Decentralized — no platform risk

---

### Phase 3: Wallet & Identity Management

#### 3.1 — Platform-Agnostic Identity
The original ties wallets to X account IDs. We need a new identity model:

```
User
  ├── id (internal UUID)
  ├── wallets[] (EVM + Solana)
  └── linked_accounts[]
        ├── telegram_id
        ├── discord_id
        ├── farcaster_fid
        └── web_session_id
```

- Users can link multiple platform accounts to one wallet
- Cross-platform: start on Telegram, continue on Discord, same wallet
- Privy can still be used (supports email, phone, social logins — not just X)

#### 3.2 — Wallet Operations
- Use Privy server wallets or alternatives (Turnkey, Fireblocks, custom HD wallets)
- Support EVM chains (Base, Ethereum, Polygon) and Solana
- Transaction signing and submission
- Balance tracking across chains

---

### Phase 4: Trading & DeFi Integration

Two options — pick based on scope:

#### Option A: Use Bankr API as Backend
- Simplest path — call `https://api.bankr.bot` endpoints
- `/agent/prompt` for async operations
- `/agent/sign` and `/agent/submit` for transactions
- Requires Bankr API key (`bk_*`)
- Pros: All trading logic handled, multi-chain support built in
- Cons: Dependency on Bankr's infrastructure

#### Option B: Direct On-Chain Integration
- Build trading logic directly using:
  - **Swaps:** 0x API, 1inch, Uniswap SDK, Jupiter (Solana)
  - **Bridges:** Across, Stargate, LayerZero
  - **Token launches:** Clanker protocol (Base), pump.fun (Solana)
  - **Price data:** CoinGecko, DeFiLlama
- Pros: Full control, no third-party dependency
- Cons: Significant engineering effort

#### Recommended: Start with Option A, progressively move to Option B

---

### Phase 5: Database & State Management

- PostgreSQL for persistent storage
- Schema:
  - `users` — identity, linked accounts, preferences
  - `wallets` — addresses, chains, linked user
  - `transactions` — tx hash, status, platform, user
  - `conversations` — thread context for multi-step flows
- Redis for session caching and rate limiting

---

### Phase 6: Deployment & Operations

- Docker containerized deployment
- Environment-based configuration (no hardcoded secrets)
- Health checks and monitoring
- Graceful shutdown handling for each adapter
- Logging with structured output (pino)

---

## What We're NOT Building (Out of Scope)

- X/Twitter integration of any kind
- Mobile native apps (web terminal covers mobile via browser)
- Custom blockchain / L2
- Token ($BNKR equivalent) — can be added later

---

## Key Decisions Needed

| Decision | Options | Recommendation |
|----------|---------|----------------|
| Runtime | Node.js vs Bun | Bun (faster, built-in TS) |
| Primary channel | Telegram vs Discord vs Web | Telegram first |
| Wallet infra | Privy vs Turnkey vs custom | Privy (proven, multi-auth) |
| Trading backend | Bankr API vs direct on-chain | Bankr API first, then migrate |
| LLM provider | OpenAI vs Anthropic vs Bankr LLM | Anthropic (Claude) |
| Database | PostgreSQL vs SQLite | PostgreSQL |
| Deployment | VPS vs serverless vs Docker | Docker on VPS |

---

## File Structure (Target)

```
testoooor/
├── src/
│   ├── adapters/
│   │   ├── telegram.ts
│   │   ├── discord.ts
│   │   ├── farcaster.ts
│   │   ├── web.ts
│   │   └── types.ts          # IncomingMessage, OutgoingMessage
│   ├── core/
│   │   ├── engine.ts          # Main message processing loop
│   │   ├── parser.ts          # LLM command parser
│   │   ├── router.ts          # Action router
│   │   └── bus.ts             # Message bus
│   ├── handlers/
│   │   ├── swap.ts
│   │   ├── send.ts
│   │   ├── balance.ts
│   │   ├── bridge.ts
│   │   ├── price.ts
│   │   ├── launch.ts
│   │   └── help.ts
│   ├── wallet/
│   │   ├── manager.ts         # Wallet CRUD
│   │   ├── privy.ts           # Privy integration
│   │   └── types.ts
│   ├── db/
│   │   ├── schema.ts          # Drizzle / Prisma schema
│   │   ├── migrations/
│   │   └── client.ts
│   ├── config/
│   │   └── env.ts             # Zod-validated env vars
│   └── index.ts               # Entry point
├── tests/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Getting Started (Phase 1 First Steps)

1. `bun init` — scaffold project
2. Install core deps: `zod`, `pino`, `dotenv`
3. Define message types (`src/adapters/types.ts`)
4. Build LLM parser (`src/core/parser.ts`)
5. Build Telegram adapter (`src/adapters/telegram.ts`)
6. Wire up engine loop (`src/core/engine.ts`)
7. Add first handler: `balance` (simplest to test)
8. Test end-to-end: Telegram message → parse → balance check → reply
