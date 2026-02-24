/**
 * DexScreener Market Data Service
 *
 * Batch-fetches market cap and 24h volume from the free DexScreener API.
 * Results are cached in-memory for 60 seconds to stay within rate limits.
 */

interface DexPair {
    baseToken: { address: string; symbol: string; name: string };
    quoteToken: { address: string; symbol: string };
    marketCap?: number;
    fdv?: number;
    volume?: { h24?: number };
    liquidity?: { usd?: number };
    priceUsd?: string;
}

export interface MarketData {
    marketCap: number | null;
    volume24h: number | null;
}

// ─── In-Memory Cache ───────────────────────────────────

const CACHE_TTL_MS = 60_000; // 60 seconds

interface CacheEntry {
    data: MarketData;
    expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached(address: string): MarketData | null {
    const entry = cache.get(address.toLowerCase());
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(address.toLowerCase());
        return null;
    }
    return entry.data;
}

function setCache(address: string, data: MarketData): void {
    cache.set(address.toLowerCase(), {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS,
    });
}

// ─── Public API ────────────────────────────────────────

/**
 * Batch-fetch market data for multiple token addresses on Base.
 * DexScreener supports up to 30 comma-separated addresses per request.
 *
 * Returns a Map keyed by lowercase token address.
 */
export async function batchFetchMarketData(
    addresses: string[],
): Promise<Map<string, MarketData>> {
    const result = new Map<string, MarketData>();
    const uncached: string[] = [];

    // Check cache first
    for (const addr of addresses) {
        const cached = getCached(addr);
        if (cached) {
            result.set(addr.toLowerCase(), cached);
        } else {
            uncached.push(addr);
        }
    }

    if (uncached.length === 0) return result;

    // DexScreener allows up to 30 addresses per request
    const BATCH_SIZE = 30;
    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
        const batch = uncached.slice(i, i + BATCH_SIZE);
        try {
            const url = `https://api.dexscreener.com/tokens/v1/base/${batch.join(",")}`;
            const res = await fetch(url, {
                signal: AbortSignal.timeout(8_000),
                headers: { Accept: "application/json" },
            });

            if (!res.ok) {
                // Graceful fallback — set nulls for this batch
                for (const addr of batch) {
                    const fallback: MarketData = { marketCap: null, volume24h: null };
                    result.set(addr.toLowerCase(), fallback);
                    setCache(addr, fallback);
                }
                continue;
            }

            const pairs: DexPair[] = await res.json();

            // Group pairs by base token address — pick highest-liquidity pair per token
            const bestByToken = new Map<string, DexPair>();
            for (const pair of pairs) {
                const key = pair.baseToken.address.toLowerCase();
                const existing = bestByToken.get(key);
                const existingLiq = existing?.liquidity?.usd ?? 0;
                const currentLiq = pair.liquidity?.usd ?? 0;
                if (!existing || currentLiq > existingLiq) {
                    bestByToken.set(key, pair);
                }
            }

            for (const addr of batch) {
                const pair = bestByToken.get(addr.toLowerCase());
                const data: MarketData = {
                    marketCap: pair?.marketCap ?? pair?.fdv ?? null,
                    volume24h: pair?.volume?.h24 ?? null,
                };
                result.set(addr.toLowerCase(), data);
                setCache(addr, data);
            }
        } catch {
            // Network error — graceful fallback
            for (const addr of batch) {
                const fallback: MarketData = { marketCap: null, volume24h: null };
                result.set(addr.toLowerCase(), fallback);
                setCache(addr, fallback);
            }
        }
    }

    return result;
}
