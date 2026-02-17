/**
 * API Response Helpers
 *
 * Typed helpers for consistent JSON responses across all routes.
 */

import type { Context } from "hono";

// ─── Error Responses ────────────────────────────────────

export const badRequest = (c: Context, message: string, hint?: string) =>
    c.json({ error: message, ...(hint && { hint }) }, 400);

export const unauthorized = (c: Context, message = "Authentication required") =>
    c.json({ error: message }, 401);

export const notFound = (c: Context, message: string) => c.json({ error: message }, 404);

export const serverError = (c: Context, message = "Internal server error") =>
    c.json({ error: message }, 500);

export const serviceUnavailable = (c: Context, message: string) => c.json({ error: message }, 503);

// ─── Success Responses ──────────────────────────────────

export const ok = <T>(c: Context, data: T) => c.json(data);
