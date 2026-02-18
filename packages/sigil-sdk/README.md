# @heysigil/sigil-sdk

Typed SDK for Sigil API and MCP token lifecycle.

## Install

```bash
npm install @heysigil/sigil-sdk
```

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

