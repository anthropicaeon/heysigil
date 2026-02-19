# Contributing to @heysigil/sigil-sdk

## Scope

`@heysigil/sigil-sdk` is the typed client interface for Sigil APIs.
Backwards compatibility matters for integrators.

## Prerequisites

- Node.js 18+
- npm workspaces enabled

## Local Workflow

From repository root:

```bash
npm install
npm run --workspace @heysigil/sigil-sdk typecheck
npm run --workspace @heysigil/sigil-sdk build
```

## Contribution Rules

- Preserve module method names and return contracts unless versioned.
- Keep generated `dist/` output aligned with source changes.
- Document new modules or method changes in `README.md`.
- Update `CHANGELOG.md` for user-visible behavior updates.

## Quality Checks

- Typecheck should pass with no errors.
- Build output should contain expected `dist/*.js` and `dist/*.d.ts` files.
