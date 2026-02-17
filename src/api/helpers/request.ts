/**
 * Request Validation Helpers
 *
 * Type-safe wrappers for OpenAPI validated request data.
 * Single suppression point for biome lint.
 */

import type { Context } from "hono";
import type { z, ZodSchema } from "zod";

/**
 * Get validated path parameters from request.
 */
// biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
export function getParams<T extends ZodSchema>(c: Context, _schema: T): z.infer<T> {
    return (c.req as any).valid("param");
}

/**
 * Get validated query parameters from request.
 */
// biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
export function getQuery<T extends ZodSchema>(c: Context, _schema: T): z.infer<T> {
    return (c.req as any).valid("query");
}

/**
 * Get validated JSON body from request.
 */
// biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
export function getBody<T extends ZodSchema>(c: Context, _schema: T): z.infer<T> {
    return (c.req as any).valid("json");
}
