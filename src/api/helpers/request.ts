/**
 * Request Validation Helpers
 *
 * Type-safe wrappers for OpenAPI validated request data.
 * Single suppression point for biome lint.
 */

import type { Context } from "hono";
import type { z, ZodSchema } from "zod";

type ValidTarget = "param" | "query" | "json";
type RequestWithValid = Context["req"] & {
    valid: (target: ValidTarget) => unknown;
};

function getValidated(c: Context, target: ValidTarget): unknown {
    return (c.req as RequestWithValid).valid(target);
}

/**
 * Get validated path parameters from request.
 */
export function getParams<T extends ZodSchema>(c: Context, _schema: T): z.infer<T> {
    return getValidated(c, "param") as z.infer<T>;
}

/**
 * Get validated query parameters from request.
 */
export function getQuery<T extends ZodSchema>(c: Context, _schema: T): z.infer<T> {
    return getValidated(c, "query") as z.infer<T>;
}

/**
 * Get validated JSON body from request.
 */
export function getBody<T extends ZodSchema>(c: Context, _schema: T): z.infer<T> {
    return getValidated(c, "json") as z.infer<T>;
}
