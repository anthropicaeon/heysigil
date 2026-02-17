/**
 * Rate Limiting Middleware for Hono
 *
 * Implements sliding window rate limiting with configurable limits per endpoint.
 * Supports both in-memory (single instance) and Redis (multi-instance) backends.
 *
 * Backend selection:
 * - Set REDIS_URL env var for distributed rate limiting
 * - Falls back to in-memory when Redis is not configured
 *
 * Proxy trust configuration (TRUST_PROXY env var):
 * - "cloudflare": Only trust cf-connecting-ip header
 * - "true": Trust x-forwarded-for, x-real-ip, cf-connecting-ip (legacy default)
 * - "false": Never trust headers, use fallback IP only
 * - "" (not set): Trust headers but warn in production about security risk
 */

import type { Context, Next } from "hono";
import { getRateLimitStore, type RateLimitStore } from "./rate-limit-store.js";
import { getEnv, isProduction } from "../config/env.js";
import { loggers } from "../utils/logger.js";

// Track if we've warned about missing TRUST_PROXY config
let _hasWarnedAboutTrustProxy = false;

interface RateLimitConfig {
    /** Maximum requests allowed in the window */
    limit: number;
    /** Window duration in milliseconds */
    windowMs: number;
    /** Key generator function (defaults to IP-based) */
    keyGenerator?: (c: Context) => string;
    /** Custom message when rate limited */
    message?: string;
    /** Skip rate limiting for certain requests */
    skip?: (c: Context) => boolean;
}

/**
 * Extract client IP from request headers (handles proxies).
 * Respects TRUST_PROXY env configuration to prevent header spoofing.
 */
function getClientIp(c: Context): string {
    const env = getEnv();
    const trustProxy = env.TRUST_PROXY;

    // Warn once in production if TRUST_PROXY is not explicitly configured
    if (isProduction() && !trustProxy && !_hasWarnedAboutTrustProxy) {
        loggers.rateLimit.warn(
            "[rate-limit] WARNING: TRUST_PROXY not set in production. " +
                "Proxy headers are trusted by default, which allows rate limit bypass. " +
                'Set TRUST_PROXY="cloudflare", "true", or "false" to suppress this warning.',
        );
        _hasWarnedAboutTrustProxy = true;
    }

    // If trust is explicitly disabled, return fallback immediately
    if (trustProxy === "false") {
        return "unknown";
    }

    // Cloudflare-only mode: only trust cf-connecting-ip
    if (trustProxy === "cloudflare") {
        const cfIp = c.req.header("cf-connecting-ip");
        return cfIp || "unknown";
    }

    // Trust all headers (legacy behavior, or explicit "true")
    // Order: x-forwarded-for, x-real-ip, cf-connecting-ip
    const forwarded = c.req.header("x-forwarded-for");
    if (forwarded) {
        // x-forwarded-for can contain multiple IPs, take the first (client)
        return forwarded.split(",")[0].trim();
    }

    const realIp = c.req.header("x-real-ip");
    if (realIp) {
        return realIp;
    }

    const cfIp = c.req.header("cf-connecting-ip");
    if (cfIp) {
        return cfIp;
    }

    return "unknown";
}

/**
 * Create a rate limiting middleware with the given configuration.
 */
export function rateLimit(prefix: string, config: RateLimitConfig) {
    const {
        limit,
        windowMs,
        keyGenerator = (c) => getClientIp(c),
        message = "Too many requests, please try again later",
        skip,
    } = config;

    // Get store lazily to allow configuration at startup
    let store: RateLimitStore | null = null;

    return async (c: Context, next: Next) => {
        // Skip if configured
        if (skip?.(c)) {
            await next();
            return;
        }

        // Lazy init store
        if (!store) {
            store = getRateLimitStore();
        }

        const identifier = keyGenerator(c);
        const key = `${prefix}:${identifier}`;
        const now = Date.now();

        const entry = await store.increment(key, windowMs);

        // Set rate limit headers
        const remaining = Math.max(0, limit - entry.count);
        const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

        c.header("X-RateLimit-Limit", String(limit));
        c.header("X-RateLimit-Remaining", String(remaining));
        c.header("X-RateLimit-Reset", String(resetSeconds));

        // Check if over limit
        if (entry.count > limit) {
            c.header("Retry-After", String(resetSeconds));
            return c.json(
                {
                    error: message,
                    retryAfter: resetSeconds,
                },
                429,
            );
        }

        await next();
    };
}

// ---------- Pre-configured rate limiters for common use cases ----------

/**
 * Global rate limit: 100 requests per minute per IP
 * Baseline protection against aggressive clients
 */
export function globalRateLimit() {
    return rateLimit("global", {
        limit: 100,
        windowMs: 60 * 1000, // 1 minute
        message: "Too many requests. Please slow down.",
    });
}

/**
 * Chat rate limit: 20 requests per minute per IP
 * LLM calls are expensive - prevent abuse
 */
