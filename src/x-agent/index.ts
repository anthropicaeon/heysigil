/**
 * X Agent — Entry Point (Twitter API v2)
 *
 * Self-contained service that polls Twitter for @mentions,
 * launches tokens via the Sigil backend, and replies with results.
 *
 * Run: bun src/x-agent/index.ts
 * Deploy: add as a Railway service
 */

import { loadXAgentConfig } from "./config.js";
import { TwitterClient } from "./twitter-client.js";
import { TwitterApiPoller } from "./mention-poller.js";
import { XAgentOrchestrator } from "./orchestrator.js";
import type { LaunchResult } from "./reply-formatter.js";

// ─── Sigil Backend Launch Function ──────────────────────

function createLaunchFn(sigilApiUrl: string, mcpToken: string | null) {
    return async (params: {
        devLinks: string[];
        name: string;
        symbol: string;
        description?: string;
    }): Promise<LaunchResult> => {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        if (mcpToken) {
            headers["Authorization"] = `Bearer ${mcpToken}`;
        }

        // Ensure devLinks are valid URLs (schema requires z.string().url())
        const normalizedLinks = params.devLinks.map((link) => {
            if (link.startsWith("http://") || link.startsWith("https://")) return link;
            return `https://${link}`;
        });

        const res = await fetch(`${sigilApiUrl}/api/launch`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                name: params.name,
                symbol: params.symbol,
                description: params.description,
                devLinks: normalizedLinks,
            }),
        });

        const data = (await res.json()) as Record<string, unknown>;

        if (!res.ok) {
            // 409 = project already has a deployed token — not really an error
            if (res.status === 409) {
                const token = (data.token || {}) as Record<string, string>;
                const project = (data.project || {}) as Record<string, string>;
                return {
                    success: true,
                    tokenName: project.name || params.name,
                    tokenSymbol: project.symbol || params.symbol,
                    tokenAddress: token.address,
                    poolId: token.poolId,
                    txHash: token.txHash,
                    explorerUrl: token.explorerUrl,
                    dexUrl: token.dexUrl,
                    status: "already_launched",
                };
            }

            return {
                success: false,
                tokenName: params.name,
                tokenSymbol: params.symbol,
                error: (data.error as string) || `HTTP ${res.status}`,
                status: "failed",
            };
        }

        // Response uses nested structure: { project: {...}, token: {...}, ... }
        const token = (data.token || {}) as Record<string, string>;
        const project = (data.project || {}) as Record<string, string>;

        return {
            success: true,
            tokenName: project.name || params.name,
            tokenSymbol: project.symbol || params.symbol,
            tokenAddress: token.address,
            poolId: token.poolId,
            txHash: token.txHash,
            explorerUrl: token.explorerUrl,
            dexUrl: token.dexUrl,
            status: data.deployed ? "deployed" : "registered",
        };
    };
}

// ─── Logger ─────────────────────────────────────────────

function log(level: string, msg: string, data?: Record<string, unknown>) {
    const ts = new Date().toISOString();
    const prefix = `[${ts}] [x-agent:${level}]`;
    if (data) {
        console.log(prefix, msg, JSON.stringify(data));
    } else {
        console.log(prefix, msg);
    }
}

// ─── Main ───────────────────────────────────────────────

async function main() {
    log("info", "Starting X agent (Twitter API v2 mode)...");

    const config = loadXAgentConfig();
    log("info", `Bot handle: @${config.botHandle}`);
    log("info", `Sigil API: ${config.sigilApiUrl}`);
    log("info", `Dry run: ${config.dryRun}`);
    log("info", `Poll interval: ${config.pollIntervalMs}ms`);

    // Initialize Twitter client
    const twitter = new TwitterClient(config.twitter);
    const me = await twitter.getMe();
    log("info", `Authenticated as @${me.username} (ID: ${me.id})`);

    // Initialize poller
    const poller = new TwitterApiPoller(twitter, config.botHandle);

    // Create launch function
    const launchFn = createLaunchFn(config.sigilApiUrl, config.mcpToken);

    // Create orchestrator (with twitter client for thread resolution)
    const orchestrator = new XAgentOrchestrator(config, poller, launchFn, log, twitter);

    // Main poll loop
    log("info", "Entering poll loop...");

    const tick = async () => {
        try {
            const replies = await orchestrator.tick();

            // Post replies to Twitter
            for (const reply of replies) {
                if (config.dryRun) {
                    log("info", `DRY RUN — would reply to ${reply.tweetId}:`, {
                        text: reply.replyText.slice(0, 100),
                    });
                    continue;
                }

                try {
                    const posted = await twitter.postTweet(reply.replyText, reply.tweetId);
                    log("info", `Replied to tweet ${reply.tweetId}`, {
                        replyId: posted.id,
                        author: reply.authorHandle,
                    });
                } catch (err) {
                    log("error", `Failed to reply to tweet ${reply.tweetId}`, {
                        error: err instanceof Error ? err.message : String(err),
                    });
                }

                // Small delay between replies to avoid rate limits
                await sleep(2000);
            }

            if (replies.length > 0) {
                const stats = orchestrator.getStats();
                log("info", "Tick complete", {
                    replies: replies.length,
                    totalLaunched: stats.totalLaunched,
                    totalProcessed: stats.totalProcessed,
                });
            }
        } catch (err) {
            log("error", "Tick failed", {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    };

    // Run first tick immediately
    await tick();

    // Then poll on interval
    const interval = setInterval(tick, config.pollIntervalMs);

    // Graceful shutdown
    const shutdown = () => {
        log("info", "Shutting down X agent...");
        clearInterval(interval);
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run
main().catch((err) => {
    log("error", "Fatal error", { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
});

export { main, createLaunchFn };
