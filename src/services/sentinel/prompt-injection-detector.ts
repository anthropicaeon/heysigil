/**
 * Prompt Injection Detector
 *
 * Detects and blocks AI manipulation attempts using pattern matching.
 * Protects against jailbreaks, instruction overrides, and fund drains.
 */

import type { ScreenResult } from "./types.js";

/**
 * Patterns that indicate prompt injection / jailbreak attempts.
 * These try to override the AI's behavior or extract internal instructions.
 */
const INJECTION_PATTERNS: { pattern: RegExp; label: string }[] = [
    // Direct instruction override
    {
        pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|prompts?)/i,
        label: "instruction override",
    },
    {
        pattern: /forget\s+(everything|all|your)\s+(you|instructions?|rules?)/i,
        label: "memory wipe",
    },
    { pattern: /you\s+are\s+now\s+/i, label: "persona hijack" },
    { pattern: /act\s+as\s+(if|though)\s+you\s+(are|were)\s+/i, label: "persona override" },
    { pattern: /pretend\s+(you('re|\s+are)\s+|to\s+be\s+)/i, label: "persona pretend" },
    { pattern: /new\s+(system\s+)?instructions?:/i, label: "system prompt injection" },
    { pattern: /\bsystem\s*:\s*/i, label: "system role injection" },

    // Extraction attempts
    {
        pattern:
            /what\s+(are|is)\s+your\s+(system|initial|original)\s+(prompt|instructions?|rules?)/i,
        label: "prompt extraction",
    },
    {
        pattern: /reveal\s+your\s+(prompt|instructions?|rules?|system)/i,
        label: "prompt extraction",
    },
    { pattern: /show\s+me\s+your\s+(prompt|instructions?|config)/i, label: "prompt extraction" },
    {
        pattern: /repeat\s+(the|your)\s+(system|above|initial)\s+(prompt|message|instructions?)/i,
        label: "prompt extraction",
    },

    // Fund diversion
    {
        pattern: /send\s+(all|everything|my\s+entire)\s+(balance|funds|tokens?|eth|crypto)/i,
        label: "fund drain attempt",
    },
    { pattern: /transfer\s+(all|everything)\s+to\s+/i, label: "fund drain attempt" },
    { pattern: /send\s+all\s+my\s+/i, label: "fund drain attempt" },
    { pattern: /drain/i, label: "drain keyword" },

    // Encoded payloads
    { pattern: /eval\s*\(/i, label: "code injection" },
    { pattern: /<script/i, label: "XSS attempt" },
    { pattern: /\{\{.*\}\}/i, label: "template injection" },
];

/**
 * Critical labels that result in immediate blocking.
 */
const CRITICAL_LABELS = new Set([
    "instruction override",
    "memory wipe",
    "persona hijack",
    "system prompt injection",
    "system role injection",
    "fund drain attempt",
    "code injection",
    "XSS attempt",
]);

/**
 * Screen user input for prompt injection attempts.
 */
export function screenPrompt(userMessage: string): ScreenResult {
    const reasons: string[] = [];

    for (const { pattern, label } of INJECTION_PATTERNS) {
        if (pattern.test(userMessage)) {
            reasons.push(label);
        }
    }

    if (reasons.length === 0) {
        return { allowed: true, risk: "safe", reasons: [] };
    }

    // Single match on something minor = warning, multiple or critical = blocked
    const isCritical = reasons.some((r) => CRITICAL_LABELS.has(r));

    return {
        allowed: !isCritical,
        risk: isCritical ? "blocked" : "warning",
        reasons: reasons.map((r) => `Prompt injection detected: ${r}`),
    };
}
