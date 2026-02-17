/**
 * Address Screen Check
 *
 * Security check for addresses against blocklist.
 */

import type { SecurityCheck, SecurityContext, SecurityResult } from "../types.js";
import type { ParsedAction } from "../../types.js";
import { screenAddress } from "../../../services/sentinel.js";

/** Address-related parameter keys */
const ADDRESS_KEYS = ["to", "from", "address", "wallet", "devAddress", "recipient", "tokenAddress"];

/**
 * Extract addresses from action params.
 */
function extractAddresses(params: Record<string, unknown>): string[] {
    const addresses: string[] = [];

    for (const [key, val] of Object.entries(params)) {
        if (
            typeof val === "string" &&
            /^0x[0-9a-fA-F]{40}$/.test(val) &&
            ADDRESS_KEYS.includes(key)
        ) {
            addresses.push(val);
        }
    }

    return addresses;
}

/**
 * Create an address screening security check.
 */
export function createAddressScreenCheck(): SecurityCheck {
    return {
        name: "address-screen",

        async check(action: ParsedAction, _context: SecurityContext): Promise<SecurityResult> {
            const addresses = extractAddresses(action.params);

            if (addresses.length === 0) {
                return { pass: true };
            }

            const warnings: string[] = [];
            const details: string[] = [];

            for (const addr of addresses) {
                const result = screenAddress(addr);

                if (result.risk === "blocked") {
                    return {
                        pass: false,
                        reason: `Address blocked: ${addr.slice(0, 10)}...`,
                        details: result.reasons,
                    };
                }

                if (result.risk === "warning") {
                    warnings.push(...result.reasons);
                    details.push(...result.reasons);
                }
            }

            if (warnings.length > 0) {
                return {
                    pass: true,
                    reason: warnings.join("; "),
                    details,
                };
            }

            return { pass: true };
        },
    };
}
