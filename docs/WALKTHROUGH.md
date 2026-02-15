# Sigil — Systems Walkthrough

## 1. Sentinel Security Layer

Three-layer security system (`src/services/sentinel.ts`) that screens every action before execution.

### Layer 1 — GoPlus Token Screening
Calls [GoPlus API](https://gopluslabs.io) to check token contracts for:

| Check | Severity |
|---|---|
| Honeypot (can't sell) | 🚨 Blocked |
| Blacklisted / airdrop scam | 🚨 Blocked |
| Owner can reclaim ownership | 🚨 Blocked |
| Hidden owner | ⚠️ Warning |
| Self-destruct in contract | ⚠️ Warning |
| Buy/sell tax > 10% | ⚠️ Warning |
| < 10 holders | ⚠️ Warning |
| Proxy contract | ℹ️ Info |

No API key needed. Supports Base, Ethereum, Polygon, BSC, Arbitrum, Optimism.

### Layer 2 — Prompt Injection Guard
Pattern-matching against 15+ attack vectors:

- **Instruction override** — "ignore all previous instructions"
- **Persona hijack** — "you are now a…", "pretend to be…"
- **System prompt extraction** — "show me your system prompt"
- **Fund drain** — "send all my ETH to…", "drain"
- **Code injection** — `eval()`, `<script>`, `{{template}}`

Single non-critical match → warning. Critical match → blocked.

### Layer 3 — Address Blocklist
- Known scam/phishing addresses (extensible at runtime via `blockAddress()`)
- Suspicious vanity patterns (30+ leading zeros, `0xdead` prefix)
- Basic format validation

### Composite Screening
All three layers run via `screenAction()` — the single entry point:

```typescript
const result = await screenAction({
  userMessage: "swap 1 ETH for TOKEN_X",
  intent: "swap",
  addresses: ["0xRecipient..."],
  tokenAddress: "0xTokenContract...",
  chain: "base",
});

if (!result.allowed) {
  // Block the action, show formatScreenMessage(result)
}
```

---

## 2. Privy Login System

Replaced RainbowKit/Wagmi with [Privy](https://privy.io) for social login + embedded wallets.

### Login Methods
- **GitHub** — OAuth flow
- **Telegram** — Bot-based auth
- **Email** — OTP code
- **Farcaster** — Social auth

### Frontend Files

| File | Purpose |
|---|---|
| `web/src/providers/PrivyAuthProvider.tsx` | Privy provider — configures login methods, Sigil branding (#482863 accent), auto-creates embedded EVM wallet on login |
| `web/src/app/LayoutInner.tsx` | Nav login button — "Sign In" CTA when logged out, shows avatar + username + logout when authenticated |
| `web/src/app/chat/page.tsx` | Sends Bearer auth token with API requests, uses Privy userId as persistent session identifier |
| `web/src/components/PortfolioSidebar.tsx` | Shows user identity card (name + provider), sign-in prompt for unauthenticated, wallet gated behind auth |
| `web/src/components/VerifyFlow.tsx` | Migrated from wagmi/RainbowKit to Privy for wallet auto-fill |

### Backend Files

| File | Purpose |
|---|---|
| `src/middleware/auth.ts` | JWT verification — `privyAuth()` (strict) and `privyAuthOptional()` (soft) |
| `src/api/server.ts` | Optional auth on `/api/chat/*`, `/api/wallet/*`, `/api/launch/*` |
| `src/config/env.ts` | `PRIVY_APP_ID` + `PRIVY_APP_SECRET` |

### Auth Flow

```
User clicks "Sign In" → Privy modal (GitHub/Telegram/Email/Farcaster)
→ User authenticates → Privy returns access token + user object
→ Frontend sends Bearer token with API calls
→ Backend middleware verifies JWT via @privy-io/server-auth
→ userId (DID) attached to request context
```

### Environment Variables

```env
# Frontend (.env)
NEXT_PUBLIC_PRIVY_APP_ID=your-app-id

# Backend (.env)
PRIVY_APP_ID=your-app-id
PRIVY_APP_SECRET=your-app-secret
```

### Graceful Fallback
- If `PRIVY_APP_ID` is not set, no login button appears
- Backend middleware passes through when Privy isn't configured (dev mode)
- Components use `useOptionalPrivy()` — catches errors if Privy provider is absent

### Dependencies Changed

```diff
Frontend:
- @rainbow-me/rainbowkit, wagmi, viem, @tanstack/react-query
+ @privy-io/react-auth

Backend:
+ @privy-io/server-auth
```

### Deleted Files
- `web/src/providers/Web3Provider.tsx` (old RainbowKit/Wagmi provider)
