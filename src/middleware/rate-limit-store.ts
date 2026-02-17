/**
 * Rate Limit Store Abstraction
 *
 * Provides pluggable storage backends for rate limiting.
 * - InMemoryStore: Default, single-instance only
 * - RedisStore: Distributed, multi-instance support
 */

import { getEnv } from "../config/env.js";

// ─── Types ──────────────────────────────────────────────

export interface RateLimitEntry {
    count: number;
    resetAt: number;
}

export interface RateLimitStore {
    /**
     * Get and increment the rate limit counter atomically.
     * Creates a new entry if it doesn't exist.
     * Returns the updated entry.
     */
    increment(key: string, windowMs: number): Promise<RateLimitEntry>;

    /**
     * Get current entry without incrementing (for peek operations).
     */
    get(key: string): Promise<RateLimitEntry | null>;

    /**
     * Delete an entry (for testing).
     */
    delete(key: string): Promise<void>;

    /**
     * Clear all entries (for testing).
     */
    clear(): Promise<void>;

    /**
     * Get current store size (for monitoring).
     */
    size(): Promise<number>;

    /**
     * Cleanup expired entries (in-memory only, Redis uses TTL).
     */
    cleanup?(): void;

    /**
     * Graceful shutdown (close connections).
     */
    close?(): Promise<void>;
}

// ─── In-Memory Store ────────────────────────────────────

class InMemoryStore implements RateLimitStore {
    private store = new Map<string, RateLimitEntry>();
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;

    constructor() {
        // Periodic cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }

    async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
        const now = Date.now();
        let entry = this.store.get(key);

        // Reset if window has passed or no entry
        if (!entry || entry.resetAt < now) {
            entry = {
                count: 0,
                resetAt: now + windowMs,
            };
        }

        entry.count++;
        this.store.set(key, entry);

        return entry;
    }

    async get(key: string): Promise<RateLimitEntry | null> {
        const entry = this.store.get(key);
        if (!entry) return null;

        // Check if expired
        if (entry.resetAt < Date.now()) {
            this.store.delete(key);
            return null;
        }

        return entry;
    }

    async delete(key: string): Promise<void> {
        this.store.delete(key);
    }

    async clear(): Promise<void> {
        this.store.clear();
    }

    async size(): Promise<number> {
        return this.store.size;
    }

    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.resetAt < now) {
                this.store.delete(key);
            }
        }
    }

    async close(): Promise<void> {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
}

// ─── Redis Store ────────────────────────────────────────

/**
 * Redis-backed rate limit store using atomic INCR + EXPIRE.
 * Uses ioredis for connection management.
 */
class RedisStore implements RateLimitStore {
    // Using 'unknown' to avoid importing ioredis types at compile time
    // The actual type is Redis from ioredis
    private client: unknown = null;
    private connecting: Promise<void> | null = null;
    private keyPrefix = "ratelimit:";

    constructor(private redisUrl: string) {}

    private async ensureConnected(): Promise<RedisClientInterface> {
        if (this.client) return this.client as RedisClientInterface;

        if (this.connecting) {
            await this.connecting;
            return this.client as RedisClientInterface;
        }

        this.connecting = this.connect();
        await this.connecting;
        return this.client as RedisClientInterface;
    }

