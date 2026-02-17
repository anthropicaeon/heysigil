/**
 * Security Pipeline
 *
 * Composable security layer that runs checks in sequence.
 * Stops on first failure, returns all warnings.
 */

import type { ParsedAction } from "../types.js";
import type { SecurityCheck, SecurityContext, SecurityResult } from "./types.js";

export interface PipelineResult {
    pass: boolean;
    failedCheck?: string;
    warnings: string[];
    details: string[];
}

/**
 * Composable security pipeline.
 * Add checks with .add(), run with .run().
 */
export class SecurityPipeline {
    private checks: SecurityCheck[] = [];

    /**
     * Add a security check to the pipeline.
     */
    add(check: SecurityCheck): this {
        this.checks.push(check);
        return this;
    }

    /**
     * Run all checks against an action.
     * Stops on first hard failure, collects all warnings.
     */
    async run(action: ParsedAction, context: SecurityContext): Promise<PipelineResult> {
        const warnings: string[] = [];
        const details: string[] = [];

        for (const check of this.checks) {
            const result = await check.check(action, context);

            if (result.details) {
                details.push(...result.details);
            }

            if (!result.pass) {
                return {
                    pass: false,
                    failedCheck: check.name,
                    warnings,
                    details: result.details || [result.reason || "Check failed"],
                };
            }

            // Collect warnings from passing checks
            if (result.reason) {
                warnings.push(result.reason);
            }
        }

        return { pass: true, warnings, details };
    }

    /**
     * Get list of registered check names.
     */
    getCheckNames(): string[] {
        return this.checks.map((c) => c.name);
    }
}

/**
 * Create a new security pipeline.
 */
export function createPipeline(): SecurityPipeline {
    return new SecurityPipeline();
}
