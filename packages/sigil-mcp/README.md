# @heysigil/sigil-mcp

Sigil MCP server package for agent tooling.

Supports:
- `stdio` transport (default)
- Streamable HTTP transport (`/mcp`)

## Environment

- `SIGIL_API_URL` (default: `http://localhost:3001`)
- `SIGIL_MCP_TOKEN` (Privy token or MCP PAT)
- `SIGIL_MCP_TRANSPORT` (`stdio` or `http`)
- `SIGIL_MCP_HOST` (default: `127.0.0.1`)
- `SIGIL_MCP_PORT` (default: `8788`)

## Run

```bash
sigil-mcp --transport=stdio
```

```bash
SIGIL_MCP_TRANSPORT=http sigil-mcp
```

## Tools

- `sigil_verify_create_challenge`
- `sigil_verify_check`
- `sigil_dashboard_overview`
- `sigil_chat_message`
- `sigil_launch_list`
- `sigil_launch_create`
- `sigil_developers_info`
- `sigil_governance_list` (placeholder)
- `sigil_governance_vote` (placeholder)

