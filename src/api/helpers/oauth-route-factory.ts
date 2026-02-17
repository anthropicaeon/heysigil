/**
 * OAuth Route Factory
 *
 * Factory function to generate OAuth callback route definitions.
 * Eliminates duplication across GitHub, Facebook, Instagram callbacks.
 */

import { createRoute, type OpenAPIHono } from "@hono/zod-openapi";
import { OAuthCallbackQuerySchema, RateLimitResponseSchema } from "../schemas/verify.js";
import { getQuery } from "./request.js";
import { handleOAuthCallback, type OAuthCallbackConfig } from "./oauth-callback.js";
import { handler } from "./route.js";

export interface OAuthRouteConfig extends OAuthCallbackConfig {
    /** Capitalized platform name for docs (GitHub, Facebook, Instagram) */
    displayName: string;
}

/**
 * Create and register an OAuth callback route.
 */
export function registerOAuthCallbackRoute(app: OpenAPIHono, config: OAuthRouteConfig): void {
    const route = createRoute({
        method: "get",
        path: `/${config.platform}/callback`,
        tags: ["Verify"],
        summary: `${config.displayName} OAuth callback`,
        description: `OAuth callback endpoint for ${config.displayName} verification. Redirects to frontend with status.`,
        request: {
            query: OAuthCallbackQuerySchema,
        },
        responses: {
            302: {
                description: "Redirect to frontend with verification status",
                headers: {
                    Location: {
                        schema: { type: "string" },
                        description: "Frontend URL with status parameters",
                    },
                },
            },
            429: {
                content: {
                    "application/json": {
                        schema: RateLimitResponseSchema,
                    },
                },
                description: "Rate limit exceeded (20 requests per minute)",
            },
        },
    });

    app.openapi(
        route,
        handler(async (c) => {
            const { code, state } = getQuery(c, OAuthCallbackQuerySchema);
            return handleOAuthCallback(c, code, state, config);
        }),
    );
}
