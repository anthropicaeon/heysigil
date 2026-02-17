/**
 * Address Blocklist
 *
 * Validates Ethereum addresses against known scam, phishing, and exploit addresses.
 * Sources: Etherscan labels, community reports, past exploits.
 */

import type { ScreenResult } from "./types.js";

/**
 * Known scam, phishing, and exploit addresses.
 * All lowercase for comparison.
 */
const BLOCKED_ADDRESSES = new Set([
    // Known phishing contracts (examples — extend as needed)
    "0x0000000000000000000000000000000000000000", // Zero address
    "0x000000000000000000000000000000000000dead", // Dead address (not necessarily scam but flag)

    // Known Base scam deployers (add real ones as you encounter them)
    // "0x...",
]);

/**
 * High-risk patterns in addresses (not exact matches, but suspicious patterns).
 */
const SUSPICIOUS_ADDRESS_PATTERNS = [
    /^0x0{30,}/i, // Too many leading zeros (vanity scam)
    /^0xdead/i, // Dead address prefix
];

/**
 * Screen an address against the blocklist.
 */
export function screenAddress(address: string): ScreenResult {
    const addr = address.toLowerCase().trim();
    const reasons: string[] = [];

    // Exact blocklist match
    if (BLOCKED_ADDRESSES.has(addr)) {
        reasons.push(`Address ${addr.slice(0, 10)}... is on the blocklist`);
    }

    // Suspicious patterns
    for (const pattern of SUSPICIOUS_ADDRESS_PATTERNS) {
        if (pattern.test(addr)) {
            reasons.push(`Address matches suspicious pattern`);
            break;
        }
    }

    // Basic format validation
    if (!/^0x[0-9a-f]{40}$/i.test(address)) {
        reasons.push("Invalid Ethereum address format");
    }

    if (reasons.length === 0) {
        return { allowed: true, risk: "safe", reasons: [] };
    }

    const isBlocked = reasons.some((r) => r.includes("blocklist"));

    return {
        allowed: !isBlocked,
        risk: isBlocked ? "blocked" : "warning",
        reasons,
    };
}
