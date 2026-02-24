/**
 * Mention Poller — Twitter API v2
 *
 * Polls the bot's mention timeline via the Twitter API, tracking
 * the newest tweet ID for efficient pagination.
 */

import { TwitterClient, expandTcoUrls, type TwitterMention, type TwitterUser } from "./twitter-client.js";

// ─── Types ──────────────────────────────────────────────

export interface XMention {
    tweetId: string;
    authorHandle: string;
    text: string;
    timestamp: string;
    inReplyToTweetId?: string;
    threadTexts?: string[];
}

export interface MentionPoller {
    poll(): Promise<XMention[]>;
    markProcessed(tweetId: string): void;
}

// ─── Twitter API Poller ─────────────────────────────────

export class TwitterApiPoller implements MentionPoller {
    private searchSinceId: string | undefined;
    private processed = new Set<string>();
    private botHandle: string;
    private userCache = new Map<string, string>(); // author_id → handle

    constructor(
        private readonly client: TwitterClient,
        botHandle?: string,
    ) {
        this.botHandle = botHandle?.replace(/^@/, "") || "HeySigilBot";
    }

    async poll(): Promise<XMention[]> {
        const { mentions, newestId } = await this.client.searchMentions(
            this.botHandle,
            this.searchSinceId,
        );

        if (newestId) {
            this.searchSinceId = newestId;
        }

        if (mentions.length === 0) return [];

        // Resolve author handles
        const unknownAuthorIds = mentions
            .map((m) => m.author_id)
            .filter((id) => !this.userCache.has(id))
            .filter((id, i, arr) => arr.indexOf(id) === i);

        if (unknownAuthorIds.length > 0) {
            const users = await this.client.getUsers(unknownAuthorIds);
            for (const user of users) {
                this.userCache.set(user.id, user.username);
            }
        }

        // Convert to XMention format
        const result: XMention[] = [];
        for (const mention of mentions) {
            if (this.processed.has(mention.id)) continue;

            const authorHandle = this.userCache.get(mention.author_id) || mention.author_id;
            const expandedText = expandTcoUrls(mention);

            result.push({
                tweetId: mention.id,
                authorHandle,
                text: expandedText,
                timestamp: mention.created_at,
                inReplyToTweetId: mention.referenced_tweets?.find(
                    (r) => r.type === "replied_to",
                )?.id,
            });
        }

        return result;
    }

    markProcessed(tweetId: string): void {
        this.processed.add(tweetId);
    }
}

// ─── Mock Poller (for testing) ──────────────────────────

export class MockPoller implements MentionPoller {
    private mentions: XMention[] = [];
    private processed = new Set<string>();

    feed(mentions: XMention[]): void {
        this.mentions.push(...mentions);
    }

    async poll(): Promise<XMention[]> {
        const unprocessed = this.mentions.filter((m) => !this.processed.has(m.tweetId));
        this.mentions = [];
        return unprocessed;
    }

    markProcessed(tweetId: string): void {
        this.processed.add(tweetId);
    }
}
