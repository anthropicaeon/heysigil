/**
 * VerifyFlow Constants
 */

import type { Method } from "./types";

export const METHODS: Method[] = [
    {
        id: "github_oauth",
        name: "GitHub OAuth",
        description: "Verify admin access to a GitHub repository",
        projectIdFormat: "owner/repo",
        requiresOAuth: true,
    },
    {
        id: "github_file",
        name: "GitHub File",
        description: "Place a verification file in your GitHub repo",
        projectIdFormat: "owner/repo",
        requiresOAuth: false,
    },
    {
        id: "domain_dns",
        name: "DNS TXT Record",
        description: "Add a DNS TXT record to prove domain ownership",
        projectIdFormat: "example.com",
        requiresOAuth: false,
    },
    {
        id: "domain_file",
        name: "Well-Known File",
        description: "Place a verification file on your website",
        projectIdFormat: "example.com",
        requiresOAuth: false,
    },
    {
        id: "domain_meta",
        name: "HTML Meta Tag",
        description: "Add a meta tag to your website's <head>",
        projectIdFormat: "example.com",
        requiresOAuth: false,
    },
    {
        id: "tweet_zktls",
        name: "Tweet + zkTLS",
        description: "Tweet a code, prove it cryptographically (no X API needed)",
        projectIdFormat: "twitter_handle",
        requiresOAuth: false,
    },
    {
        id: "facebook_oauth",
        name: "Facebook Page",
        description: "Verify you admin a Facebook Page",
        projectIdFormat: "Page name or ID",
        requiresOAuth: true,
    },
    {
        id: "instagram_graph",
        name: "Instagram Business",
        description: "Verify an Instagram Business/Creator account",
        projectIdFormat: "username",
        requiresOAuth: true,
    },
];

export const STEP_LABELS = ["Method", "Details", "Verify", "Stamp"];
