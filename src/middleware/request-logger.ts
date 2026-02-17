/**
 * Request Logging Middleware
 *
 * Adds correlation IDs to all requests and logs request/response details.
 * Correlation IDs are passed in the X-Correlation-ID header or generated.
 */

import type { Context, MiddlewareHandler } from "hono";
import { createRequestLogger } from "../utils/logger.js";
import type { Logger } from "pino";

const CORRELATION_HEADER = "x-correlation-id";

/**
 * Generate a unique correlation ID
 */
function generateCorrelationId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${timestamp}-${random}`;
}

/**
 * Get or create correlation ID from request
 */
export function getCorrelationId(c: Context): string {
    // Check if we already have one in context
    const existing = c.get("correlationId") as string | undefined;
    if (existing) return existing;

    // Check header
    const fromHeader = c.req.header(CORRELATION_HEADER);
    if (fromHeader) return fromHeader;

    // Generate new
    return generateCorrelationId();
}

/**
 * Get the request logger from context
 */
export function getRequestLogger(c: Context): Logger {
    const logger = c.get("logger") as Logger | undefined;
    if (logger) return logger;

    // Fallback: create a new one (shouldn't happen if middleware is applied)
    return createRequestLogger(getCorrelationId(c));
}

/**
 * Request logging middleware
 *
 * Adds:
 * - Correlation ID to context and response header
 * - Request logger to context
 * - Request/response logging
 */
export function requestLogger(): MiddlewareHandler {
    return async (c, next) => {
        const correlationId = getCorrelationId(c);
        const logger = createRequestLogger(correlationId);

        // Store in context
        c.set("correlationId", correlationId);
        c.set("logger", logger);

        // Add to response header for client-side debugging
        c.header(CORRELATION_HEADER, correlationId);

        const start = Date.now();
        const method = c.req.method;
        const path = c.req.path;

        // Log request (skip for health checks)
        const isHealthCheck = path === "/health" || path === "/ready";
        if (!isHealthCheck) {
            logger.info(
                {
                    type: "request",
                    method,
                    path,
                    query: c.req.query(),
                    userAgent: c.req.header("user-agent"),
                    ip: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
                },
                `→ ${method} ${path}`,
            );
        }

        try {
            await next();
        } catch (err) {
            const duration = Date.now() - start;
            logger.error(
                {
                    type: "response",
                    method,
                    path,
                    status: 500,
                    duration,
                    error: err instanceof Error ? err.message : String(err),
                },
                `✗ ${method} ${path} 500 (${duration}ms)`,
            );
            throw err;
        }

        const duration = Date.now() - start;
        const status = c.res.status;

        // Log response (skip for health checks)
        if (!isHealthCheck) {
            const logLevel = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
            const icon = status >= 400 ? "✗" : "←";

            logger[logLevel](
                {
                    type: "response",
                    method,
                    path,
                    status,
                    duration,
                },
                `${icon} ${method} ${path} ${status} (${duration}ms)`,
            );
        }
    };
}

// Type declaration for Hono context
declare module "hono" {
    interface ContextVariableMap {
        correlationId: string;
        logger: Logger;
    }
}
