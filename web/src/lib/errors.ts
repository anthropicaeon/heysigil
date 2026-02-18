/**
 * Error Utilities
 *
 * Common error handling patterns.
 */

/**
 * Extract error message from unknown error.
 */
export function getErrorMessage(err: unknown, fallback = "Unknown error"): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
        // Handle plain objects with message or error properties
        const obj = err as Record<string, unknown>;
        if (typeof obj.message === "string") return obj.message;
        if (typeof obj.error === "string") return obj.error;
    }
    return fallback;
}
