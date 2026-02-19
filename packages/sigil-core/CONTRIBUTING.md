# Contributing to @heysigil/sigil-core

## Scope

`@heysigil/sigil-core` is the shared contract layer for other Sigil packages.
Changes here can affect SDK and MCP compatibility.

## Prerequisites

- Node.js 18+
- npm workspaces enabled

## Local Workflow

From repository root:

```bash
npm install
npm run --workspace @heysigil/sigil-core typecheck
npm run --workspace @heysigil/sigil-core build
```

## Contribution Rules

- Keep exported types backward-compatible whenever possible.
- Treat schema changes as API changes.
- Add or update docs when exports or behavior change.
- Use clear error names and messages for downstream consumers.

## Release Notes

- Update `CHANGELOG.md` for user-visible changes.
- Verify package output in `dist/` before publishing.
