/**
 * X Agent Orchestrator
 *
 * Main run loop that ties together polling, parsing, launching, and replying.
 * Includes idempotency guards, per-author rate limiting, and thread resolution.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import type { XAgentConfig } from "./config.js";
import type { MentionPoller, XMention } from "./mention-poller.js";
import { parseTweet, joinThreadTexts, isLaunchable, type TweetLaunchIntent } from "./tweet-parser.js";
import {
    formatLaunchReply,
    formatNeedsInfoReply,
    formatDryRunReply,
    type LaunchResult,
} from "./reply-formatter.js";
import type { TwitterClient, TwitterMention } from "./twitter-client.js";
import { resolveThread } from "./thread-resolver.js";
import { parseLink, type ParsedLink } from "../utils/link-parser.js";

// ─── Types ──────────────────────────────────────────────

export interface PendingReply {
    tweetId: string;
    authorHandle: string;
    replyText: string;
    launchResult?: LaunchResult;
}

export interface OrchestratorStats {
    totalProcessed: number;
    totalLaunched: number;
    totalSkipped: number;
    totalErrors: number;
}

type LaunchFn = (params: {
    devLinks: string[];
    name: string;
    symbol: string;
    description?: string;
}) => Promise<LaunchResult>;

// ─── Orchestrator ───────────────────────────────────────

export class XAgentOrchestrator {
    private processedTweetIds: Set<string>;
    private authorLaunchTimes: Map<string, number[]> = new Map();
    private stats: OrchestratorStats = {
        totalProcessed: 0,
        totalLaunched: 0,
        totalSkipped: 0,
        totalErrors: 0,
    };

    constructor(
        private readonly config: XAgentConfig,
        private readonly poller: MentionPoller,
        private readonly launchFn: LaunchFn,
        private readonly log: (level: string, msg: string, data?: Record<string, unknown>) => void = defaultLogger,
        private readonly twitterClient?: TwitterClient,
    ) {
        this.processedTweetIds = this.loadProcessedIds();
    }

    /**
     * Run one poll cycle: fetch mentions → parse → launch → format replies.
     * Returns an array of replies to be posted by OpenClaw.
     */
    async tick(): Promise<PendingReply[]> {
        const mentions = await this.poller.poll();
        if (mentions.length === 0) return [];

        this.log("info", `Processing ${mentions.length} mention(s)`);

        const replies: PendingReply[] = [];

        for (const mention of mentions) {
            // Skip already-processed tweets
            if (this.processedTweetIds.has(mention.tweetId)) {
                this.log("debug", `Skipping already-processed tweet ${mention.tweetId}`);
                continue;
            }

            try {
                const reply = await this.processMention(mention);
                if (reply) replies.push(reply);
            } catch (err) {
                this.stats.totalErrors++;
                this.log("error", `Error processing tweet ${mention.tweetId}`, {
                    error: err instanceof Error ? err.message : String(err),
                });
            }

            // Mark as processed regardless of success/failure
            this.processedTweetIds.add(mention.tweetId);
            this.poller.markProcessed(mention.tweetId);
            this.stats.totalProcessed++;
        }

        // Persist processed IDs
        this.saveProcessedIds();

        return replies;
    }

    /**
     * Process a single mention → resolve thread → parse → validate → launch → reply.
     */
    private async processMention(mention: XMention): Promise<PendingReply | null> {
        // ── Thread resolution ───────────────────────────
        // If this mention is a reply, walk up the thread to find:
        //   1. GitHub repos or dev links in any parent tweet
        //   2. The thread root author as fallback fee destination
        let threadDevLinks: ParsedLink[] = [];
        let threadRootHandle: string | null = null;

        if (this.twitterClient && mention.inReplyToTweetId) {
            try {
                // Build a TwitterMention-shaped object for the resolver
                const mentionAsTweet: TwitterMention = {
                    id: mention.tweetId,
                    text: mention.text,
                    author_id: "", // not needed for resolution
                    created_at: mention.timestamp,
                    referenced_tweets: [{ type: "replied_to", id: mention.inReplyToTweetId }],
                };

                const thread = await resolveThread(mentionAsTweet, this.twitterClient);
                if (thread) {
                    threadDevLinks = thread.threadDevLinks;
                    threadRootHandle = thread.threadRootAuthorHandle;
                    this.log("info", `Thread resolved: depth=${thread.depth}, links=${threadDevLinks.length}, root=@${threadRootHandle}`);
                }
            } catch (err) {
                this.log("warn", `Thread resolution failed for ${mention.tweetId}`, {
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }

        // ── Parse the mention tweet ─────────────────────
        const text = mention.threadTexts
            ? joinThreadTexts(mention.threadTexts)
            : mention.text;

        const intent = parseTweet(
            text,
            mention.tweetId,
            mention.authorHandle,
            this.config.botHandle,
        );

        if (!intent) {
            this.log("debug", `No launch intent in tweet ${mention.tweetId}`);
            this.stats.totalSkipped++;
            return null;
        }

        // ── Enrich with thread-sourced dev links ────────
        // Full fallback chain:
        //   1. Explicit links in the mention tweet (highest priority)
        //   2. Links found in thread parent tweets
        //   3. Thread root author's Twitter handle
        //   4. Mention author's Twitter handle (last resort)

        if (intent.devLinks.length === 0 && threadDevLinks.length > 0) {
            intent.devLinks = threadDevLinks;
            this.log("info", `Using ${threadDevLinks.length} dev link(s) from thread`);
        }

        if (intent.devLinks.length === 0 && threadRootHandle) {
            const rootLink = parseLink(`https://x.com/${threadRootHandle}`, "twitter");
            if (rootLink) {
                intent.devLinks = [rootLink];
                this.log("info", `Using thread root author @${threadRootHandle} as fee destination`);
            }
        }

        if (intent.devLinks.length === 0) {
            const authorLink = parseLink(`https://x.com/${mention.authorHandle}`, "twitter");
            if (authorLink) {
                intent.devLinks = [authorLink];
                this.log("info", `Using mention author @${mention.authorHandle} as fee destination (last resort)`);
            }
        }

        // Prioritize: GitHub/domain links first (real projects), Twitter handles last
        intent.devLinks = prioritizeDevLinks(intent.devLinks);

        // Check if the intent has enough info
        if (!isLaunchable(intent)) {
            this.log("info", `Incomplete launch intent in tweet ${mention.tweetId}`);
            const missing: string[] = [];
            if (!intent.tokenSymbol && !intent.tokenName) missing.push("token name or $TICKER");
            if (intent.devLinks.length === 0) missing.push("a project link");

            return {
                tweetId: mention.tweetId,
                authorHandle: mention.authorHandle,
                replyText: formatNeedsInfoReply(mention.authorHandle, missing),
            };
        }

        // Rate limit check
        if (this.isRateLimited(mention.authorHandle)) {
            this.log("warn", `Rate limited author @${mention.authorHandle}`);
            this.stats.totalSkipped++;
            return null;
        }

        // Dry run mode
        if (this.config.dryRun) {
            this.log("info", `DRY RUN: Would launch ${intent.tokenSymbol || intent.tokenName}`);
            return {
                tweetId: mention.tweetId,
                authorHandle: mention.authorHandle,
                replyText: formatDryRunReply(
                    mention.authorHandle,
                    intent.tokenName,
                    intent.tokenSymbol,
                    intent.devLinks.map((l) => ({ platform: l.platform, projectId: l.projectId })),
                ),
            };
        }

        // Launch the token!
        const result = await this.executeLaunch(intent);
        this.recordAuthorLaunch(mention.authorHandle);

        return {
            tweetId: mention.tweetId,
            authorHandle: mention.authorHandle,
            replyText: formatLaunchReply(result, mention.authorHandle),
            launchResult: result,
        };
    }

    /**
     * Execute the actual token launch via the Sigil backend.
     */
    private async executeLaunch(intent: TweetLaunchIntent): Promise<LaunchResult> {
        const name = intent.tokenName || intent.tokenSymbol || "Token";
        const symbol = intent.tokenSymbol || generateSymbolFromName(name);

        try {
            const result = await this.launchFn({
                devLinks: intent.devLinks.map((l) => l.displayUrl),
                name,
                symbol,
                description: `Launched via @${this.config.botHandle} by @${intent.authorHandle}`,
            });

            this.stats.totalLaunched++;
            this.log("info", `Launched $${symbol}`, {
                tokenAddress: result.tokenAddress,
                status: result.status,
            });

            return result;
        } catch (err) {
            this.stats.totalErrors++;
            const errorMsg = err instanceof Error ? err.message : String(err);
            this.log("error", `Launch failed for $${symbol}: ${errorMsg}`);

            return {
                success: false,
                tokenName: name,
                tokenSymbol: symbol,
                error: errorMsg,
                status: "failed",
            };
        }
    }

    // ─── Rate Limiting ──────────────────────────────────

    private isRateLimited(authorHandle: string): boolean {
        const times = this.authorLaunchTimes.get(authorHandle) || [];
        const cutoff = Date.now() - 15 * 60 * 1000; // 15-minute window
        const recentLaunches = times.filter((t) => t > cutoff);
        return recentLaunches.length >= this.config.maxLaunchesPerAuthor24h;
    }

    private recordAuthorLaunch(authorHandle: string): void {
        const times = this.authorLaunchTimes.get(authorHandle) || [];
        times.push(Date.now());
        // Keep only last 15 min
        const cutoff = Date.now() - 15 * 60 * 1000;
        this.authorLaunchTimes.set(
            authorHandle,
            times.filter((t) => t > cutoff),
        );
    }

    // ─── Persistence ────────────────────────────────────

    private loadProcessedIds(): Set<string> {
        try {
            if (existsSync(this.config.processedStorePath)) {
                const data = readFileSync(this.config.processedStorePath, "utf-8");
                const ids = JSON.parse(data) as string[];
                return new Set(ids);
            }
        } catch {
            // Corrupted file, start fresh
        }
        return new Set();
    }

    private saveProcessedIds(): void {
        try {
            const ids = Array.from(this.processedTweetIds);
            // Keep only last 10,000 IDs to avoid unbounded growth
            const trimmed = ids.slice(-10_000);
            writeFileSync(this.config.processedStorePath, JSON.stringify(trimmed, null, 2));
        } catch (err) {
            this.log("error", "Failed to save processed IDs", {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    // ─── Stats ──────────────────────────────────────────

    getStats(): OrchestratorStats {
        return { ...this.stats };
    }
}

// ─── Helpers ────────────────────────────────────────────

/** Platform priority for devLinks — lower = higher priority */
const PLATFORM_PRIORITY: Record<string, number> = {
    github: 0,
    domain: 1,
    instagram: 2,
    twitter: 3,
};

/**
 * Sort devLinks so GitHub/domain links come first (they represent real projects)
 * and Twitter handles sort to the back (they're just fee routing fallbacks).
 * This ensures the primary link (first element) determines the projectId correctly.
 */
function prioritizeDevLinks(links: ParsedLink[]): ParsedLink[] {
    if (links.length <= 1) return links;
    return [...links].sort(
        (a, b) => (PLATFORM_PRIORITY[a.platform] ?? 99) - (PLATFORM_PRIORITY[b.platform] ?? 99),
    );
}

function generateSymbolFromName(name: string): string {
    // Take first letters of each word, uppercase, max 6 chars
    const words = name.split(/\s+/).filter(Boolean);
    if (words.length === 1) {
        return words[0].slice(0, 6).toUpperCase();
    }
    return words
        .map((w) => w[0])
        .join("")
        .slice(0, 6)
        .toUpperCase();
}

function defaultLogger(level: string, msg: string, data?: Record<string, unknown>): void {
    const prefix = `[x-agent:${level}]`;
    if (data) {
        console.log(prefix, msg, data);
    } else {
        console.log(prefix, msg);
    }
}
