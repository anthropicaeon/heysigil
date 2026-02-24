---
name: x-agent
description: Twitter API-powered bot that monitors @HeySigilBot mentions and launches Sigil tokens.
---

# X Agent — Launch Tokens via @HeySigilBot Mentions

Self-contained service that monitors Twitter mentions of `@HeySigilBot`, parses launch intents, deploys tokens via the Sigil backend, and replies with the result.

## Required Environment Variables

```bash
# Twitter API (OAuth 1.0a — get from developer.x.com)
TWITTER_API_KEY=your_consumer_key
TWITTER_API_SECRET=your_consumer_secret
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret

# X Agent Config
X_AGENT_BOT_HANDLE=HeySigilBot
X_AGENT_SIGIL_API_URL=https://heysigil-production.up.railway.app
X_AGENT_MCP_TOKEN=sigil_pat_...
X_AGENT_POLL_INTERVAL_MS=30000
X_AGENT_DRY_RUN=false
```

## Run

```bash
bun src/x-agent/index.ts
```

## Tweet Format

Users tweet:
```
@HeySigilBot launch $COOL for github.com/user/repo
```

Bot replies:
```
🚀 $COOL launched on Base!
📊 heysigil.fund/token/0x1234...abcd
🔗 basescan.org/token/0x1234...abcd
Dev fees → github.com/user/repo
Claim at heysigil.fund/connect
```

## Safety

- Max 1 launch per author per 24h
- Duplicate tweet IDs never processed twice
- Dry run mode: `X_AGENT_DRY_RUN=true`
