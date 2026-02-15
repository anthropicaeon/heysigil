/**
 * Universal link parser — accepts messy user input (URLs, handles, bare repos)
 * and normalizes into a structured project identity.
 *
 * This is the single source of truth for "what did the user mean?"
 * Used by the agent, API routes, and frontend.
 */

export type Platform = "github" | "instagram" | "twitter" | "domain";

export interface ParsedLink {
    /** Detected platform */
    platform: Platform;
    /** Normalized project identifier (e.g., "org/repo", "username", "example.com") */
    projectId: string;
    /** Canonical display URL */
    displayUrl: string;
    /** Which verification methods apply for this platform */
    verifyMethods: string[];
    /** Raw input the user provided */
    rawInput: string;
}

// ─── GitHub ─────────────────────────────────────────────

const GITHUB_URL_RE =
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/?/i;

const BARE_REPO_RE = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/;

function parseGitHub(input: string): ParsedLink | null {
    // Full URL: https://github.com/org/repo/anything
    const urlMatch = input.match(GITHUB_URL_RE);
    if (urlMatch) {
        const [, owner, repo] = urlMatch;
        const cleanRepo = repo.replace(/\.git$/, "");
        return {
            platform: "github",
            projectId: `${owner}/${cleanRepo}`,
            displayUrl: `https://github.com/${owner}/${cleanRepo}`,
            verifyMethods: ["github_oauth", "github_file"],
            rawInput: input,
        };
    }
    return null;
}

// ─── Instagram ──────────────────────────────────────────

const INSTAGRAM_URL_RE =
    /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/?/i;

function parseInstagram(input: string): ParsedLink | null {
    const urlMatch = input.match(INSTAGRAM_URL_RE);
    if (urlMatch) {
        const username = urlMatch[1].toLowerCase();
        return {
            platform: "instagram",
            projectId: username,
            displayUrl: `https://instagram.com/${username}`,
            verifyMethods: ["instagram_graph"],
            rawInput: input,
        };
    }
    return null;
}

// ─── Twitter / X ────────────────────────────────────────

const TWITTER_URL_RE =
    /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)\/?/i;

function parseTwitter(input: string): ParsedLink | null {
    const urlMatch = input.match(TWITTER_URL_RE);
    if (urlMatch) {
        const handle = urlMatch[1].toLowerCase();
        return {
            platform: "twitter",
            projectId: handle,
            displayUrl: `https://x.com/${handle}`,
            verifyMethods: ["tweet_zktls"],
            rawInput: input,
        };
    }
    return null;
}

// ─── Domain ─────────────────────────────────────────────

const DOMAIN_RE =
    /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)\/?/i;

function parseDomain(input: string): ParsedLink | null {
    const match = input.match(DOMAIN_RE);
    if (match) {
        const domain = match[1].toLowerCase();
        // Don't match known social platforms as generic domains
        if (
            domain.startsWith("github.com") ||
            domain.startsWith("instagram.com") ||
            domain.startsWith("twitter.com") ||
            domain.startsWith("x.com")
        ) {
            return null;
        }
        return {
            platform: "domain",
            projectId: domain,
            displayUrl: `https://${domain}`,
            verifyMethods: ["domain_dns", "domain_file", "domain_meta"],
            rawInput: input,
        };
    }
    return null;
}

// ─── Handle Detection ───────────────────────────────────

/**
 * Detect @-prefixed handles.
 * Context hint can be "instagram", "twitter", "github" to disambiguate.
 */
function parseHandle(
    input: string,
    contextHint?: Platform,
): ParsedLink | null {
    const handleMatch = input.match(/^@([a-zA-Z0-9_.-]+)$/);
    if (!handleMatch) return null;

    const handle = handleMatch[1].toLowerCase();

    switch (contextHint) {
        case "instagram":
            return {
                platform: "instagram",
                projectId: handle,
                displayUrl: `https://instagram.com/${handle}`,
                verifyMethods: ["instagram_graph"],
                rawInput: input,
            };
        case "github":
            // @-handle for GitHub doesn't make sense alone, skip
            return null;
        case "twitter":
        default:
            // Default @handle → Twitter
            return {
                platform: "twitter",
                projectId: handle,
                displayUrl: `https://x.com/${handle}`,
                verifyMethods: ["tweet_zktls"],
                rawInput: input,
            };
    }
}

// ─── Public API ─────────────────────────────────────────

/**
 * Parse any user-provided link, URL, handle, or bare identifier
 * into a normalized project identity.
 *
 * @param input - Raw user input (URL, handle, repo slug, etc.)
 * @param contextHint - Optional platform hint for ambiguous inputs
 * @returns ParsedLink or null if the input can't be classified
 *
 * @example
 * parseLink("https://github.com/vercel/next.js")
 * // → { platform: "github", projectId: "vercel/next.js", ... }
 *
 * parseLink("@cooldev", "instagram")
 * // → { platform: "instagram", projectId: "cooldev", ... }
 *
 * parseLink("coolproject.dev")
 * // → { platform: "domain", projectId: "coolproject.dev", ... }
 */
export function parseLink(input: string, contextHint?: Platform): ParsedLink | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Try platform-specific parsers in priority order
    return (
        parseGitHub(trimmed) ??
        parseInstagram(trimmed) ??
        parseTwitter(trimmed) ??
        parseHandle(trimmed, contextHint) ??
        parseBareRepo(trimmed) ??
        parseDomain(trimmed) ??
        null
    );
}

/**
 * Bare "org/repo" → GitHub (only if it doesn't look like a domain).
 * Must be tried after full URL parsers but before domain parser.
 */
function parseBareRepo(input: string): ParsedLink | null {
    const match = input.match(BARE_REPO_RE);
    if (!match) return null;

    const [, owner, repo] = match;
    // Skip if second part has a TLD extension (likely a domain)
    if (/\.(com|org|io|dev|app|net|co|xyz)$/i.test(repo)) return null;

    return {
        platform: "github",
        projectId: `${owner}/${repo}`,
        displayUrl: `https://github.com/${owner}/${repo}`,
        verifyMethods: ["github_oauth", "github_file"],
        rawInput: input,
    };
}

/**
 * Parse multiple links from a space/comma/newline separated string.
 */
export function parseLinks(input: string, contextHint?: Platform): ParsedLink[] {
    const parts = input
        .split(/[\s,\n]+/)
        .map((s) => s.trim())
        .filter(Boolean);

    const results: ParsedLink[] = [];
    for (const part of parts) {
        const parsed = parseLink(part, contextHint);
        if (parsed) results.push(parsed);
    }
    return results;
}

/**
 * Quick platform detection without full parsing.
 */
export function detectPlatform(input: string): Platform | null {
    const parsed = parseLink(input);
    return parsed?.platform ?? null;
}

/**
 * Get the best verification method for a platform.
 */
export function bestVerifyMethod(platform: Platform): string {
    const methods: Record<Platform, string> = {
        github: "github_oauth",
        instagram: "instagram_graph",
        twitter: "tweet_zktls",
        domain: "domain_dns",
    };
    return methods[platform];
}
