/**
 * Route Handler Wrapper
 *
 * Type-safe wrapper to eliminate repetitive `as AnyHandler` type assertions
 * in OpenAPI route handlers.
 */

import type { Context } from "hono";
import type { AnyHandler } from "../types.js";

/**
 * Wrap an async route handler to satisfy OpenAPI typing.
 * Eliminates the need for `as AnyHandler` casts at each route.
 */
export function handler(fn: (c: Context) => Promise<Response>): AnyHandler {
    return fn as AnyHandler;
}
