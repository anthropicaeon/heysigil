/**
 * VerifyFlow Constants
 */

import type { Method } from "./types";

/**
 * Verification methods ordered by recommendation level.
 * First 3 are "recommended" (shown prominently), rest collapsed under "More options".
 * Hick's Law: Fewer choices = faster decisions + higher completion.
 */
export const METHODS: Method[] = [
    {
        id: "github_oauth",
        name: "GitHub OAuth",
        description: "Verify admin access to a GitHub repository",
        projectIdFormat: "owner/repo",
        requiresOAuth: true,
        recommended: true,
        badge: "Fastest",
        popularity: 87,
    },
    {
        id: "domain_dns",
        name: "DNS TXT Record",
        description: "Add a DNS TXT record to prove domain ownership",
        projectIdFormat: "example.com",
        requiresOAuth: false,
        recommended: true,
        badge: "Most Secure",
        popularity: 42,
    },
    {
        id: "tweet_zktls",
        name: "Tweet + zkTLS",
        description: "Tweet a code, prove it cryptographically (no X API needed)",
        projectIdFormat: "twitter_handle",
        requiresOAuth: false,
        recommended: true,
        badge: "No API Needed",
        popularity: 31,
    },
    {
        id: "agent_keypair",
        name: "Agent Key Pair",
        description: "Sign a challenge message to verify agent identity (no GitHub needed)",
        projectIdFormat: "agent_name",
        requiresOAuth: false,
        badge: "For Agents",
        popularity: 15,
    },
    {
        id: "github_file",
        name: "GitHub File",
        description: "Place a verification file in your GitHub repo",
        projectIdFormat: "owner/repo",
        requiresOAuth: false,
        popularity: 18,
    },
    {
        id: "domain_file",
        name: "Well-Known File",
        description: "Place a verification file on your website",
        projectIdFormat: "example.com",
        requiresOAuth: false,
        popularity: 12,
    },
    {
        id: "domain_meta",
        name: "HTML Meta Tag",
        description: "Add a meta tag to your website's <head>",
        projectIdFormat: "example.com",
        requiresOAuth: false,
        popularity: 8,
    },
    {
        id: "facebook_oauth",
        name: "Facebook Page",
        description: "Verify you admin a Facebook Page",
        projectIdFormat: "Page name or ID",
        requiresOAuth: true,
        popularity: 5,
    },
    {
        id: "instagram_graph",
        name: "Instagram Business",
        description: "Verify an Instagram Business/Creator account",
        projectIdFormat: "username",
        requiresOAuth: true,
        popularity: 4,
    },
];

/** Recommended methods shown prominently (Hick's Law) */
export const RECOMMENDED_METHODS = METHODS.filter((m) => m.recommended);

/** Additional methods collapsed by default */
export const OTHER_METHODS = METHODS.filter((m) => !m.recommended);

export const STEP_LABELS = ["Method", "Details", "Verify", "Stamp"];
