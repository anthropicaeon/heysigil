/**
 * Prompt Injection Check
 *
 * Security check for AI manipulation attempts.
 */

import type { SecurityCheck, SecurityContext, SecurityResult } from "../types.js";
import type { ParsedAction } from "../../types.js";
import { screenPrompt } from "../../../services/sentinel.js";

/**
 * Create a prompt injection security check.
 */
export function createPromptInjectionCheck(): SecurityCheck {
    return {
        name: "prompt-injection",

        async check(_action: ParsedAction, context: SecurityContext): Promise<SecurityResult> {
            if (!context.userMessage) {
                return { pass: true };
            }

            const result = screenPrompt(context.userMessage);

            if (!result.allowed) {
                return {
                    pass: false,
                    reason: "Prompt injection blocked",
                    details: result.reasons,
                };
            }

            // Warning (allowed but flagged)
            if (result.risk === "warning") {
                return {
                    pass: true,
                    reason: result.reasons.join("; "),
                    details: result.reasons,
                };
            }

            return { pass: true };
        },
    };
}
