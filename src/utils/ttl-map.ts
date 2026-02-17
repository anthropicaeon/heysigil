/**
 * TTLMap - A Map with automatic expiration and garbage collection.
 *
 * Features:
 * - Entries expire after a configurable TTL
 * - Automatic background cleanup at configurable intervals
 * - Lazy cleanup on access (expired entries removed on get)
 * - Optional onExpire callback for cleanup logic
 * - Memory-efficient for long-running processes
 */

export interface TTLMapOptions<V> {
    /** Time-to-live in milliseconds */
    ttlMs: number;
    /** Cleanup interval in milliseconds (default: ttlMs or 60000, whichever is larger) */
    cleanupIntervalMs?: number;
    /** Callback when an entry expires */
    onExpire?: (key: string, value: V) => void;
    /** Optional name for logging */
    name?: string;
}

interface TTLEntry<V> {
    value: V;
    expiresAt: number;
}

export class TTLMap<V> {
    private store = new Map<string, TTLEntry<V>>();
    private readonly ttlMs: number;
    private readonly onExpire?: (key: string, value: V) => void;
    private readonly name: string;
    private cleanupTimer: ReturnType<typeof setInterval> | null = null;

    constructor(options: TTLMapOptions<V>) {
        this.ttlMs = options.ttlMs;
        this.onExpire = options.onExpire;
        this.name = options.name || "TTLMap";

        // Start background cleanup
        const cleanupInterval = options.cleanupIntervalMs ?? Math.max(options.ttlMs, 60_000);
        this.cleanupTimer = setInterval(() => this.cleanup(), cleanupInterval);

        // Prevent timer from keeping process alive
        if (this.cleanupTimer.unref) {
            this.cleanupTimer.unref();
        }
    }

    /**
     * Set a value with automatic expiration.
     */
    set(key: string, value: V): this {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs,
        });
        return this;
    }

    /**
     * Get a value. Returns undefined if expired or not found.
     * Expired entries are removed on access (lazy cleanup).
     */
    get(key: string): V | undefined {
        const entry = this.store.get(key);
        if (!entry) return undefined;

        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            this.onExpire?.(key, entry.value);
            return undefined;
        }

        return entry.value;
    }

    /**
     * Check if a key exists and is not expired.
     */
    has(key: string): boolean {
        return this.get(key) !== undefined;
    }

    /**
     * Delete an entry.
     */
    delete(key: string): boolean {
        return this.store.delete(key);
    }

    /**
     * Get remaining TTL for an entry in milliseconds.
     * Returns 0 if expired or not found.
     */
    ttl(key: string): number {
        const entry = this.store.get(key);
        if (!entry) return 0;
        return Math.max(0, entry.expiresAt - Date.now());
    }

    /**
     * Refresh the TTL for an existing entry.
     * Returns true if entry exists, false otherwise.
     */
    touch(key: string): boolean {
        const entry = this.store.get(key);
        if (!entry || Date.now() > entry.expiresAt) {
            return false;
        }
        entry.expiresAt = Date.now() + this.ttlMs;
        return true;
    }

    /**
     * Get current size (includes potentially expired entries).
     */
    get size(): number {
        return this.store.size;
    }

    /**
     * Run cleanup manually. Removes all expired entries.
     * Returns number of entries removed.
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;

        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) {
                this.store.delete(key);
                this.onExpire?.(key, entry.value);
                removed++;
            }
        }

        return removed;
    }

    /**
     * Clear all entries.
     */
    clear(): void {
        this.store.clear();
    }

    /**
     * Stop background cleanup. Call this when done with the map.
     */
    destroy(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.store.clear();
    }

    /**
     * Iterate over non-expired entries.
     */
    *entries(): Generator<[string, V]> {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now <= entry.expiresAt) {
                yield [key, entry.value];
            }
        }
    }

    /**
     * Get all non-expired keys.
     */
    *keys(): Generator<string> {
        for (const [key] of this.entries()) {
            yield key;
        }
    }

    /**
     * Get all non-expired values.
     */
    *values(): Generator<V> {
        for (const [, value] of this.entries()) {
            yield value;
        }
    }
}

// ─── Pre-configured TTL Maps ────────────────────────────

/** 2 minute TTL - for short-lived confirmations */
export function createShortTTLMap<V>(options?: Partial<TTLMapOptions<V>>): TTLMap<V> {
    return new TTLMap({
        ttlMs: 2 * 60 * 1000,
        cleanupIntervalMs: 60_000,
        ...options,
    });
}

/** 24 hour TTL - for chat sessions, daily caches */
export function createDayTTLMap<V>(options?: Partial<TTLMapOptions<V>>): TTLMap<V> {
    return new TTLMap({
        ttlMs: 24 * 60 * 60 * 1000,
        cleanupIntervalMs: 60 * 60 * 1000,
        ...options,
    });
}
