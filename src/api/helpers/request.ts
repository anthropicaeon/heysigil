/**
 * Request Validation Helpers
 *
 * Type-safe wrappers for OpenAPI validated request data.
 * Runtime validation using Zod schemas for defense-in-depth.
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
 * Performs runtime validation via schema.parse() for defense-in-depth.
 */
export function getParams<T extends ZodSchema>(c: Context, schema: T): z.infer<T> {
    return schema.parse(getValidated(c, "param"));
}

/**
 * Get validated query parameters from request.
 * Performs runtime validation via schema.parse() for defense-in-depth.
 */
export function getQuery<T extends ZodSchema>(c: Context, schema: T): z.infer<T> {
    return schema.parse(getValidated(c, "query"));
}

/**
 * Get validated JSON body from request.
 * Performs runtime validation via schema.parse() for defense-in-depth.
 */
export function getBody<T extends ZodSchema>(c: Context, schema: T): z.infer<T> {
    return schema.parse(getValidated(c, "json"));
}
