/**
 * X Agent Configuration
 *
 * Environment-based config for the Twitter API-driven token launcher.
 */

import { z } from "zod";

const envSchema = z.object({
    // Twitter API OAuth 1.0a credentials
    TWITTER_API_KEY: z.string().min(1),
    TWITTER_API_SECRET: z.string().min(1),
    TWITTER_ACCESS_TOKEN: z.string().min(1),
    TWITTER_ACCESS_TOKEN_SECRET: z.string().min(1),

    // X Agent settings
    X_AGENT_BOT_HANDLE: z.string().min(1).default("HeySigilBot"),
    X_AGENT_POLL_INTERVAL_MS: z.coerce.number().int().min(5000).default(30_000),
    X_AGENT_SIGIL_API_URL: z.string().url().default("https://heysigil-production.up.railway.app"),
    X_AGENT_MCP_TOKEN: z.string().min(1).optional(),
    X_AGENT_DRY_RUN: z
        .enum(["true", "false"])
        .transform((v) => v === "true")
        .default("false"),
    X_AGENT_MAX_LAUNCHES_PER_AUTHOR_24H: z.coerce.number().int().min(1).default(1),
    X_AGENT_PROCESSED_STORE_PATH: z.string().default("./x-agent-processed.json"),
    X_AGENT_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export interface XAgentConfig {
    /** Twitter API credentials */
    twitter: {
        apiKey: string;
        apiSecret: string;
        accessToken: string;
        accessTokenSecret: string;
    };
    /** The bot's Twitter handle (without @) */
    botHandle: string;
    /** Polling interval in milliseconds */
    pollIntervalMs: number;
    /** Sigil backend API URL */
    sigilApiUrl: string;
    /** MCP PAT for authenticated API calls */
    mcpToken: string | null;
    /** If true, parse and format but don't actually launch tokens */
    dryRun: boolean;
    /** Max token launches per author per 24 hours */
    maxLaunchesPerAuthor24h: number;
    /** Path to file storing processed tweet IDs */
    processedStorePath: string;
    /** Log level */
    logLevel: "debug" | "info" | "warn" | "error";
}

export function loadXAgentConfig(env: NodeJS.ProcessEnv = process.env): XAgentConfig {
    const parsed = envSchema.parse(env);

    return {
        twitter: {
            apiKey: parsed.TWITTER_API_KEY,
            apiSecret: parsed.TWITTER_API_SECRET,
            accessToken: parsed.TWITTER_ACCESS_TOKEN,
            accessTokenSecret: parsed.TWITTER_ACCESS_TOKEN_SECRET,
        },
        botHandle: parsed.X_AGENT_BOT_HANDLE.replace(/^@/, ""),
        pollIntervalMs: parsed.X_AGENT_POLL_INTERVAL_MS,
        sigilApiUrl: parsed.X_AGENT_SIGIL_API_URL,
        mcpToken: parsed.X_AGENT_MCP_TOKEN ?? null,
        dryRun: parsed.X_AGENT_DRY_RUN,
        maxLaunchesPerAuthor24h: parsed.X_AGENT_MAX_LAUNCHES_PER_AUTHOR_24H,
        processedStorePath: parsed.X_AGENT_PROCESSED_STORE_PATH,
        logLevel: parsed.X_AGENT_LOG_LEVEL,
    };
}
