# @heysigil/sigil-core

Shared primitives used across Sigil packages and services.

## Install

```bash
npm install @heysigil/sigil-core
```

## What This Package Provides

- Typed error classes (`SigilError`, `ApiError`, `AuthError`, `ValidationError`)
- Scope constants and type unions (`SIGIL_SCOPES`, `SigilScope`)
- Reusable Zod schemas for token metadata and scope validation
- Shared request and token info TypeScript types

## Quick Example

```ts
import { sigilScopeSchema, mcpTokenMetadataSchema } from "@heysigil/sigil-core";

const scope = sigilScopeSchema.parse("launch:read");

const token = mcpTokenMetadataSchema.parse({
  id: "d290f1ee-6c54-4b01-90e6-d701748f0851",
  name: "Production Agent",
  tokenPrefix: "sgl_abc",
  scopes: [scope],
  expiresAt: null,
  lastUsedAt: null,
  revokedAt: null,
  createdAt: "2026-02-19T00:00:00.000Z",
});
```

## Development

From the repository root:

```bash
npm run --workspace @heysigil/sigil-core typecheck
npm run --workspace @heysigil/sigil-core build
```

## Additional Docs

- `CHANGELOG.md`
- `CONTRIBUTING.md`
