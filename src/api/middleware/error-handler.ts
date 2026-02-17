/**
 * API Error Handler Middleware
 *
 * Wrapper for route handlers that provides consistent error handling.
 */

import type { Context } from "hono";
import { getErrorMessage } from "../../utils/errors.js";

type AnyHandler = (c: Context) => Promise<Response> | Response;

/**
 * Wrap a route handler with try-catch error handling.
 * Returns 500 with consistent error response on failure.
 *
 * @example
 * app.openapi(myRoute, withErrorHandling("Failed to process request", async (c) => {
 *   // handler logic
 *   return c.json({ data });
 * }));
 */
export function withErrorHandling(
    fallbackMessage: string,
    handler: (c: Context) => Promise<Response>,
): AnyHandler {
    return async (c: Context) => {
        try {
            return await handler(c);
        } catch (err) {
            return c.json({ error: getErrorMessage(err, fallbackMessage) }, 500);
        }
    };
}