    private async connect(): Promise<void> {
        // Dynamic import to keep ioredis optional
        const ioredis = await import("ioredis");
        const Redis = ioredis.default;

        const client = new Redis(this.redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times: number) => {
                if (times > 3) return null; // Stop retrying
                return Math.min(times * 100, 1000);
            },
            lazyConnect: false,
        });

        // Wait for connection
        await new Promise<void>((resolve, reject) => {
            client.once("ready", () => resolve());
            client.once("error", (err: Error) => reject(err));
        });

        this.client = client;
        console.warn("[RateLimit] Redis connected");
    }

    async increment(key: string, windowMs: number): Promise<RateLimitEntry> {
        const client = await this.ensureConnected();
        const fullKey = this.keyPrefix + key;
        const now = Date.now();
        const ttlSeconds = Math.ceil(windowMs / 1000);

        // Use Lua script for atomic get-or-create + increment
        // This ensures accuracy under high concurrency
        const luaScript = `
            local current = redis.call('GET', KEYS[1])
            local resetAt = redis.call('GET', KEYS[1] .. ':reset')
            local now = tonumber(ARGV[1])
            local windowMs = tonumber(ARGV[2])
            local ttl = tonumber(ARGV[3])

            -- Check if expired or doesn't exist
            if not current or not resetAt or tonumber(resetAt) < now then
                -- Start new window
                redis.call('SET', KEYS[1], 1, 'EX', ttl)
                redis.call('SET', KEYS[1] .. ':reset', now + windowMs, 'EX', ttl)
                return {1, now + windowMs}
            else
                -- Increment existing
                local newCount = redis.call('INCR', KEYS[1])
                return {newCount, tonumber(resetAt)}
            end
        `;

        const result = (await client.eval(luaScript, 1, fullKey, now, windowMs, ttlSeconds)) as [
            number,
            number,
        ];

        return {
            count: result[0],
            resetAt: result[1],
        };
    }

    async get(key: string): Promise<RateLimitEntry | null> {
        const client = await this.ensureConnected();
        const fullKey = this.keyPrefix + key;

        const [count, resetAt] = await Promise.all([
            client.get(fullKey),
            client.get(fullKey + ":reset"),
        ]);

        if (!count || !resetAt) return null;

        const resetAtNum = Number.parseInt(resetAt, 10);
        if (resetAtNum < Date.now()) return null;

        return {
            count: Number.parseInt(count, 10),
            resetAt: resetAtNum,
        };
    }

    async delete(key: string): Promise<void> {
        const client = await this.ensureConnected();
        const fullKey = this.keyPrefix + key;
        await client.del(fullKey, fullKey + ":reset");
    }

    async clear(): Promise<void> {
        const client = await this.ensureConnected();
        // Scan and delete all rate limit keys
        let cursor = "0";
        do {
            const [nextCursor, keys] = await client.scan(
                cursor,
                "MATCH",
                this.keyPrefix + "*",
                "COUNT",
                "100",
            );
            cursor = nextCursor;
            if (keys.length > 0) {
                await client.del(...keys);
            }
        } while (cursor !== "0");
    }

    async size(): Promise<number> {
        const client = await this.ensureConnected();
        let count = 0;
        let cursor = "0";
        do {
            const [nextCursor, keys] = await client.scan(
                cursor,
                "MATCH",
                this.keyPrefix + "*:reset",
                "COUNT",
                "100",
            );
            cursor = nextCursor;
            count += keys.length;
        } while (cursor !== "0");
        return count;
    }

    async close(): Promise<void> {
        if (this.client) {
            await (this.client as RedisClientInterface).quit();
            this.client = null;
        }
    }
}

/**
 * Minimal interface for Redis operations we use.
 * Avoids importing full ioredis types at compile time.
 */
interface RedisClientInterface {
    get(key: string): Promise<string | null>;
    del(...keys: string[]): Promise<number>;
    eval(script: string, numKeys: number, ...args: (string | number)[]): Promise<unknown>;
    scan(cursor: string, ...args: (string | number)[]): Promise<[cursor: string, keys: string[]]>;
    quit(): Promise<"OK">;
}

// ─── Store Factory ──────────────────────────────────────

let _store: RateLimitStore | null = null;

/**
 * Get the rate limit store singleton.
 * Uses Redis if REDIS_URL is configured, otherwise falls back to in-memory.
 */
export function getRateLimitStore(): RateLimitStore {
    if (_store) return _store;

    const env = getEnv();

    if (env.REDIS_URL) {
        console.warn("[RateLimit] Using Redis store for distributed rate limiting");
        _store = new RedisStore(env.REDIS_URL);
    } else {
        console.warn("[RateLimit] Using in-memory store (single instance only)");
        _store = new InMemoryStore();
    }

    return _store;
}
