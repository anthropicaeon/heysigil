import { Hono } from "hono";
import { getAuthScopes, getAuthType, privyAuth } from "../../middleware/auth.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import { getRequestLogger } from "../../middleware/request-logger.js";
import { createRequestScopedMcpServer } from "../../mcp/runtime.js";
import type { JsonRpcRequest } from "@heysigil/sigil-mcp";

const MAX_MCP_BODY_BYTES = 512 * 1024;

function extractBearerToken(authorizationHeader: string | undefined): string | null {
    if (!authorizationHeader?.startsWith("Bearer ")) return null;
    const token = authorizationHeader.slice(7).trim();
    return token.length > 0 ? token : null;
}

const mcpTransport = new Hono();

mcpTransport.use(
    "*",
    rateLimit("mcp-rpc", {
        limit: 120,
        windowMs: 60 * 1000,
        message: "MCP rate limit exceeded. Please retry in a minute.",
    }),
);

mcpTransport.get("/health", (c) => {
    return c.json({ ok: true, transport: "mcp-http" });
});

mcpTransport.post("/", privyAuth(), async (c) => {
    const log = getRequestLogger(c);
    const authType = getAuthType(c);
    if (authType !== "mcp") {
        return c.json({ error: "MCP bearer token required" }, 401);
    }

    const contentType = c.req.header("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
        return c.json({ error: "Expected application/json content type" }, 415);
    }

    const contentLengthHeader = c.req.header("content-length");
    if (contentLengthHeader) {
        const declaredLength = Number.parseInt(contentLengthHeader, 10);
        if (Number.isFinite(declaredLength) && declaredLength > MAX_MCP_BODY_BYTES) {
            return c.json({ error: "Payload too large" }, 413);
        }
    }

    const rawBody = await c.req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_MCP_BODY_BYTES) {
        return c.json({ error: "Payload too large" }, 413);
    }

    let rpcRequest: JsonRpcRequest;
    try {
        rpcRequest = JSON.parse(rawBody) as JsonRpcRequest;
    } catch {
        return c.json(
            {
                jsonrpc: "2.0",
                id: null,
                error: {
                    code: -32700,
                    message: "Invalid JSON payload",
                },
            },
            400,
        );
    }

    if (rpcRequest?.jsonrpc !== "2.0" || typeof rpcRequest.method !== "string") {
        return c.json(
            {
                jsonrpc: "2.0",
                id: rpcRequest?.id ?? null,
                error: {
                    code: -32600,
                    message: "Invalid JSON-RPC request",
                },
            },
            400,
        );
    }

    const token = extractBearerToken(c.req.header("authorization"));
    if (!token) {
        return c.json({ error: "MCP bearer token required" }, 401);
    }

    const allowedScopes = getAuthScopes(c) || [];
    const server = createRequestScopedMcpServer(token, allowedScopes);

    log.info(
        {
            mcp: {
                method: rpcRequest.method,
                hasParams: Boolean(rpcRequest.params),
            },
        },
        "MCP request",
    );

    const response = await server.handleRequest(rpcRequest);
    if (!response) {
        return c.body(null, 204);
    }

    return c.json(response);
});

export { mcpTransport };
