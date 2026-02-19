import assert from "node:assert/strict";

import { ApiError, AuthError, createSigilClient } from "@heysigil/sigil-sdk";

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function main() {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const parsed = new URL(url);
    const pathWithQuery = `${parsed.pathname}${parsed.search}`;
    calls.push({ url: parsed.toString(), pathWithQuery, init });

    if (pathWithQuery === "/api/launch/list?limit=2&q=sigil") {
      return jsonResponse(200, { items: [{ id: "project-1" }] });
    }
    if (pathWithQuery === "/api/mcp/token-info") {
      return jsonResponse(200, {
        authType: "mcp",
        userId: "user-1",
        scopes: ["launch:read"],
      });
    }
    if (pathWithQuery === "/api/verify/status/v1") {
      return jsonResponse(401, { error: "Unauthorized" });
    }
    if (pathWithQuery === "/api/launch") {
      return jsonResponse(500, { error: "internal error" });
    }
    return jsonResponse(200, { ok: true });
  };

  const client = createSigilClient({
    baseUrl: "https://api.example.com",
    tokenProvider: async () => "test-token",
    fetch: fetchImpl,
    timeoutMs: 5000,
  });

  const listResult = await client.launch.list({ limit: 2, q: "sigil" });
  assert.equal(listResult.items[0].id, "project-1");
  assert.match(calls[0].pathWithQuery, /\/api\/launch\/list\?limit=2&q=sigil$/);

  const firstHeaders = new Headers(calls[0].init.headers || {});
  assert.equal(firstHeaders.get("Authorization"), "Bearer test-token");

  const tokenInfo = await client.mcp.tokenInfo();
  assert.equal(tokenInfo.authType, "mcp");

  await assert.rejects(
    () => client.verify.status("v1"),
    (error) => error instanceof AuthError,
    "Expected AuthError for 401 responses",
  );

  await assert.rejects(
    () => client.launch.create({ devLinks: ["https://github.com/heysigil/heysigil"] }),
    (error) => error instanceof ApiError && error.status === 500,
    "Expected ApiError with status 500",
  );

  assert.equal(typeof client.dashboard.overview, "function");
  assert.equal(typeof client.chat.send, "function");
  assert.equal(typeof client.fees.totals, "function");

  console.log("PASS sdk smoke");
}

await main();
