import assert from "node:assert/strict";

const MCP_URL = process.env.MCP_URL || "https://heysigil.fund/mcp";
const MCP_TOKEN = process.env.MCP_TOKEN;

if (!MCP_TOKEN) {
  throw new Error("MCP_TOKEN is required for mcp-remote-smoke");
}

async function rpcCall(request, token) {
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { status: response.status, json };
}

async function main() {
  const init = await rpcCall(
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {},
    },
    MCP_TOKEN,
  );

  assert.equal(init.status, 200, "initialize should return HTTP 200");
  assert.equal(init.json?.jsonrpc, "2.0");
  assert.equal(init.json?.result?.serverInfo?.name, "sigil-mcp");

  const tools = await rpcCall(
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    },
    MCP_TOKEN,
  );

  assert.equal(tools.status, 200, "tools/list should return HTTP 200");
  assert.ok(Array.isArray(tools.json?.result?.tools), "tools/list must return an array");
  assert.ok(tools.json.result.tools.length >= 8, "expected at least 8 tools in MCP surface");

  const ping = await rpcCall(
    {
      jsonrpc: "2.0",
      id: 3,
      method: "ping",
      params: {},
    },
    MCP_TOKEN,
  );

  assert.equal(ping.status, 200, "ping should return HTTP 200");
  assert.equal(ping.json?.result?.ok, true, "ping result should be ok=true");

  console.log(`PASS mcp remote smoke (${MCP_URL})`);
}

await main();
