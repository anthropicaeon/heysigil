# Contributing to @heysigil/sigilbot

## Scope

`@heysigil/sigilbot` is a deployable runtime stack that connects back to Sigil `/connect`.
Prioritize deterministic handshake behavior, strict token scope checks, and stable deployment ergonomics.

## Prerequisites

- Node.js 18+
- npm workspaces enabled

## Local Workflow

From repository root:

```bash
npm install
npm run --workspace @heysigil/sigilbot typecheck
npm run --workspace @heysigil/sigilbot build
```

## Contribution Rules

- Preserve handshake schema compatibility unless explicitly versioned.
- Keep `SIGIL_MCP_TOKEN` handling secure and avoid plaintext persistence.
- Keep Docker and Railway config aligned with package runtime changes.
- Update `README.md` and `CHANGELOG.md` for user-visible behavior changes.

## Quality Checks

- Typecheck passes.
- Build generates `dist/`.
- Health and handshake endpoints respond in local runtime tests.
