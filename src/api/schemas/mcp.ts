import { z } from "@hono/zod-openapi";
import { MCP_SCOPES, type McpScope } from "../../mcp/scopes.js";
import { TimestampSchema, UUIDSchema } from "./common.js";

const McpScopeSchema = z
    .enum(MCP_SCOPES as unknown as [McpScope, ...McpScope[]])
    .openapi({ example: "dashboard:read" });

export const McpTokenSchema = z
    .object({
        id: UUIDSchema,
        name: z.string().openapi({ example: "Claude Desktop" }),
        tokenPrefix: z.string().openapi({ example: "sigil_pat_abc123ef" }),
        scopes: z.array(McpScopeSchema),
        expiresAt: TimestampSchema.nullable(),
        lastUsedAt: TimestampSchema.nullable(),
        revokedAt: TimestampSchema.nullable(),
        createdAt: TimestampSchema,
    })
    .openapi("McpToken");

export const CreateMcpTokenRequestSchema = z
    .object({
        name: z.string().min(1).max(128).optional().openapi({
            example: "Cursor MCP",
            description: "Friendly token label",
        }),
        scopes: z.array(McpScopeSchema).min(1).optional().openapi({
            description: "Requested MCP scopes",
        }),
        expiresInDays: z.coerce.number().int().min(1).max(365).optional().openapi({
            example: 30,
            description: "Token expiration in days",
        }),
    })
    .openapi("CreateMcpTokenRequest");

export const CreateMcpTokenResponseSchema = z
    .object({
        token: z.string().openapi({
            example: "sigil_pat_ab12cd34_very_secret_value",
            description: "Plaintext token (shown once)",
        }),
        tokenInfo: McpTokenSchema,
    })
    .openapi("CreateMcpTokenResponse");

export const ListMcpTokensResponseSchema = z
    .object({
        tokens: z.array(McpTokenSchema),
    })
    .openapi("ListMcpTokensResponse");

export const McpTokenIdParamSchema = z.object({
    id: UUIDSchema,
});

export const RotateMcpTokenRequestSchema = z
    .object({
        name: z.string().min(1).max(128).optional(),
        scopes: z.array(McpScopeSchema).min(1).optional(),
        expiresInDays: z.coerce.number().int().min(1).max(365).optional(),
    })
    .openapi("RotateMcpTokenRequest");

export const RevokeMcpTokenResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
    })
    .openapi("RevokeMcpTokenResponse");

export const McpTokenInfoResponseSchema = z
    .object({
        authType: z.enum(["privy", "mcp"]),
        userId: z.string(),
        scopes: z.array(McpScopeSchema),
    })
    .openapi("McpTokenInfoResponse");
