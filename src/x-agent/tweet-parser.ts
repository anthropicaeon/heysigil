/**
 * Tweet Parser
 *
 * Context-independent parser that extracts token launch intents from tweet text.
 * Handles natural language requests, not just rigid patterns.
 * Reuses the universal link-parser for URL/handle detection.
 */

import { parseLinks, parseLink, type ParsedLink } from "../utils/link-parser.js";

// ─── Types ──────────────────────────────────────────────

export interface TweetLaunchIntent {
    /** Extracted token name (e.g. "Cool Token"), or null if not found */
    tokenName: string | null;
    /** Extracted token symbol (e.g. "COOL"), or null if not found */
    tokenSymbol: string | null;
    /** Parsed developer links — GitHub repos, Twitter handles, domains */
    devLinks: ParsedLink[];
    /** Original tweet text */
    rawText: string;
    /** Tweet ID for deduplication */
    tweetId: string;
    /** Author's Twitter handle (without @) */
    authorHandle: string;
}

// ─── Patterns ───────────────────────────────────────────

/** Matches $TICKER patterns (1-10 uppercase letters) */
const TICKER_RE = /\$([A-Z]{1,10})\b/g;

/**
 * Broad launch intent detection — any phrase that signals
 * "I want a token created / launched / deployed"
 */
const LAUNCH_INTENT_RE = /\b(launch|create|deploy|mint|make|start|build|spin\s*up|set\s*up)\b.*\b(token|coin|memecoin|meme\s*coin)?\b|\b(token|coin|memecoin)\b.*\b(launch|create|deploy|mint|make|for)\b/i;

/** Simpler fallback: just "launch" / "create" / "deploy" / "mint" on its own */
const LAUNCH_KEYWORD_RE = /\b(launch|create|deploy|mint)\b/i;

/** Matches "token" anywhere — boosts confidence of intent */
const TOKEN_WORD_RE = /\btoken\b/i;

