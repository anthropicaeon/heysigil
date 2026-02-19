import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { createSigilClient } from "@heysigil/sigil-sdk";

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function main() {
  const mcpDist = path.join(
    process.cwd(),
    "node_modules",
    "@heysigil",
    "sigil-mcp",
    "dist",
  );

  const { SigilMcpServer } = await import(pathToFileURL(path.join(mcpDist, "server.js")).href);
  const { createTools } = await import(pathToFileURL(path.join(mcpDist, "tools.js")).href);

  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    const pathWithQuery = `${parsed.pathname}${parsed.search}`;
    if (pathWithQuery.startsWith("/api/launch/list")) {
      return jsonResponse(200, { items: [{ id: "launch-1" }] });
    }
    return jsonResponse(200, { ok: true });
  };

  const client = createSigilClient({
    baseUrl: "https://api.example.com",
    token: "test-token",
    fetch: fetchImpl,
  });

  const server = new SigilMcpServer(createTools(client));

  const init = await server.handleRequest({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {},
  });

  assert.equal(init.jsonrpc, "2.0");
  assert.equal(init.result.serverInfo.name, "sigil-mcp");
  assert.equal(typeof init.result.serverInfo.version, "string");
  assert.ok(init.result.serverInfo.version.length > 0);

  const tools = await server.handleRequest({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list",
    params: {},
  });

  assert.ok(Array.isArray(tools.result.tools), "tools/list should return tools array");
  assert.ok(tools.result.tools.length >= 8, "Expected at least 8 MCP tools");
  assert.ok(
    tools.result.tools.some((tool) => tool.name === "sigil_launch_list"),
    "Expected sigil_launch_list tool in MCP surface",
  );

  const governance = await server.handleRequest({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "sigil_governance_list",
      arguments: {},
    },
  });

  const governanceResult = JSON.parse(governance.result.content[0].text);
  assert.equal(governanceResult.status, "not_implemented");

  const launchList = await server.handleRequest({
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: {
      name: "sigil_launch_list",
      arguments: { limit: 1 },
    },
  });

  const launchResult = JSON.parse(launchList.result.content[0].text);
  assert.equal(launchResult.items[0].id, "launch-1");

  console.log("PASS mcp smoke");
}

await main();
