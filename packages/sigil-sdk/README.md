# @heysigil/sigil-sdk

Typed TypeScript SDK for the Sigil API and MCP token lifecycle.

## Install

```bash
npm install @heysigil/sigil-sdk
```

## Requirements

- Node.js 18+
- Sigil API base URL
- Auth token for authenticated endpoints

## Quick Start

```ts
import { createSigilClient } from "@heysigil/sigil-sdk";

const sigil = createSigilClient({
  baseUrl: "https://sigil.fund",
  token: process.env.SIGIL_TOKEN,
});

const launches = await sigil.launch.list({ limit: 10 });
```

## Modules

- `verify`: challenge/check/status/list/detail
- `launch`: create/list/myProjects/deployer/project
- `wallet`: me/session wallet APIs
- `fees`: totals/distributions/project/claim
- `claim`: attestation claim status
- `chat`: existing Sigil chat API
- `dashboard`: composed overview helper
- `developers`: static capability metadata
- `governance`: explicit `not implemented` placeholder
- `mcp`: create/list/revoke/rotate MCP tokens + token info

## Error Handling

```ts
import { ApiError } from "@heysigil/sigil-sdk";

try {
  await sigil.launch.create({ devLinks: ["https://github.com/your/repo"] });
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.status, error.message);
  }
}
```

## Development

From the repository root:

```bash
npm run --workspace @heysigil/sigil-sdk typecheck
npm run --workspace @heysigil/sigil-sdk build
```

## Additional Docs

- `CHANGELOG.md`
- `CONTRIBUTING.md`
