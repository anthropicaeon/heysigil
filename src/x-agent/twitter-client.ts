/**
 * Twitter API v2 Client
 *
 * Lightweight client for the X/Twitter API v2 using OAuth 1.0a.
 * No external dependencies — uses native crypto for HMAC-SHA1 signing.
 */

import { createHmac, randomBytes } from "node:crypto";

// ─── Types ──────────────────────────────────────────────

export interface TwitterCredentials {
    /** OAuth Consumer Key (API Key) */
    apiKey: string;
    /** OAuth Consumer Secret (API Secret) */
    apiSecret: string;
    /** OAuth Access Token */
    accessToken: string;
    /** OAuth Access Token Secret */
    accessTokenSecret: string;
}

export interface TwitterMention {
    id: string;
    text: string;
    author_id: string;
    created_at: string;
    conversation_id?: string;
    in_reply_to_user_id?: string;
    referenced_tweets?: Array<{ type: string; id: string }>;
    entities?: {
        urls?: Array<{
            url: string;
            expanded_url: string;
            display_url: string;
        }>;
    };
}

export interface TwitterUser {
    id: string;
    username: string;
    name: string;
}

export interface TweetPostResult {
    id: string;
    text: string;
}

// ─── Client ─────────────────────────────────────────────

export class TwitterClient {
    private readonly baseUrl = "https://api.twitter.com";

    constructor(private readonly creds: TwitterCredentials) { }

    /**
     * Get the authenticated user's info.
     */
    async getMe(): Promise<TwitterUser> {
        const res = await this.request("GET", "/2/users/me", {
            "user.fields": "id,username,name",
        });
        return res.data as TwitterUser;
    }

    /**
     * Get mentions for a user.
     * @param userId - The user's Twitter ID
     * @param sinceId - Only return tweets newer than this ID
     */
    async getMentions(
        userId: string,
        sinceId?: string,
    ): Promise<{ mentions: TwitterMention[]; newestId?: string }> {
        const params: Record<string, string> = {
            "tweet.fields": "author_id,created_at,conversation_id,in_reply_to_user_id,referenced_tweets,entities",
            max_results: "20",
        };
        if (sinceId) params.since_id = sinceId;

        const res = await this.request("GET", `/2/users/${userId}/mentions`, params);

        const mentions = (res.data || []) as TwitterMention[];
        const newestId = res.meta?.newest_id as string | undefined;

        return { mentions, newestId };
    }

    /**
     * Look up users by their IDs.
     */
    async getUsers(userIds: string[]): Promise<TwitterUser[]> {
        if (userIds.length === 0) return [];
        const res = await this.request("GET", `/2/users`, {
            ids: userIds.join(","),
            "user.fields": "id,username,name",
        });
        return (res.data || []) as TwitterUser[];
    }

    /**
     * Fetch a single tweet by ID.
     */
    async getTweet(tweetId: string): Promise<TwitterMention | null> {
        try {
            const res = await this.request("GET", `/2/tweets/${tweetId}`, {
                "tweet.fields": "author_id,created_at,conversation_id,in_reply_to_user_id,referenced_tweets,text,entities",
            });
            return (res.data || null) as TwitterMention | null;
        } catch {
            return null;
        }
    }

    /**
     * Search recent tweets mentioning the bot handle.
     * Catches mentions that the mention timeline misses (e.g. replies
     * where @BotHandle is a secondary mention, not the primary recipient).
     *
     * @param botHandle - Bot's handle WITHOUT the @ prefix
     * @param sinceId - Only return tweets newer than this ID
     */
    async searchMentions(
        botHandle: string,
        sinceId?: string,
    ): Promise<{ mentions: TwitterMention[]; newestId?: string }> {
        const params: Record<string, string> = {
            query: `@${botHandle} -is:retweet`,
            "tweet.fields": "author_id,created_at,conversation_id,in_reply_to_user_id,referenced_tweets,entities",
            max_results: "20",
        };
        if (sinceId) params.since_id = sinceId;

        try {
            const res = await this.request("GET", "/2/tweets/search/recent", params);
            const mentions = (res.data || []) as TwitterMention[];
            const newestId = res.meta?.newest_id as string | undefined;
            return { mentions, newestId };
        } catch (err) {
            // Search API might not be available on all plans — fail gracefully
            return { mentions: [] };
        }
    }

