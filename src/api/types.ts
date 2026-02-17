/**
 * Shared API Types
 *
 * Common type helpers for OpenAPI route handlers.
 */

import type { RouteHandler } from "@hono/zod-openapi";

/**
 * Type helper to relax strict type checking for OpenAPI handlers.
 * Required due to @hono/zod-openapi type inference limitations.
 */
// biome-ignore lint/suspicious/noExplicitAny: OpenAPI handler type relaxation
export type AnyHandler = RouteHandler<any, any>;
