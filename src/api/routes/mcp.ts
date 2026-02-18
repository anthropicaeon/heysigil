import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getParams } from "../helpers/request.js";
import {
    getAuthScopes,
    getAuthType,
    getUserId,
    privyAuth,
} from "../../middleware/auth.js";
import {
    createMcpToken,
    findMcpTokenById,
    listMcpTokens,
    revokeMcpToken,
} from "../../services/mcp-token.js";
import { MCP_SCOPES } from "../../mcp/scopes.js";
import {
    ErrorResponseSchema,
    NotFoundResponseSchema,
    RateLimitResponseSchema,
} from "../schemas/common.js";
import {
    CreateMcpTokenRequestSchema,
    CreateMcpTokenResponseSchema,
    ListMcpTokensResponseSchema,
    McpTokenIdParamSchema,
    McpTokenInfoResponseSchema,
    RevokeMcpTokenResponseSchema,
    RotateMcpTokenRequestSchema,
} from "../schemas/mcp.js";
import { handler } from "../helpers/route.js";
import { rateLimit } from "../../middleware/rate-limit.js";

const mcp = new OpenAPIHono();

mcp.use(
    "/tokens",
    rateLimit("mcp-token-management", {
        limit: 20,
        windowMs: 60 * 60 * 1000,
        message: "Too many MCP token management requests. Please try again later.",
    }),
);

function ensurePrivyJwt(c: Parameters<typeof getUserId>[0]) {
    if (getAuthType(c) !== "privy") {
        return c.json({ error: "Privy authentication required for token management" }, 401);
    }
    return null;
}

async function enforceAuth(c: Parameters<typeof getUserId>[0]) {
    const authResult = await privyAuth()(c, async () => {});
    if (authResult) return authResult;
    return null;
}

const getTokenInfoRoute = createRoute({
    method: "get",
    path: "/token-info",
    tags: ["MCP"],
    summary: "Get bearer token auth context",
    description: "Returns resolved auth type and scopes for the provided bearer token.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            content: {
                "application/json": { schema: McpTokenInfoResponseSchema },
            },
            description: "Token auth context",
        },
        401: {
            content: {
                "application/json": { schema: ErrorResponseSchema },
            },
            description: "Authentication required",
        },
    },
});

mcp.openapi(
    getTokenInfoRoute,
    handler(async (c) => {
        const authResult = await enforceAuth(c);
        if (authResult) return authResult;

        const userId = getUserId(c);
        if (!userId) return c.json({ error: "Authentication required" }, 401);

        const authType = getAuthType(c);
        const scopes = authType === "mcp" ? getAuthScopes(c) || [] : [...MCP_SCOPES];

        return c.json({
            authType: authType || "privy",
            userId,
            scopes,
        });
    }),
);

const createTokenRoute = createRoute({
    method: "post",
    path: "/tokens",
    tags: ["MCP"],
    summary: "Create MCP personal access token",
    description: "Create a scoped MCP token for the authenticated user.",
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: {
                "application/json": { schema: CreateMcpTokenRequestSchema },
            },
            required: false,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": { schema: CreateMcpTokenResponseSchema },
            },
            description: "Token created successfully",
        },
        401: {
            content: {
                "application/json": { schema: ErrorResponseSchema },
            },
            description: "Authentication required",
        },
        429: {
            content: {
                "application/json": { schema: RateLimitResponseSchema },
            },
            description: "Rate limit exceeded",
        },
    },
});

mcp.openapi(
    createTokenRoute,
    handler(async (c) => {
        const authResult = await enforceAuth(c);
        if (authResult) return authResult;

        const privyOnlyError = ensurePrivyJwt(c);
        if (privyOnlyError) return privyOnlyError;

        const userId = getUserId(c);
        if (!userId) return c.json({ error: "Authentication required" }, 401);

        const rawBody = (c.req as { valid: (target: "json") => unknown }).valid("json");
        const body = CreateMcpTokenRequestSchema.parse(rawBody ?? {});
        const created = await createMcpToken({
            userId,
            name: body.name,
            scopes: body.scopes,
            expiresInDays: body.expiresInDays,
        });

        return c.json({
            token: created.token,
            tokenInfo: created.metadata,
        });
    }),
);

