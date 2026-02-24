/**
 * Thread Resolver
 *
 * When the bot is mentioned in a reply, walks up the reply chain to:
 * 1. Collect all tweet texts in the thread for link extraction
 * 2. Identify the thread root author as fallback fee destination
 *
 * Strategy:
 *   mention → parent tweet → grandparent → ... → thread root
 *   Scan ALL texts for GitHub repos / dev links.
 *   If none found, use thread root author's Twitter handle.
 */

import type { TwitterClient, TwitterMention, TwitterUser } from "./twitter-client.js";
import { expandTcoUrls } from "./twitter-client.js";
import { parseLinks, type ParsedLink } from "../utils/link-parser.js";

// ─── Types ──────────────────────────────────────────────

export interface ThreadContext {
    /** All tweet texts in the thread (from root to the mention), concatenated */
    threadTexts: string[];
    /** Dev links found anywhere in the thread */
    threadDevLinks: ParsedLink[];
    /** The thread root author's handle (without @) — fallback fee destination */
    threadRootAuthorHandle: string;
    /** The thread root author's Twitter user ID */
    threadRootAuthorId: string;
    /** The thread root tweet ID */
    threadRootTweetId: string;
    /** How many tweets deep the mention is */
    depth: number;
}

// ─── Resolver ───────────────────────────────────────────

const MAX_THREAD_DEPTH = 10; // Don't walk more than 10 levels up

/**
 * Resolve the full thread context for a mention tweet.
 *
 * Walks up the reply chain from the mention to the thread root,
 * collecting texts and looking for dev links at each level.
 *
 * @param mention - The mention tweet
 * @param client  - Twitter API client
 * @returns ThreadContext if the mention is a reply, null if it's a top-level tweet
 */
export async function resolveThread(
    mention: TwitterMention,
    client: TwitterClient,
): Promise<ThreadContext | null> {
    // Find the parent tweet ID from referenced_tweets
    const parentRef = mention.referenced_tweets?.find((r) => r.type === "replied_to");
    if (!parentRef) {
        // Not a reply — no thread to resolve
        return null;
    }

    const tweets: TwitterMention[] = [];
    let currentTweet: TwitterMention | null = mention;
    let depth = 0;

    // Walk up the reply chain
    while (currentTweet && depth < MAX_THREAD_DEPTH) {
        const parentId = currentTweet.referenced_tweets?.find(
            (r) => r.type === "replied_to",
        )?.id;

        if (!parentId) break;

        const parentTweet = await client.getTweet(parentId);
        if (!parentTweet) break;

        tweets.unshift(parentTweet); // prepend — we want root first
        currentTweet = parentTweet;
        depth++;
    }

    if (tweets.length === 0) return null;

    // The first tweet is the thread root
    const rootTweet = tweets[0];

    // Resolve root author handle
    let rootAuthorHandle = rootTweet.author_id; // fallback to ID
    try {
        const users = await client.getUsers([rootTweet.author_id]);
        if (users.length > 0) {
            rootAuthorHandle = users[0].username;
        }
    } catch {
        // Keep the ID as fallback
    }

    // Collect all texts (thread tweets + the mention itself), expanding t.co URLs
    const allTexts = [...tweets.map((t) => expandTcoUrls(t)), expandTcoUrls(mention)];

    // Scan all thread texts for dev links
    const allDevLinks: ParsedLink[] = [];
    const seenProjectIds = new Set<string>();

    for (const text of allTexts) {
        const links = parseLinks(text);
        for (const link of links) {
            if (!seenProjectIds.has(link.projectId)) {
                seenProjectIds.add(link.projectId);
                allDevLinks.push(link);
            }
        }
    }

    return {
        threadTexts: allTexts,
        threadDevLinks: allDevLinks,
        threadRootAuthorHandle: rootAuthorHandle,
        threadRootAuthorId: rootTweet.author_id,
        threadRootTweetId: rootTweet.id,
        depth,
    };
}
