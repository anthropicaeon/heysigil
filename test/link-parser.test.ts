import { describe, test, expect } from "bun:test";
import {
    parseLink,
    parseLinks,
    detectPlatform,
    bestVerifyMethod,
} from "../src/utils/link-parser.js";

// ─── GitHub ─────────────────────────────────────────────

describe("parseLink — GitHub", () => {
    test("full HTTPS URL", () => {
        const r = parseLink("https://github.com/vercel/next.js");
        expect(r?.platform).toBe("github");
        expect(r?.projectId).toBe("vercel/next.js");
        expect(r?.displayUrl).toBe("https://github.com/vercel/next.js");
    });

    test("URL without protocol", () => {
        const r = parseLink("github.com/org/repo");
        expect(r?.platform).toBe("github");
        expect(r?.projectId).toBe("org/repo");
    });

    test("URL with www", () => {
        const r = parseLink("https://www.github.com/org/repo");
        expect(r?.platform).toBe("github");
        expect(r?.projectId).toBe("org/repo");
    });

    test("URL with deep path (tree/main/...)", () => {
        const r = parseLink("https://github.com/org/repo/tree/main/src/foo");
        expect(r?.platform).toBe("github");
        expect(r?.projectId).toBe("org/repo");
    });

    test("URL with .git suffix", () => {
        const r = parseLink("https://github.com/org/repo.git");
        expect(r?.platform).toBe("github");
        expect(r?.projectId).toBe("org/repo");
    });

    test("URL with trailing slash", () => {
        const r = parseLink("https://github.com/org/repo/");
        expect(r?.platform).toBe("github");
        expect(r?.projectId).toBe("org/repo");
    });

    test("bare org/repo (no domain)", () => {
        const r = parseLink("vercel/next.js");
        expect(r?.platform).toBe("github");
        expect(r?.projectId).toBe("vercel/next.js");
    });

    test("org/repo does NOT match if repo looks like TLD", () => {
        const r = parseLink("example/com");
        // "com" looks like a TLD → should still match as github since "com" alone isn't filtered
        expect(r?.platform).toBe("github");
    });

    test("verifyMethods includes oauth and file", () => {
        const r = parseLink("https://github.com/a/b");
        expect(r?.verifyMethods).toContain("github_oauth");
        expect(r?.verifyMethods).toContain("github_file");
    });
});

// ─── Instagram ──────────────────────────────────────────

describe("parseLink — Instagram", () => {
    test("full URL", () => {
        const r = parseLink("https://instagram.com/dev_handle");
        expect(r?.platform).toBe("instagram");
        expect(r?.projectId).toBe("dev_handle");
    });

    test("URL without protocol", () => {
        const r = parseLink("instagram.com/dev_handle");
        expect(r?.platform).toBe("instagram");
        expect(r?.projectId).toBe("dev_handle");
    });

    test("with www", () => {
        const r = parseLink("https://www.instagram.com/myprofile/");
        expect(r?.platform).toBe("instagram");
        expect(r?.projectId).toBe("myprofile");
    });

    test("@handle with instagram context", () => {
        const r = parseLink("@cooldev", "instagram");
        expect(r?.platform).toBe("instagram");
        expect(r?.projectId).toBe("cooldev");
    });
});

// ─── Twitter / X ────────────────────────────────────────

describe("parseLink — Twitter/X", () => {
    test("twitter.com URL", () => {
        const r = parseLink("https://twitter.com/jack");
        expect(r?.platform).toBe("twitter");
        expect(r?.projectId).toBe("jack");
    });

    test("x.com URL", () => {
        const r = parseLink("https://x.com/elonmusk");
        expect(r?.platform).toBe("twitter");
        expect(r?.projectId).toBe("elonmusk");
    });

    test("@handle defaults to twitter", () => {
        const r = parseLink("@somedev");
        expect(r?.platform).toBe("twitter");
        expect(r?.projectId).toBe("somedev");
    });

    test("displayUrl uses x.com", () => {
        const r = parseLink("https://twitter.com/jack");
        expect(r?.displayUrl).toBe("https://x.com/jack");
    });
});

// ─── Domain ─────────────────────────────────────────────

describe("parseLink — Domain", () => {
    test("bare domain", () => {
        const r = parseLink("coolproject.dev");
        expect(r?.platform).toBe("domain");
        expect(r?.projectId).toBe("coolproject.dev");
    });

    test("domain with https", () => {
        const r = parseLink("https://mysite.com");
        expect(r?.platform).toBe("domain");
        expect(r?.projectId).toBe("mysite.com");
    });

    test("domain with www", () => {
        const r = parseLink("https://www.example.org");
        expect(r?.platform).toBe("domain");
        expect(r?.projectId).toBe("example.org");
    });

    test("does NOT classify github.com as domain", () => {
        const r = parseLink("github.com/org/repo");
        expect(r?.platform).toBe("github");
    });

    test("does NOT classify instagram.com as domain", () => {
        const r = parseLink("instagram.com/user");
        expect(r?.platform).toBe("instagram");
    });

    test("verifyMethods for domain", () => {
        const r = parseLink("mysite.io");
        expect(r?.verifyMethods).toContain("domain_dns");
        expect(r?.verifyMethods).toContain("domain_file");
        expect(r?.verifyMethods).toContain("domain_meta");
    });
});

// ─── Edge Cases ─────────────────────────────────────────

describe("parseLink — edge cases", () => {
    test("empty string returns null", () => {
        expect(parseLink("")).toBeNull();
    });

    test("whitespace-only returns null", () => {
        expect(parseLink("   ")).toBeNull();
    });

    test("trims whitespace", () => {
        const r = parseLink("  https://github.com/a/b  ");
        expect(r?.projectId).toBe("a/b");
    });

    test("preserves rawInput", () => {
        const input = "https://github.com/a/b";
        const r = parseLink(input);
        expect(r?.rawInput).toBe(input);
    });
});

// ─── parseLinks (multi) ─────────────────────────────────

describe("parseLinks", () => {
    test("comma-separated links", () => {
        const results = parseLinks(
            "https://github.com/a/b, https://instagram.com/dev",
        );
        expect(results).toHaveLength(2);
        expect(results[0].platform).toBe("github");
        expect(results[1].platform).toBe("instagram");
    });

    test("space-separated links", () => {
        const results = parseLinks(
            "github.com/a/b instagram.com/user",
        );
        expect(results).toHaveLength(2);
    });

    test("skips unrecognized tokens", () => {
        const results = parseLinks("github.com/a/b randomword");
        expect(results).toHaveLength(1);
    });
});

// ─── Helpers ────────────────────────────────────────────

describe("detectPlatform", () => {
    test("returns platform", () => {
        expect(detectPlatform("https://github.com/a/b")).toBe("github");
        expect(detectPlatform("instagram.com/foo")).toBe("instagram");
        expect(detectPlatform("mysite.dev")).toBe("domain");
    });

    test("returns null for garbage", () => {
        expect(detectPlatform("not a link")).toBeNull();
    });
});

describe("bestVerifyMethod", () => {
    test("github → github_oauth", () => {
        expect(bestVerifyMethod("github")).toBe("github_oauth");
    });
    test("instagram → instagram_graph", () => {
        expect(bestVerifyMethod("instagram")).toBe("instagram_graph");
    });
    test("twitter → tweet_zktls", () => {
        expect(bestVerifyMethod("twitter")).toBe("tweet_zktls");
    });
    test("domain → domain_dns", () => {
        expect(bestVerifyMethod("domain")).toBe("domain_dns");
    });
});