const listTokensRoute = createRoute({
    method: "get",
    path: "/tokens",
    tags: ["MCP"],
    summary: "List MCP tokens",
    description: "List all MCP tokens owned by the authenticated user.",
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            content: {
                "application/json": { schema: ListMcpTokensResponseSchema },
            },
            description: "User MCP tokens",
        },
        401: {
            content: {
                "application/json": { schema: ErrorResponseSchema },
            },
            description: "Authentication required",
        },
    },
});

mcp.openapi(
    listTokensRoute,
    handler(async (c) => {
        const authResult = await enforceAuth(c);
        if (authResult) return authResult;

        const privyOnlyError = ensurePrivyJwt(c);
        if (privyOnlyError) return privyOnlyError;

        const userId = getUserId(c);
        if (!userId) return c.json({ error: "Authentication required" }, 401);

        const tokens = await listMcpTokens(userId);
        return c.json({ tokens });
    }),
);

const revokeTokenRoute = createRoute({
    method: "delete",
    path: "/tokens/{id}",
    tags: ["MCP"],
    summary: "Revoke MCP token",
    description: "Revoke an MCP token owned by the authenticated user.",
    security: [{ bearerAuth: [] }],
    request: {
        params: McpTokenIdParamSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": { schema: RevokeMcpTokenResponseSchema },
            },
            description: "Token revoked",
        },
        404: {
            content: {
                "application/json": { schema: NotFoundResponseSchema },
            },
            description: "Token not found",
        },
    },
});

mcp.openapi(
    revokeTokenRoute,
    handler(async (c) => {
        const authResult = await enforceAuth(c);
        if (authResult) return authResult;

        const privyOnlyError = ensurePrivyJwt(c);
        if (privyOnlyError) return privyOnlyError;

        const userId = getUserId(c);
        if (!userId) return c.json({ error: "Authentication required" }, 401);

        const { id } = getParams(c, McpTokenIdParamSchema);
        const revoked = await revokeMcpToken(userId, id);
        if (!revoked) return c.json({ error: "Token not found" }, 404);

        return c.json({ success: true });
    }),
);

const rotateTokenRoute = createRoute({
    method: "post",
    path: "/tokens/{id}/rotate",
    tags: ["MCP"],
    summary: "Rotate MCP token",
    description: "Revoke an existing token and issue a replacement.",
    security: [{ bearerAuth: [] }],
    request: {
        params: McpTokenIdParamSchema,
        body: {
            content: {
                "application/json": { schema: RotateMcpTokenRequestSchema },
            },
            required: false,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": { schema: CreateMcpTokenResponseSchema },
            },
            description: "Replacement token created",
        },
        404: {
            content: {
                "application/json": { schema: NotFoundResponseSchema },
            },
            description: "Token not found",
        },
    },
});

mcp.openapi(
    rotateTokenRoute,
    handler(async (c) => {
        const authResult = await enforceAuth(c);
        if (authResult) return authResult;

        const privyOnlyError = ensurePrivyJwt(c);
        if (privyOnlyError) return privyOnlyError;

        const userId = getUserId(c);
        if (!userId) return c.json({ error: "Authentication required" }, 401);

        const { id } = getParams(c, McpTokenIdParamSchema);
        const rawBody = (c.req as { valid: (target: "json") => unknown }).valid("json");
        const body = RotateMcpTokenRequestSchema.parse(rawBody ?? {});

        const existing = await findMcpTokenById(userId, id);
        if (!existing) return c.json({ error: "Token not found" }, 404);

        await revokeMcpToken(userId, id);

        const replacement = await createMcpToken({
            userId,
            name: body.name || existing.name,
            scopes: body.scopes || existing.scopes,
            expiresInDays: body.expiresInDays,
        });

        return c.json({
            token: replacement.token,
            tokenInfo: replacement.metadata,
        });
    }),
);

export { mcp };
