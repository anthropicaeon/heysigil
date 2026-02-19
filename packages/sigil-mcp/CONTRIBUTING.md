# Contributing to @heysigil/sigil-mcp

## Scope

`@heysigil/sigil-mcp` exposes Sigil functionality through MCP.
Changes affect agent and tool integrations, so API shape must remain stable.

## Prerequisites

- Node.js 18+
- npm workspaces enabled
- Running Sigil API for end-to-end testing (optional but recommended)

## Local Workflow

From repository root:

```bash
npm install
npm run --workspace @heysigil/sigil-mcp typecheck
npm run --workspace @heysigil/sigil-mcp build
```

## Manual Smoke Test

```bash
SIGIL_API_URL=http://localhost:3001 sigil-mcp --transport=stdio
```

## Contribution Rules

- Keep tool names stable unless versioning a breaking change.
- Document new tools and transport options in `README.md`.
- Preserve JSON-RPC and MCP response shape compatibility.
- Update `CHANGELOG.md` for any user-visible change.