export function chatRateLimit() {
    return rateLimit("chat", {
        limit: 20,
        windowMs: 60 * 1000, // 1 minute
        message: "Chat rate limit exceeded. Please wait before sending more messages.",
    });
}

/**
 * Wallet creation rate limit: 5 per hour per IP
 * Very strict - creating wallets is a sensitive operation
 */
export function walletCreateRateLimit() {
    return rateLimit("wallet-create", {
        limit: 5,
        windowMs: 60 * 60 * 1000, // 1 hour
        message: "Wallet creation limit exceeded. Please try again later.",
    });
}

/**
 * Verification challenge rate limit: 10 per hour per IP
 * Prevent challenge spam that could bloat the database
 */
export function verifyChallengeRateLimit() {
    return rateLimit("verify-challenge", {
        limit: 10,
        windowMs: 60 * 60 * 1000, // 1 hour
        message: "Too many verification requests. Please try again later.",
    });
}

/**
 * Verification check rate limit: 30 per minute per IP
 * Allow reasonable retries for DNS propagation, etc.
 */
export function verifyCheckRateLimit() {
    return rateLimit("verify-check", {
        limit: 30,
        windowMs: 60 * 1000, // 1 minute
        message: "Too many verification check attempts. Please wait.",
    });
}

/**
 * OAuth callback rate limit: 20 per minute per IP
 * Normal OAuth flow shouldn't hit this, but prevents abuse
 */
export function oauthCallbackRateLimit() {
    return rateLimit("oauth-callback", {
        limit: 20,
        windowMs: 60 * 1000, // 1 minute
        message: "Too many OAuth attempts. Please try again later.",
    });
}

/**
 * Strict rate limit for session ID enumeration protection: 10 per minute per IP
 * Prevents brute-forcing session IDs
 */
export function sessionEnumerationRateLimit() {
    return rateLimit("session-enum", {
        limit: 10,
        windowMs: 60 * 1000, // 1 minute
        message: "Too many session lookups. Please slow down.",
    });
}

/**
 * Verification status lookup rate limit: 30 per minute per IP
 * Protects against enumeration attacks on verification IDs
 * Allows reasonable polling for OAuth callback status
 */
export function verifyStatusRateLimit() {
    return rateLimit("verify-status", {
        limit: 30,
        windowMs: 60 * 1000, // 1 minute
        message: "Too many status lookups. Please slow down.",
    });
}

/**
 * User-based rate limiter factory (for authenticated endpoints)
 * Uses userId from context instead of IP
 */
export function userRateLimit(prefix: string, config: Omit<RateLimitConfig, "keyGenerator">) {
    return rateLimit(`user:${prefix}`, {
        ...config,
        keyGenerator: (c) => {
            const userId = c.get("userId");
            // Fall back to IP if not authenticated
            return userId || getClientIp(c);
        },
    });
}

// ---------- Programmatic API for service-level rate limiting ----------

interface ServiceRateLimitConfig {
    /** Maximum requests allowed in the window */
    limit: number;
    /** Window duration in milliseconds */
    windowMs: number;
}

interface RateLimitCheckResult {
    allowed: boolean;
    remaining: number;
    resetInMs: number;
    resetInMinutes: number;
}

/**
 * Check rate limit programmatically (for use in services, not middleware).
 * Increments the counter and returns whether the request is allowed.
 *
 * @param prefix - Rate limit bucket prefix
 * @param identifier - Unique identifier (sessionId, userId, etc.)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed and remaining quota
 *
 * @example
 * const result = await checkServiceRateLimit("deploy", sessionId, { limit: 3, windowMs: 3600000 });
 * if (!result.allowed) {
 *   throw new Error(`Rate limit exceeded. Try again in ${result.resetInMinutes} minutes.`);
 * }
 */
export async function checkServiceRateLimit(
    prefix: string,
    identifier: string,
    config: ServiceRateLimitConfig,
): Promise<RateLimitCheckResult> {
    const { limit, windowMs } = config;
    const key = `${prefix}:${identifier}`;
    const now = Date.now();

    const store = getRateLimitStore();
    const entry = await store.increment(key, windowMs);

    const resetInMs = Math.max(0, entry.resetAt - now);

    return {
        allowed: entry.count <= limit,
        remaining: Math.max(0, limit - entry.count),
        resetInMs,
        resetInMinutes: Math.ceil(resetInMs / 60000),
    };
}

// ---------- Pre-configured service rate limits ----------

/** Token deployment: 3 per hour per session */
export const DEPLOY_RATE_LIMIT = { limit: 3, windowMs: 60 * 60 * 1000 };

/**
 * Check token deployment rate limit.
 * @throws Error if rate limit exceeded
 */
export async function checkDeployRateLimit(sessionId: string): Promise<void> {
    const result = await checkServiceRateLimit("deploy", sessionId, DEPLOY_RATE_LIMIT);
    if (!result.allowed) {
        throw new Error(
            `Rate limit: max ${DEPLOY_RATE_LIMIT.limit} launches per hour. ` +
                `Try again in ${result.resetInMinutes} minutes.`,
        );
    }
}
