/**
 * OpenAPI Configuration
 *
 * Central configuration for OpenAPI spec generation and Swagger UI.
 * Uses @hono/zod-openapi for code-first API documentation.
 */

/**
 * OpenAPI metadata for the Sigil API
 */
export const openApiInfo = {
    openapi: "3.1.0",
    info: {
        title: "Sigil API",
        version: "1.0.0",
        description: `
Sigil is a developer identity verification and token launch platform.

## Features
- **Verification**: Verify ownership of GitHub repos, domains, social accounts
- **Token Launch**: Deploy tokens with automatic fee distribution to verified developers
- **Fee Transparency**: Public audit trail of all fee distributions

## Authentication
Most endpoints are public. Endpoints marked with a lock icon require a Privy JWT token.

\`\`\`
Authorization: Bearer <privy-jwt-token>
\`\`\`

## Rate Limits
All endpoints are rate-limited. Rate limit headers are included in responses:
- \`X-RateLimit-Limit\`: Maximum requests per window
- \`X-RateLimit-Remaining\`: Remaining requests in current window
- \`X-RateLimit-Reset\`: Unix timestamp when window resets
        `.trim(),
        contact: {
            name: "Sigil Support",
            url: "https://github.com/anthropicaeon/heysigil",
        },
        license: {
            name: "MIT",
            url: "https://opensource.org/licenses/MIT",
        },
    },
    servers: [] as Array<{ url: string; description: string }>,
    tags: [
        { name: "Health", description: "Service health checks" },
        { name: "Chat", description: "AI agent chat sessions" },
        { name: "Verify", description: "Developer identity verification" },
        { name: "Claim", description: "EAS attestation claiming" },
        { name: "Launch", description: "Token deployment" },
        { name: "Wallet", description: "Custodial wallet management" },
        { name: "Fees", description: "Fee distribution audit trail" },
        { name: "MCP", description: "MCP token management and auth context" },
        { name: "Methods", description: "Available verification methods" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http" as const,
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Privy JWT or Sigil MCP personal access token",
            },
        },
    },
    "x-rate-limit": {
        global: {
            limit: 100,
            windowMs: 60000,
            description: "100 requests per minute per IP (global)",
        },
    },
};

/**
 * Security requirement for authenticated endpoints
 */
export const securityRequired = [{ bearerAuth: [] }];

// ─── Response Builders ─────────────────────────────────

import type { ZodSchema } from "zod";
import { ErrorResponseSchema, RateLimitResponseSchema } from "./schemas/common.js";

/**
 * Build a JSON response definition for OpenAPI route.
 */
export function jsonResponse<T extends ZodSchema>(schema: T, description: string) {
    return {
        content: { "application/json": { schema } },
        description,
    };
}

/**
 * Standard error response (400).
 */
export const errorResponse = (description = "Bad request") =>
    jsonResponse(ErrorResponseSchema, description);

/**
 * Standard rate limit response (429).
 */
export const rateLimitResponse = (description = "Rate limit exceeded") =>
    jsonResponse(RateLimitResponseSchema, description);
