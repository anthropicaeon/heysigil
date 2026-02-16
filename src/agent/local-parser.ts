/**
 * Local (offline) intent parser — regex-based fallback when ANTHROPIC_API_KEY
 * is not configured. Handles all 10 intents using pattern matching.
 *
 * This lets the agent respond meaningfully during local dev / demo mode.
 */

import type { ParsedAction, ActionIntent } from "./types.js";

interface IntentPattern {
    intent: ActionIntent;
    patterns: RegExp[];
    extractParams: (match: RegExpMatchArray, raw: string) => Record<string, unknown>;
}

const INTENT_PATTERNS: IntentPattern[] = [
    // ─── Swap ───────────────────────────────────────────
    {
        intent: "swap",
        patterns: [
            /swap\s+([\d.]+)\s*(\w+)\s*(?:to|for|into|→)\s*(\w+)/i,
            /exchange\s+([\d.]+)\s*(\w+)\s*(?:to|for|into)\s*(\w+)/i,
            /convert\s+([\d.]+)\s*(\w+)\s*(?:to|for|into)\s*(\w+)/i,
        ],
        extractParams: (m) => ({
            fromToken: m[2].toUpperCase(),
            toToken: m[3].toUpperCase(),
            amount: m[1],
            chain: "base",
        }),
    },

    // ─── Bridge ─────────────────────────────────────────
    {
        intent: "bridge",
        patterns: [
            /bridge\s+([\d.]+)\s*(\w+)\s*(?:from)?\s*(\w+)\s*(?:to|→)\s*(\w+)/i,
        ],
        extractParams: (m) => ({
            token: m[2].toUpperCase(),
            amount: m[1],
            fromChain: m[3].toLowerCase(),
            toChain: m[4].toLowerCase(),
        }),
    },

    // ─── Send ───────────────────────────────────────────
    {
        intent: "send",
        patterns: [
            /send\s+([\d.]+)\s*(\w+)\s*(?:to)\s*(0x[a-fA-F0-9]+)/i,
            /transfer\s+([\d.]+)\s*(\w+)\s*(?:to)\s*(0x[a-fA-F0-9]+)/i,
        ],
        extractParams: (m) => ({
            token: m[2].toUpperCase(),
            amount: m[1],
            toAddress: m[3],
            chain: "base",
        }),
    },

    // ─── Price ──────────────────────────────────────────
    {
        intent: "price",
        patterns: [
            /(?:price|price of|how much is|what(?:'s| is) the price of)\s+(\w+)/i,
            /^(\w{2,10})\s+price$/i,
        ],
        extractParams: (m) => ({ token: m[1].toUpperCase() }),
    },

    // ─── Balance ────────────────────────────────────────
    {
        intent: "balance",
        patterns: [
            /(?:balance|my balance|check balance|wallet balance)/i,
            /(?:how much|what(?:'s| do i have))\s+(?:in my wallet|do i have)/i,
        ],
        extractParams: () => ({ chain: "base" }),
    },

    // ─── Launch Token ───────────────────────────────────
    {
        intent: "launch_token",
        patterns: [
            /launch\s+(?:a\s+)?(?:token|coin)\s+(?:for|called|named)?\s*(.*)/i,
            /deploy\s+(?:a\s+)?(?:token|coin)\s+(?:for|called|named)?\s*(.*)/i,
            /create\s+(?:a\s+)?(?:token|coin)\s+(?:for|called|named)?\s*(.*)/i,
        ],
        extractParams: (_m, raw) => {
            // Extract URLs from the message
            const urlRegex = /https?:\/\/[^\s,]+/gi;
            const handleRegex = /@[a-zA-Z0-9_]+/g;
            const repoRegex = /([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/g;

            const urls = raw.match(urlRegex) || [];
            const handles = raw.match(handleRegex) || [];
            const repos = raw.match(repoRegex) || [];

            const devLinks = [...urls, ...handles, ...repos].filter(
                (v, i, a) => a.indexOf(v) === i
            );

            // Extract name/symbol
            const nameMatch = raw.match(/(?:called|named)\s+"?([^"]+)"?/i);
            const symbolMatch = raw.match(/\$([A-Z]{2,10})/);

            return {
                name: nameMatch?.[1]?.trim(),
                symbol: symbolMatch?.[1],
                devLinks: devLinks.length > 0 ? devLinks : undefined,
            };
        },
    },

    // ─── Verify Project ─────────────────────────────────
    {
        intent: "verify_project",
        patterns: [
            /verify\s+(https?:\/\/[^\s]+)/i,
            /verify\s+([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/i,
            /verify\s+(@[a-zA-Z0-9_]+)/i,
            /verify\s+([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,})/i,
            /stamp\s+(?:my\s+)?sigil\s+(?:for\s+)?(.*)/i,
        ],
        extractParams: (m) => ({ link: m[1]?.trim() }),
    },

    // ─── Claim Reward ───────────────────────────────────
    {
        intent: "claim_reward",
        patterns: [
            /claim\s+(?:reward|rewards|fees|my fees|my reward)/i,
            /stamp\s+(?:my\s+)?sigil$/i,
        ],
        extractParams: (_m, raw) => {
            const linkMatch = raw.match(/(https?:\/\/[^\s]+|[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)/);
            return { projectId: linkMatch?.[1] };
        },
    },

    // ─── Pool Status ────────────────────────────────────
    {
        intent: "pool_status",
        patterns: [
            /(?:pool|status|check)\s+(?:status|pool|reward|info)\s*(?:for|of)?\s*(.*)/i,
        ],
        extractParams: (m) => ({ projectId: m[1]?.trim() }),
    },

    // ─── Help ───────────────────────────────────────────
    {
        intent: "help",
        patterns: [
            /^(?:help|hi|hello|hey|gm|what can you do|how does this work|explain)/i,
            /^(?:what is sigil|how to|getting started)/i,
        ],
        extractParams: (_m, raw) => ({ topic: raw }),
    },
];

/**
 * Parse a message locally using regex patterns.
 * No LLM call — instant response, works offline.
 */
export function parseLocalMessage(message: string): ParsedAction {
    const trimmed = message.trim();

    for (const { intent, patterns, extractParams } of INTENT_PATTERNS) {
        for (const pattern of patterns) {
            const match = trimmed.match(pattern);
            if (match) {
                return {
                    intent,
                    params: extractParams(match, trimmed),
                    confidence: 0.8,
                    rawText: message,
                };
            }
        }
    }

    // Default to help for anything unmatched
    return {
        intent: "help",
        params: { topic: message },
        confidence: 0.3,
        rawText: message,
    };
}
