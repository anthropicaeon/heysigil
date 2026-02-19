import assert from "node:assert/strict";

const MCP_URL = process.env.MCP_URL || "https://heysigil.fund/mcp";
const PRIVY_TOKEN = process.env.PRIVY_TOKEN;
const MCP_LIMITED_TOKEN = process.env.MCP_LIMITED_TOKEN;

async function rawRpcCall(request, token) {
  const headers = {
    "content-type": "application/json",
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { status: response.status, json };
}

async function main() {
  const baseRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {},
  };

  const noToken = await rawRpcCall(baseRequest, undefined);
  assert.equal(noToken.status, 401, "missing token should return HTTP 401");

  const invalidToken = await rawRpcCall(baseRequest, "sgl_invalid_token_for_authz_test");
  assert.equal(invalidToken.status, 401, "invalid token should return HTTP 401");

  if (PRIVY_TOKEN) {
    const privyResult = await rawRpcCall(baseRequest, PRIVY_TOKEN);
    assert.equal(
      privyResult.status,
      401,
      "Privy JWT should be rejected on /mcp (MCP PAT only policy)",
    );
  } else {
    console.log("SKIP privy-token policy check (PRIVY_TOKEN not set)");
  }

  if (MCP_LIMITED_TOKEN) {
    const writeToolCall = await rawRpcCall(
      {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "sigil_governance_vote",
          arguments: {
            proposalId: "demo-proposal",
            support: true,
          },
        },
      },
      MCP_LIMITED_TOKEN,
    );

    assert.equal(writeToolCall.status, 200, "tools/call should return HTTP 200 with JSON-RPC error");
    assert.ok(writeToolCall.json?.error, "expected JSON-RPC error for missing scope");
    assert.equal(writeToolCall.json.error.code, -32001, "expected missing scope error code");
  } else {
    console.log("SKIP limited-scope check (MCP_LIMITED_TOKEN not set)");
  }

  console.log(`PASS mcp remote authz (${MCP_URL})`);
}

await main();
