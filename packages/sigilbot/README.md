# @heysigil/sigilbot

Deployable Sigil bot runtime stack for Docker and Railway.

`sigilbot` is the first bot stack for the `/connect` control-plane flow. It reuses:

- `@heysigil/sigil-sdk` for Sigil API calls
- `@heysigil/sigil-core` for shared types/errors/scopes
- `@heysigil/sigil-mcp` as optional sidecar transport

## Install

```bash
npm install @heysigil/sigilbot
```

## Runtime Endpoints

- `GET /health`
- `GET /v1/capabilities`
- `POST /v1/handshake`
- `POST /v1/chat`
- `GET /v1/bots`

## Environment Variables

Use `.env.example` as baseline.

Required:

- `SIGIL_API_URL`
- `SIGIL_MCP_TOKEN`

Optional but recommended:

- `SIGIL_CONNECT_SHARED_SECRET` for handshake protection
- `SIGILBOT_MCP_SIDECAR_ENABLED=true` to boot `sigil-mcp` as sidecar

## Local Development

From repository root:

```bash
npm run --workspace @heysigil/sigilbot typecheck
npm run --workspace @heysigil/sigilbot build
npm run --workspace @heysigil/sigilbot dev
```

## Docker

From repository root:

```bash
docker build -f packages/sigilbot/Dockerfile -t sigilbot .
docker run --rm -p 8789:8789 --env-file packages/sigilbot/.env.example sigilbot
```

## Railway

Use `packages/sigilbot/railway.toml` with Dockerfile deployment.
Set project env vars in Railway dashboard before deploy.
