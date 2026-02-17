/**
 * Verification Result Builder
 *
 * Utility functions for constructing consistent VerificationResult objects.
 */

import type { VerificationResult, VerificationMethod } from "./types.js";

/**
 * Build a successful verification result.
 */
export function buildSuccess(
    method: VerificationMethod,
    projectId: string,
    username?: string,
    proof?: Record<string, unknown>,
): VerificationResult {
    return {
        success: true,
        method,
        projectId,
        ...(username && { username }),
        ...(proof && { proof }),
    };
}

/**
 * Build a failed verification result.
 */
export function buildFailure(
    method: VerificationMethod,
    projectId: string,
    error: string,
    proof?: Record<string, unknown>,
): VerificationResult {
    return {
        success: false,
        method,
        projectId,
        error,
        ...(proof && { proof }),
    };
}
