/**
 * Token Screen Check
 *
 * Security check for token contracts using GoPlus API.
 */

import type { SecurityCheck, SecurityContext, SecurityResult } from "../types.js";
import type { ParsedAction } from "../../types.js";
import { screenToken } from "../../../services/sentinel.js";

/** Intents that involve token transfers */
const TOKEN_INTENTS = ["swap", "bridge", "send"];

/**
 * Create a token screening security check.
 */
export function createTokenScreenCheck(): SecurityCheck {
    return {
        name: "token-screen",

        async check(action: ParsedAction, _context: SecurityContext): Promise<SecurityResult> {
            // Only check for token-related intents
            if (!TOKEN_INTENTS.includes(action.intent)) {
                return { pass: true };
            }

            const tokenAddress = action.params.tokenAddress as string | undefined;
            if (!tokenAddress) {
                return { pass: true };
            }

            const chain = (action.params.chain as string) || "base";
            const result = await screenToken(tokenAddress, chain);

            if (result.riskLevel === "danger") {
                return {
                    pass: false,
                    reason: "Token blocked",
                    details: result.reasons,
                };
            }

            if (result.riskLevel === "warning") {
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