/** Matches "name <X>" or "named <X>" or "called <X>" — stops at known keywords */
const EXPLICIT_NAME_RE = /\b(?:name[d]?|called)\s+[\"']?([A-Za-z0-9][A-Za-z0-9 _-]{0,30}?)[\"']?(?=\s+(?:ticker|ticket|tiker|symbol|sym|for|on|with|https?:\/\/|\$[A-Z])|[.,!?]|$)/i;

/** Matches "ticker <X>" or "symbol <X>" — includes common typos */
const EXPLICIT_TICKER_RE = /\b(?:ticker|ticket|tiker|symbol|sym)\s+[\"']?([A-Za-z0-9]{1,10})[\"']?(?:\s|$|[.,!?])/i;

/** Matches "launch X" / "create X" style name phrases (old pattern, kept as fallback) */
const LAUNCH_NAME_RE =
    /(?:launch|create|deploy|mint|make)\s+(?:\$\w+\s+)?(?:called?\s+|named?\s+)?["']?([A-Za-z0-9][A-Za-z0-9 _-]{0,30}?)["']?(?:\s+(?:for|on|with|token|\$)|$)/i;

/** Matches explicit "for <link>" → the primary fee destination */
const FOR_LINK_RE = /\bfor\s+((?:https?:\/\/)?[\w./\-@]+)/i;

// ─── Parser ─────────────────────────────────────────────

/**
 * Parse a tweet mentioning the bot and extract a token launch intent.
 *
 * Handles natural language like:
 *   "@HeySigilBot launch $COOL for github.com/user/repo"
 *   "@HeySigilBot please make a token. Name TwitterTest ticker TEST"
 *   "@HeySigilBot create token for this developer"
 *   "@HeySigilBot deploy $BASED for @twitterhandle"
 *
 * @param text        - Full tweet text (including @bot mention)
 * @param tweetId     - Unique tweet identifier
 * @param authorHandle - Tweet author's handle (without @)
 * @param botHandle   - The bot's handle (without @) — stripped from text before parsing
 * @returns TweetLaunchIntent if a launch intent is detected, null if no intent found
 */
export function parseTweet(
    text: string,
    tweetId: string,
    authorHandle: string,
    botHandle: string,
): TweetLaunchIntent | null {
    // Strip the bot mention(s)
    const stripped = text
        .replace(new RegExp(`@${escapeRegex(botHandle)}`, "gi"), "")
        .trim();

    if (!stripped) return null;

    // ── Detect launch intent ────────────────────────────
    const hasLaunchIntent = LAUNCH_INTENT_RE.test(stripped);
    const hasLaunchKeyword = LAUNCH_KEYWORD_RE.test(stripped);
    const hasTokenWord = TOKEN_WORD_RE.test(stripped);

    // Must have some signal of intent
    if (!hasLaunchIntent && !hasLaunchKeyword && !hasTokenWord) {
        return null;
    }

    // "token" alone isn't enough — need at least one action word too
    if (!hasLaunchIntent && !hasLaunchKeyword && hasTokenWord) {
        // Check for action-like words: "make", "want", "please", "need", "give"
        if (!/\b(make|want|please|need|give|give\s*me|can\s*you|could\s*you)\b/i.test(stripped)) {
            return null;
        }
    }

    // ── Extract ticker symbol ───────────────────────────
    const tickers: string[] = [];
    let tickerMatch: RegExpExecArray | null;
    TICKER_RE.lastIndex = 0;
    while ((tickerMatch = TICKER_RE.exec(stripped)) !== null) {
        tickers.push(tickerMatch[1]);
    }
    let tokenSymbol = tickers[0] ?? null;

    // Check for explicit "ticker X" / "symbol X" pattern
    const explicitTicker = stripped.match(EXPLICIT_TICKER_RE);
    if (explicitTicker) {
        tokenSymbol = explicitTicker[1].toUpperCase();
    }

    // ── Extract token name ──────────────────────────────
    // Priority: explicit "name X" > "launch X" pattern
    let tokenName: string | null = null;

    const explicitName = stripped.match(EXPLICIT_NAME_RE);
    if (explicitName) {
        tokenName = explicitName[1].trim();
    } else {
        const nameMatch = stripped.match(LAUNCH_NAME_RE);
        tokenName = nameMatch?.[1]?.trim() ?? null;
    }

    // Clean up: don't use generic words as names
    const GENERIC_WORDS = new Set([
        "a", "an", "the", "my", "this", "that", "new", "it", "one",
        "token", "coin", "memecoin", "for", "on", "please",
    ]);
    if (tokenName && GENERIC_WORDS.has(tokenName.toLowerCase())) {
        tokenName = null;
    }

    // If name matches the ticker, clear it (avoid "COOL" as both name and symbol)
    if (tokenName && tokenSymbol && tokenName.toUpperCase() === tokenSymbol) {
        tokenName = null;
    }

    // ── Extract dev links ───────────────────────────────
    // First, try explicit "for <link>" pattern
    const forMatch = stripped.match(FOR_LINK_RE);
    let devLinks: ParsedLink[] = [];

    if (forMatch) {
        const forLink = parseLink(forMatch[1]);
        if (forLink) devLinks.push(forLink);
    }

    // Also parse all links/handles from the full text
    const allLinks = parseLinks(stripped);
    for (const link of allLinks) {
        // Deduplicate by projectId
        if (!devLinks.some((existing) => existing.projectId === link.projectId)) {
            devLinks.push(link);
        }
    }

    // NOTE: Author-handle fallback is NOT applied here.
    // The orchestrator owns the full fallback chain:
    //   mention links → thread links → thread root author → mention author

    return {
        tokenName,
        tokenSymbol,
        devLinks,
        rawText: text,
        tweetId,
        authorHandle,
    };
}

/**
 * Join thread texts into a single string for parsing multi-part launch intents.
 */
export function joinThreadTexts(texts: string[]): string {
    return texts.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Check if a parsed intent has enough information to attempt a launch.
 */
export function isLaunchable(intent: TweetLaunchIntent): boolean {
    // Need at least a symbol or name, and at least one dev link
    return (intent.tokenSymbol !== null || intent.tokenName !== null) && intent.devLinks.length > 0;
}

// ─── Helpers ────────────────────────────────────────────

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
