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
import { unauthorized, serviceUnavailable } from "../api/helpers/responses.js";
import { loggers } from "../utils/logger.js";
import { verifyMcpAccessToken } from "../services/mcp-token.js";

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

interface AuthIdentity {
    userId: string;
    authType: "privy" | "mcp";
    scopes?: string[];
    mcpTokenId?: string;
}

/**
 * Authenticate a bearer token as Privy JWT first, then MCP PAT fallback.
 */
async function authenticateBearerToken(token: string): Promise<AuthIdentity | null> {
    const privyIdentity = await verifyToken(token);
    if (privyIdentity) {
        return { userId: privyIdentity.userId, authType: "privy" };
    }

    const mcpIdentity = await verifyMcpAccessToken(token);
    if (mcpIdentity) {
        return {
            userId: mcpIdentity.userId,
            authType: "mcp",
            scopes: mcpIdentity.scopes,
            mcpTokenId: mcpIdentity.tokenId,
        };
    }

    return null;
}

/**
 * Strict auth middleware — rejects requests without valid Privy token.
 * SECURITY: Fails closed (503) when Privy is not configured.
 */
export function privyAuth() {
    return async (c: Context, next: Next) => {
        const client = getPrivyClient();

        const token = extractToken(c);
        if (!token) {
            return unauthorized(c);
        }

        const result = await authenticateBearerToken(token);
        if (!result) {
            if (!client) {
                loggers.auth.error("privyAuth() called but no auth providers are configured");
                return serviceUnavailable(c, "Authentication service unavailable");
            }
            return unauthorized(c, "Invalid or expired token");
        }

        c.set("userId", result.userId);
        c.set("authType", result.authType);
        if (result.scopes) c.set("authScopes", result.scopes);
        if (result.mcpTokenId) c.set("mcpTokenId", result.mcpTokenId);
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
            const result = await authenticateBearerToken(token);
            if (result) {
                c.set("userId", result.userId);
                c.set("authType", result.authType);
                if (result.scopes) c.set("authScopes", result.scopes);
                if (result.mcpTokenId) c.set("mcpTokenId", result.mcpTokenId);
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

/**
 * Get auth type for the current request.
 */
export function getAuthType(c: Context): "privy" | "mcp" | undefined {
    return c.get("authType");
}

/**
 * Get scopes attached to the authenticated MCP token.
 */
export function getAuthScopes(c: Context): string[] | undefined {
    return c.get("authScopes");
}

/**
 * Get a Privy user's linked GitHub username (if any).
 * Returns null if Privy is not configured or user has no GitHub linked.
 */
export async function getPrivyGithubUsername(userId: string): Promise<string | null> {
    const client = getPrivyClient();
    if (!client) return null;

    try {
        const user = await client.getUser(userId);
        // Privy user object has a `github` field with `username` when linked
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const github = (user as any).github;
        return github?.username ?? null;
    } catch (err) {
        loggers.auth.warn({ userId, error: err }, "Failed to fetch Privy user for GitHub lookup");
        return null;
    }
}

/**
 * Get a Privy user's embedded wallet address (if any).
 * This is the wallet that Privy creates for the user, NOT our custodial wallet.
 */
export async function getPrivyWalletAddress(userId: string): Promise<string | null> {
    const client = getPrivyClient();
    if (!client) return null;

    try {
        const user = await client.getUser(userId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const wallet = (user as any).wallet;
        return wallet?.address ?? null;
    } catch (err) {
        loggers.auth.warn({ userId, error: err }, "Failed to fetch Privy user wallet");
        return null;
    }
}
