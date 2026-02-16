/**
 * Privy Auth Middleware for Hono
 *
 * Verifies Privy JWT access tokens and attaches userId to context.
 * Works in two modes:
 *   - privyAuth()         — strict: rejects unauthenticated requests
 *   - privyAuthOptional() — soft: attaches userId if present, continues otherwise
 */

import { PrivyClient } from "@privy-io/server-auth";
import type { Context, Next } from "hono";
import { getEnv } from "../config/env.js";

let _client: PrivyClient | null = null;

function getPrivyClient(): PrivyClient | null {
    if (_client) return _client;

    const env = getEnv();
    const appId = env.PRIVY_APP_ID;
    const appSecret = env.PRIVY_APP_SECRET;

    if (!appId || !appSecret) {
        return null;
    }

    _client = new PrivyClient(appId, appSecret);
    return _client;
}

/**
 * Extract Bearer token from Authorization header.
 */
function extractToken(c: Context): string | null {
    const auth = c.req.header("Authorization");
    if (!auth?.startsWith("Bearer ")) return null;
    return auth.slice(7);
}

/**
 * Verify a Privy access token and return the user's DID.
 */
async function verifyToken(token: string): Promise<{ userId: string } | null> {
    const client = getPrivyClient();
    if (!client) return null;

    try {
        const { userId } = await client.verifyAuthToken(token);
        return { userId };
    } catch {
        return null;
    }
}

/**
 * Strict auth middleware — rejects requests without valid Privy token.
 * SECURITY: Fails closed (503) when Privy is not configured.
 */
export function privyAuth() {
    return async (c: Context, next: Next) => {
        const client = getPrivyClient();

        // SECURITY: Fail closed when Privy isn't configured
        // Never pass through - this could expose protected endpoints in production
        if (!client) {
            console.error("[AUTH] privyAuth() called but Privy not configured");
            return c.json({
                error: "Authentication service unavailable",
                hint: "PRIVY_APP_ID and PRIVY_APP_SECRET must be configured"
            }, 503);
        }

        const token = extractToken(c);
        if (!token) {
            return c.json({ error: "Authentication required" }, 401);
        }

        const result = await verifyToken(token);
        if (!result) {
            return c.json({ error: "Invalid or expired token" }, 401);
        }

        // Attach userId to context for downstream handlers
        c.set("userId", result.userId);
        await next();
    };
}

/**
 * Optional auth middleware — attaches userId if present, continues regardless.
 * Useful for routes that work for both authenticated and anonymous users.
 */
export function privyAuthOptional() {
    return async (c: Context, next: Next) => {
        const token = extractToken(c);

        if (token) {
            const result = await verifyToken(token);
            if (result) {
                c.set("userId", result.userId);
            }
        }

        await next();
    };
}

/**
 * Get the Privy user ID from context (set by middleware).
 */
export function getUserId(c: Context): string | undefined {
    return c.get("userId");
}
