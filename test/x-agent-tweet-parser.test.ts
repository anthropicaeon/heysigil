import { describe, test, expect } from "bun:test";
import { parseTweet, joinThreadTexts, isLaunchable } from "../src/x-agent/tweet-parser.js";

const BOT = "HeySigil";

// ─── Basic Launch Detection ────────────────────────────

describe("parseTweet — launch detection", () => {
    test("parses @HeySigil launch $COOL for github.com/user/repo", () => {
        const result = parseTweet(
            "@HeySigil launch $COOL for github.com/user/repo",
            "tweet1",
            "cooldev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBe("COOL");
        expect(result!.devLinks).toHaveLength(1);
        expect(result!.devLinks[0].platform).toBe("github");
        expect(result!.devLinks[0].projectId).toBe("user/repo");
        expect(result!.tweetId).toBe("tweet1");
        expect(result!.authorHandle).toBe("cooldev");
    });

    test("parses create keyword", () => {
        const result = parseTweet(
            "@HeySigil create $BASED for https://github.com/dev/project",
            "tweet2",
            "devguy",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBe("BASED");
        expect(result!.devLinks[0].platform).toBe("github");
    });

    test("parses deploy keyword", () => {
        const result = parseTweet(
            "@HeySigil deploy token for github.com/org/repo",
            "tweet3",
            "builder",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.devLinks[0].projectId).toBe("org/repo");
    });

    test("parses mint keyword", () => {
        const result = parseTweet(
            "@HeySigil mint $DOGE for github.com/much/wow",
            "tweet4",
            "shiber",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBe("DOGE");
    });
});

// ─── Ticker Extraction ─────────────────────────────────

describe("parseTweet — ticker extraction", () => {
    test("extracts $TICKER from tweet", () => {
        const result = parseTweet(
            "@HeySigil launch $MYTOKEN for github.com/me/proj",
            "t1",
            "me",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBe("MYTOKEN");
    });

    test("extracts first ticker when multiple present", () => {
        const result = parseTweet(
            "@HeySigil launch $FIRST not $SECOND for github.com/me/proj",
            "t2",
            "me",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBe("FIRST");
    });

    test("null symbol when no ticker present", () => {
        const result = parseTweet(
            "@HeySigil launch token for github.com/me/proj",
            "t3",
            "me",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBeNull();
    });
});

// ─── Name Extraction ───────────────────────────────────

describe("parseTweet — name extraction", () => {
    test("extracts name from 'launch CoolProject'", () => {
        const result = parseTweet(
            "@HeySigil launch CoolProject for github.com/user/repo",
            "t1",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenName).toBe("CoolProject");
    });

    test("extracts name from 'create called MyToken'", () => {
        const result = parseTweet(
            "@HeySigil create token called MyToken for github.com/user/repo",
            "t2",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        // The name parser should pick up MyToken
        expect(result!.tokenName).not.toBeNull();
    });

    test("null name when only ticker present", () => {
        const result = parseTweet(
            "@HeySigil launch $COOL for github.com/me/proj",
            "t3",
            "me",
            BOT,
        );

        expect(result).not.toBeNull();
        // Name should be null since "COOL" matches the ticker
        expect(result!.tokenName).toBeNull();
    });
});

// ─── Dev Link Extraction ───────────────────────────────

describe("parseTweet — dev links", () => {
    test("extracts GitHub URL", () => {
        const result = parseTweet(
            "@HeySigil launch $X for https://github.com/vercel/next.js",
            "t1",
            "dev",
            BOT,
        );

        expect(result!.devLinks).toHaveLength(1);
        expect(result!.devLinks[0].platform).toBe("github");
        expect(result!.devLinks[0].projectId).toBe("vercel/next.js");
    });

    test("extracts Twitter handle as dev link", () => {
        const result = parseTweet(
            "@HeySigil launch $FAN for @twitterdev",
            "t2",
            "fan",
            BOT,
        );

        expect(result!.devLinks.length).toBeGreaterThanOrEqual(1);
        const twitterLink = result!.devLinks.find((l) => l.platform === "twitter");
        expect(twitterLink).not.toBeUndefined();
    });

    test("extracts domain as dev link", () => {
        const result = parseTweet(
            "@HeySigil launch $WEB for myproject.dev",
            "t3",
            "webdev",
            BOT,
        );

        expect(result!.devLinks.length).toBeGreaterThanOrEqual(1);
        const domainLink = result!.devLinks.find((l) => l.platform === "domain");
        expect(domainLink).not.toBeUndefined();
        expect(domainLink!.projectId).toBe("myproject.dev");
    });

    test("extracts multiple dev links", () => {
        const result = parseTweet(
            "@HeySigil launch $MULTI for github.com/user/repo and mysite.dev",
            "t4",
            "multi",
            BOT,
        );

        expect(result!.devLinks.length).toBeGreaterThanOrEqual(2);
    });

    test("returns empty devLinks when no links provided (orchestrator handles fallback)", () => {
        const result = parseTweet(
            "@HeySigil launch $NOLINK token",
            "t5",
            "lonely_dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.devLinks).toHaveLength(0);
    });
});

// ─── Non-Launch Tweets ─────────────────────────────────

describe("parseTweet — non-launch tweets", () => {
    test("returns null for non-launch tweets", () => {
        const result = parseTweet(
            "@HeySigil what's the price of ETH?",
            "t1",
            "user",
            BOT,
        );

        expect(result).toBeNull();
    });

    test("returns null for greeting", () => {
        const result = parseTweet("@HeySigil hey what's up?", "t2", "user", BOT);
        expect(result).toBeNull();
    });

    test("returns null for empty text after stripping handle", () => {
        const result = parseTweet("@HeySigil", "t3", "user", BOT);
        expect(result).toBeNull();
    });
});

// ─── Thread Support ────────────────────────────────────

describe("joinThreadTexts", () => {
    test("joins multiple tweet texts", () => {
        const result = joinThreadTexts([
            "@HeySigil launch $COOL",
            "for github.com/user/repo",
            "it's a great project",
        ]);

        expect(result).toBe("@HeySigil launch $COOL for github.com/user/repo it's a great project");
    });

    test("normalizes whitespace", () => {
        const result = joinThreadTexts(["  first  ", "  second  "]);
        expect(result).toBe("first second");
    });

    test("handles empty array", () => {
        const result = joinThreadTexts([]);
        expect(result).toBe("");
    });
});

// ─── isLaunchable ──────────────────────────────────────

describe("isLaunchable", () => {
    test("true when symbol and links present", () => {
        const intent = parseTweet(
            "@HeySigil launch $COOL for github.com/user/repo",
            "t1",
            "dev",
            BOT,
        );
        expect(intent).not.toBeNull();
        expect(isLaunchable(intent!)).toBe(true);
    });

    test("true when name (no symbol) and links present", () => {
        const intent = parseTweet(
            "@HeySigil launch CoolProject for github.com/user/repo",
            "t1",
            "dev",
            BOT,
        );
        expect(intent).not.toBeNull();
        expect(isLaunchable(intent!)).toBe(true);
    });

    test("false when symbol present but no links (orchestrator adds fallback later)", () => {
        const intent = parseTweet(
            "@HeySigil launch $SOLO token",
            "t1",
            "solo_dev",
            BOT,
        );
        expect(intent).not.toBeNull();
        // Parser no longer adds author fallback — orchestrator does
        expect(isLaunchable(intent!)).toBe(false);
    });
});

// ─── Edge Cases ────────────────────────────────────────

describe("parseTweet — edge cases", () => {
    test("case-insensitive bot handle stripping", () => {
        const result = parseTweet(
            "@heysigil launch $CASE for github.com/user/repo",
            "t1",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBe("CASE");
    });

    test("multiple bot mentions stripped", () => {
        const result = parseTweet(
            "@HeySigil @HeySigil launch $DUP for github.com/u/r",
            "t1",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBe("DUP");
    });

    test("preserves tweet metadata", () => {
        const result = parseTweet(
            "@HeySigil launch $META for github.com/u/r",
            "tweet_123",
            "meta_user",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tweetId).toBe("tweet_123");
        expect(result!.authorHandle).toBe("meta_user");
        expect(result!.rawText).toBe("@HeySigil launch $META for github.com/u/r");
    });
});

// ─── Natural Language ──────────────────────────────────

describe("parseTweet — natural language", () => {
    test("'make a token' is a launch intent", () => {
        const result = parseTweet(
            "@HeySigil please make a token for github.com/user/repo",
            "t1",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.devLinks).toHaveLength(1);
        expect(result!.devLinks[0].platform).toBe("github");
    });

    test("'Name X ticker Y' extracts both", () => {
        const result = parseTweet(
            "@HeySigil Please make a token for this tweet. Name TwitterTest ticker Test",
            "t2",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenName).toBe("TwitterTest");
        expect(result!.tokenSymbol).toBe("TEST");
    });

    test("'can you create a token' works", () => {
        const result = parseTweet(
            "@HeySigil can you create a token called CoolCoin",
            "t3",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenName).not.toBeNull();
    });

    test("'please make a token' without links returns empty devLinks", () => {
        const result = parseTweet(
            "@HeySigil please make a token. Name MyToken ticker MTK",
            "t4",
            "somedev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenName).toBe("MyToken");
        expect(result!.tokenSymbol).toBe("MTK");
        // No links — orchestrator adds author fallback, not the parser
        expect(result!.devLinks).toHaveLength(0);
    });

    test("does NOT match random 'token' mentions", () => {
        const result = parseTweet(
            "@HeySigil how much is the token worth?",
            "t5",
            "user",
            BOT,
        );

        expect(result).toBeNull();
    });
});

// ─── Typo Tolerance ────────────────────────────────────

describe("parseTweet — typo tolerance", () => {
    test("handles 'ticket' typo for 'ticker' (exact failing tweet)", () => {
        const result = parseTweet(
            "@HeySigilBot launch token name Accomplish ticket Accom for https://github.com/accomplish-ai/accomplish",
            "t1",
            "anthropicaeon",
            "HeySigilBot",
        );

        expect(result).not.toBeNull();
        expect(result!.tokenName).toBe("Accomplish");
        expect(result!.tokenSymbol).toBe("ACCOM");
        expect(result!.devLinks).toHaveLength(1);
        expect(result!.devLinks[0].platform).toBe("github");
        expect(result!.devLinks[0].projectId).toBe("accomplish-ai/accomplish");
    });

    test("handles 'tiker' typo for 'ticker'", () => {
        const result = parseTweet(
            "@HeySigil launch token tiker TEST for github.com/user/repo",
            "t2",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBe("TEST");
    });

    test("handles 'sym' abbreviation for 'symbol'", () => {
        const result = parseTweet(
            "@HeySigil launch token sym COOL for github.com/user/repo",
            "t3",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenSymbol).toBe("COOL");
    });

    test("multi-word name before ticker keyword", () => {
        const result = parseTweet(
            "@HeySigil create token name Cool Project ticker CP for github.com/u/r",
            "t4",
            "dev",
            BOT,
        );

        expect(result).not.toBeNull();
        expect(result!.tokenName).toBe("Cool Project");
        expect(result!.tokenSymbol).toBe("CP");
    });
});

// ─── t.co URL Expansion ────────────────────────────────

import { expandTcoUrls, type TwitterMention } from "../src/x-agent/twitter-client.js";

describe("expandTcoUrls", () => {
    test("replaces t.co URLs with expanded URLs", () => {
        const tweet: TwitterMention = {
            id: "1",
            text: "@HeySigilBot launch $COOL for https://t.co/abc123",
            author_id: "123",
            created_at: "2026-01-01T00:00:00Z",
            entities: {
                urls: [
                    {
                        url: "https://t.co/abc123",
                        expanded_url: "https://github.com/user/cool-repo",
                        display_url: "github.com/user/cool-repo",
                    },
                ],
            },
        };

        const expanded = expandTcoUrls(tweet);
        expect(expanded).toBe("@HeySigilBot launch $COOL for https://github.com/user/cool-repo");
    });

    test("returns original text when no entities", () => {
        const tweet: TwitterMention = {
            id: "2",
            text: "@HeySigilBot launch $COOL",
            author_id: "123",
            created_at: "2026-01-01T00:00:00Z",
        };

        const expanded = expandTcoUrls(tweet);
        expect(expanded).toBe("@HeySigilBot launch $COOL");
    });

    test("handles multiple t.co URLs", () => {
        const tweet: TwitterMention = {
            id: "3",
            text: "Check https://t.co/aaa and https://t.co/bbb",
            author_id: "123",
            created_at: "2026-01-01T00:00:00Z",
            entities: {
                urls: [
                    { url: "https://t.co/aaa", expanded_url: "https://github.com/org/repo1", display_url: "github.com/org/repo1" },
                    { url: "https://t.co/bbb", expanded_url: "https://example.com", display_url: "example.com" },
                ],
            },
        };

        const expanded = expandTcoUrls(tweet);
        expect(expanded).toBe("Check https://github.com/org/repo1 and https://example.com");
    });

    test("'for this GitHub' card is parseable after expansion", () => {
        // Simulates the exact API response for the failing tweet
        const tweet: TwitterMention = {
            id: "4",
            text: "@HeySigilBot launch token name Accomplish ticket Accom for this GitHub https://t.co/xyz",
            author_id: "123",
            created_at: "2026-01-01T00:00:00Z",
            entities: {
                urls: [
                    {
                        url: "https://t.co/xyz",
                        expanded_url: "https://github.com/accomplish-ai/accomplish",
                        display_url: "github.com/accomplish-ai/accomplish",
                    },
                ],
            },
        };

        const expanded = expandTcoUrls(tweet);
        const result = parseTweet(expanded, tweet.id, "anthropicaeon", "HeySigilBot");

        expect(result).not.toBeNull();
        expect(result!.tokenName).toBe("Accomplish");
        expect(result!.tokenSymbol).toBe("ACCOM");
        expect(result!.devLinks.length).toBeGreaterThanOrEqual(1);
        const ghLink = result!.devLinks.find((l) => l.platform === "github");
        expect(ghLink).not.toBeUndefined();
        expect(ghLink!.projectId).toBe("accomplish-ai/accomplish");
    });
});