    /**
     * Post a tweet (or reply to a tweet).
     */
    async postTweet(text: string, replyToTweetId?: string): Promise<TweetPostResult> {
        const body: Record<string, unknown> = { text };
        if (replyToTweetId) {
            body.reply = { in_reply_to_tweet_id: replyToTweetId };
        }

        const res = await this.request("POST", "/2/tweets", undefined, body);
        return res.data as TweetPostResult;
    }

    // ─── OAuth 1.0a Request Signing ─────────────────────

    private async request(
        method: string,
        path: string,
        queryParams?: Record<string, string>,
        body?: Record<string, unknown>,
    ): Promise<{ data?: unknown; meta?: Record<string, unknown> }> {
        const url = new URL(path, this.baseUrl);
        if (queryParams) {
            for (const [key, value] of Object.entries(queryParams)) {
                url.searchParams.set(key, value);
            }
        }

        const headers: Record<string, string> = {
            Authorization: this.buildOAuthHeader(method, url),
        };

        const fetchOpts: RequestInit = { method, headers };

        if (body) {
            headers["Content-Type"] = "application/json";
            fetchOpts.body = JSON.stringify(body);
        }

        const res = await fetch(url.toString(), fetchOpts);

        if (!res.ok) {
            const errorBody = await res.text();
            throw new Error(`Twitter API ${res.status}: ${errorBody}`);
        }

        return res.json() as Promise<{ data?: unknown; meta?: Record<string, unknown> }>;
    }

    private buildOAuthHeader(method: string, url: URL): string {
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = randomBytes(16).toString("hex");

        const oauthParams: Record<string, string> = {
            oauth_consumer_key: this.creds.apiKey,
            oauth_nonce: nonce,
            oauth_signature_method: "HMAC-SHA1",
            oauth_timestamp: timestamp,
            oauth_token: this.creds.accessToken,
            oauth_version: "1.0",
        };

        // Collect all params for signature base
        const allParams = new Map<string, string>();
        for (const [k, v] of Object.entries(oauthParams)) {
            allParams.set(k, v);
        }
        for (const [k, v] of url.searchParams.entries()) {
            allParams.set(k, v);
        }

        // Sort params
        const sortedParams = Array.from(allParams.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
            .join("&");

        // Build base URL (without query params)
        const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;

        // Signature base string
        const signatureBase = [
            method.toUpperCase(),
            percentEncode(baseUrl),
            percentEncode(sortedParams),
        ].join("&");

        // Signing key
        const signingKey = `${percentEncode(this.creds.apiSecret)}&${percentEncode(this.creds.accessTokenSecret)}`;

        // HMAC-SHA1
        const signature = createHmac("sha1", signingKey)
            .update(signatureBase)
            .digest("base64");

        oauthParams.oauth_signature = signature;

        // Build Authorization header
        const headerParts = Object.entries(oauthParams)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${percentEncode(k)}="${percentEncode(v)}"`)
            .join(", ");

        return `OAuth ${headerParts}`;
    }
}

// ─── Helpers ────────────────────────────────────────────

function percentEncode(str: string): string {
    return encodeURIComponent(str).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}

// ─── t.co URL Expansion ────────────────────────────────

/**
 * Replace t.co shortened URLs in tweet text with their expanded URLs.
 * Twitter converts all links in tweets to t.co shortlinks; the original
 * URLs are available in entities.urls[].expanded_url.
 */
export function expandTcoUrls(tweet: TwitterMention): string {
    let text = tweet.text;
    if (!tweet.entities?.urls) return text;

    for (const urlEntity of tweet.entities.urls) {
        if (urlEntity.url && urlEntity.expanded_url) {
            text = text.replace(urlEntity.url, urlEntity.expanded_url);
        }
    }
    return text;
}
