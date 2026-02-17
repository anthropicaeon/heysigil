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
    return fallback;
}

/**
 * Format error for API response.
 */
export function toApiError(err: unknown, fallback = "An error occurred"): { error: string } {
    return { error: getErrorMessage(err, fallback) };
}
