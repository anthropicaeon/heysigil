/**
 * Verification Result Builder
 *
 * Utility functions for constructing consistent VerificationResult objects.
 * Returns discriminated union types for proper TypeScript narrowing.
 */

import type { VerificationSuccess, VerificationFailure, VerificationMethod } from "./types.js";

/**
 * Build a successful verification result.
 */
export function buildSuccess(
    method: VerificationMethod,
    projectId: string,
    platformUsername?: string,
    proof?: Record<string, unknown>,
): VerificationSuccess {
    return {
        success: true,
        method,
        projectId,
        ...(platformUsername && { platformUsername }),
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
    options?: { platformUsername?: string; proof?: Record<string, unknown> },
): VerificationFailure {
    return {
        success: false,
        method,
        projectId,
        error,
        ...(options?.platformUsername && { platformUsername: options.platformUsername }),
        ...(options?.proof && { proof: options.proof }),
    };
}
