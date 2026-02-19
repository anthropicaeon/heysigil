# Quick Launch + Connect + SigilBot Pipeline Map

## Scope

This document maps the end-to-end control plane for:

- Hero one-click quick launch (no inputs)
- One-time claim-token redemption and post-claim metadata update
- Connect one-click SigilBot runtime provisioning on Railway
- Secure connect handshake flow with intent + endpoint validation

## Entrypoints And Route Tree

Backend entrypoints:

- `src/index.ts` bootstraps API + background services
- `src/api/server.ts` mounts routes under `/api/*`

Relevant mounted routes:

- `/api/launch` -> `src/api/routes/launch.ts`
- `/api/claim` -> `src/api/routes/claim.ts`
- `/api/connect` -> `src/api/routes/connect.ts`
- `/api/mcp` -> `src/api/routes/mcp.ts`

Frontend entrypoints:

- Hero quick launch: `web/src/components/sections/sigil-hero.tsx`
- Connect control plane: `web/src/components/ConnectFlow/index.tsx`

## Package Relationships

Runtime/package dependency chain:

- `packages/sigilbot` runtime uses `@heysigil/sigil-sdk`
- `@heysigil/sigil-sdk` calls Sigil API endpoints (`/api/mcp`, `/api/chat`, etc.)
- `packages/sigilbot` optional sidecar path uses `@heysigil/sigil-mcp`

Provisioning control plane:

- API route `/api/connect/quick-launch`
- `src/services/infra/railway-provisioner.ts`
- Railway deploys `packages/sigilbot` with env injection

## Quick Launch Pipeline

Primary files:

- `src/api/routes/launch.ts`
- `src/services/launch.ts`
- `src/services/quick-launch.ts`
- `src/db/schema.ts`

Flow:

1. User clicks `1 Click Launch` in hero.
2. Frontend calls `POST /api/launch/quick`.
3. Backend enforces strict per-IP guardrail (`quick_launch_ip_guardrails`).
4. Backend creates unclaimed launch using:
   - internal unique project ID (`quick:<uuid>`)
   - default metadata repo link (`github:heysigil/heysigil`) in `devLinks`
   - deploy routing to `dev = address(0)`
5. Backend generates one-time claim token:
   - plaintext returned once
   - hash stored in `launch_claim_tokens`
   - expiry enforced
6. Hero shows token once with explicit save/copy warning.

## Claim-Later Pipeline

Primary files:

- `src/api/routes/claim.ts`
- `src/services/quick-launch.ts`
- `src/services/github-growth.ts`

Flow:

1. User submits one-time secret to `POST /api/claim/launch-token` (auth required).
2. Backend validates token:
   - prefix lookup
   - constant-time hash compare
   - checks not expired and not consumed
   - atomic consume update
3. Backend binds project ownership to claimant context (`ownerWallet` + optional `userId`).
4. Backend best-effort calls `assignDev` for fee routing.
5. Backend best-effort triggers Sigil repo star side-effect (non-blocking).
6. User updates metadata later with `PATCH /api/claim/projects/{projectId}`.

## Connect Pipeline (Manual + One-Click)

Primary files:

- `src/api/routes/connect.ts`
- `src/services/connect-security.ts`
- `src/services/connect-intent.ts`
- `src/services/infra/railway-provisioner.ts`
- `web/src/components/ConnectFlow/index.tsx`

Manual handshake flow:

1. Frontend requests intent: `POST /api/connect/intent`.
2. Backend validates endpoint (SSRF checks + HTTPS in production).
3. Backend creates one-time intent token in `connect_handshake_intents`.
4. Frontend calls `POST /api/connect/handshake` with `intentToken`.
5. Backend atomically consumes intent and proxies handshake to runtime.
6. Connection persisted in `connected_bots`.

One-click connect flow:

1. Frontend calls `POST /api/connect/quick-launch`.
2. Backend creates runtime MCP token (shown once).
3. Backend provisions runtime via Railway service wrapper.
4. Backend waits for health, runs handshake, persists connection.
5. Backend stores provisioning status in `connect_quick_launches`.
6. Frontend can poll status via `GET /api/connect/quick-launch/:id`.

## Sequence Diagram: Quick Launch + Claim

```text
Hero -> API /api/launch/quick
API -> quick_launch_ip_guardrails (reserve IP)
API -> launch service (deploy/register unclaimed)
API -> launch_claim_tokens (store hashed token)
API -> Hero (plaintext token once)

User -> API /api/claim/launch-token
API -> launch_claim_tokens (validate + consume atomically)
API -> projects (set owner/user binding)
API -> chain assignDev (best effort)
API -> GitHub star hook (best effort)
API -> User (claimed)
```

## Sequence Diagram: Connect One-Click

```text
Connect UI -> API /api/connect/quick-launch
API -> MCP token service (create one-time PAT)
API -> Railway provisioner (create service + set env + deploy)
API -> Runtime /health (poll)
API -> Runtime /v1/handshake
API -> connected_bots + connect_quick_launches (persist)
API -> Connect UI (endpoint + PAT once + status)
```

## Data Plane vs Control Plane

Control plane:

- `/api/connect/*`, `/api/mcp/*`, provisioning metadata tables

Runtime data plane:

- Bot runtime endpoint `/v1/*` hosted per deployment
- Handshake/chat requests between API and runtime

## Key Env Vars

Quick launch / claim:

- `QUICK_LAUNCH_CLAIM_TOKEN_TTL_MINUTES`
- `QUICK_LAUNCH_IP_SALT`
- `GITHUB_AUTO_STAR_TOKEN` (best-effort star hook)

Connect security:

- `CONNECT_HANDSHAKE_INTENT_TTL_SECONDS`
- `NODE_ENV` (enforces HTTPS policy for connect endpoint validation)

Railway provisioning:

- `RAILWAY_API_TOKEN`
- `RAILWAY_PROJECT_ID`
- `RAILWAY_ENVIRONMENT_ID`
- `RAILWAY_SERVICE_NAME_PREFIX`
- `RAILWAY_MIN_CPU_MILLICORES`
- `RAILWAY_MIN_MEMORY_MB`
