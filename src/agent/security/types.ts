/**
 * Security Pipeline Types
 *
 * Interfaces for composable security checks.
 */

import type { ParsedAction } from "../types.js";

export interface SecurityContext {
    userMessage?: string;
    sessionId?: string;
}

export interface SecurityResult {
    pass: boolean;
    reason?: string;
    details?: string[];
}

/**
 * A single security check that can be composed into a pipeline.
 */
export interface SecurityCheck {
    /** Unique name for this check */
    name: string;
    /** Execute the security check */
    check(action: ParsedAction, context: SecurityContext): Promise<SecurityResult>;
}
