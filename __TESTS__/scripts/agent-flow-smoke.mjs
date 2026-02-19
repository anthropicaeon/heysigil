import assert from "node:assert/strict";

const MCP_URL = process.env.MCP_URL || "https://heysigil.fund/mcp";
const AGENT_TOKEN = process.env.AGENT_MCP_TOKEN || process.env.MCP_TOKEN;
const AGENT_SESSION_ID = process.env.AGENT_SESSION_ID;

if (!AGENT_TOKEN) {
  throw new Error("AGENT_MCP_TOKEN or MCP_TOKEN is required for agent-flow-smoke");
}

async function rpcCall(request) {
  const response = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${AGENT_TOKEN}`,
    },
    body: JSON.stringify(request),
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { status: response.status, json };
}

function parseToolPayload(toolResponse) {
  const content = toolResponse?.json?.result?.content;
  assert.ok(Array.isArray(content) && content.length > 0, "tool response content missing");
  const firstText = content[0]?.text;
  assert.equal(typeof firstText, "string", "tool response payload must be text");
  return JSON.parse(firstText);
}

async function main() {
  const init = await rpcCall({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {},
  });
  assert.equal(init.status, 200, "initialize should return HTTP 200");

  const launches = await rpcCall({
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "sigil_launch_list",
      arguments: { limit: 1, sort: "newest" },
    },
  });
  assert.equal(launches.status, 200, "sigil_launch_list should return HTTP 200");
  const launchesPayload = parseToolPayload(launches);
  assert.ok(Array.isArray(launchesPayload.launches), "launches payload should include launches[]");

  const agentFeed = await rpcCall({
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "sigil_chat_agent_feed",
      arguments: { limit: 20 },
    },
  });
  assert.equal(agentFeed.status, 200, "sigil_chat_agent_feed should return HTTP 200");
  if (agentFeed.json?.error?.code === -32001) {
    throw new Error(
      "Token missing chat:write scope for agent feed. Provide AGENT_MCP_TOKEN with chat scopes.",
    );
  }
  const feedPayload = parseToolPayload(agentFeed);
  assert.ok(Array.isArray(feedPayload.messages), "agent feed payload should include messages[]");

  if (AGENT_SESSION_ID) {
    const history = await rpcCall({
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: {
        name: "sigil_chat_history",
        arguments: {
          sessionId: AGENT_SESSION_ID,
          limit: 10,
          offset: 0,
        },
      },
    });

    assert.equal(history.status, 200, "sigil_chat_history should return HTTP 200");
    if (history.json?.error?.code === -32001) {
      throw new Error(
        "Token missing chat:write scope for chat history. Provide AGENT_MCP_TOKEN with chat scopes.",
      );
    }
    const historyPayload = parseToolPayload(history);
    assert.ok(Array.isArray(historyPayload.messages), "chat history payload should include messages[]");
  } else {
    console.log("SKIP chat history call (AGENT_SESSION_ID not set)");
  }

  console.log(`PASS agent flow smoke (${MCP_URL})`);
}

await main();
