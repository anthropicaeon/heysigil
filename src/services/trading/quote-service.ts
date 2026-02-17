/**
 * Quote Service
 *
 * Fetches swap quotes from 0x API with caching.
 * Results are cached for 15 seconds to reduce API calls.
 */

import { ethers } from "ethers";
import { getEnv } from "../../config/env.js";
import { resolveToken, BASE_CHAIN_ID } from "../../config/tokens.js";
import { getErrorMessage } from "../../utils/errors.js";
import type { SwapQuote, QuoteResponse } from "./types.js";

// ─── Price Cache ────────────────────────────────────────

interface CachedQuote {
    quote: SwapQuote;
    fetchedAt: number;
}

const quoteCache = new Map<string, CachedQuote>();
const QUOTE_CACHE_TTL_MS = 15_000; // 15 seconds (reduced from 30s for volatile assets)

/**
 * Generate cache key for a quote request.
 */
function getQuoteCacheKey(fromSymbol: string, toSymbol: string, amount: string): string {
    return `${fromSymbol.toUpperCase()}:${toSymbol.toUpperCase()}:${amount}`;
}

/**
 * Clear expired cache entries (called periodically).
 */
function cleanupQuoteCache(): void {
    const now = Date.now();
    for (const [key, entry] of quoteCache.entries()) {
        if (now - entry.fetchedAt > QUOTE_CACHE_TTL_MS) {
            quoteCache.delete(key);
        }
    }
}

// Cleanup every minute
setInterval(cleanupQuoteCache, 60_000);

// ─── 0x API Integration ─────────────────────────────────

const ZEROX_BASE_URL = "https://base.api.0x.org";

/**
 * Get a swap quote from 0x API.
 * Results are cached for 15 seconds to reduce API calls.
 *
 * @param fromSymbol - Token to sell
 * @param toSymbol - Token to buy
 * @param amount - Amount to sell (human-readable)
 * @param options - Optional settings
 * @param options.bypassCache - Force fresh quote from API
 */
export async function getQuote(
    fromSymbol: string,
    toSymbol: string,
    amount: string,
    options?: { bypassCache?: boolean },
): Promise<SwapQuote | { error: string }> {
    const cacheKey = getQuoteCacheKey(fromSymbol, toSymbol, amount);

    // Check cache first (unless bypassed)
    if (!options?.bypassCache) {
        const cached = quoteCache.get(cacheKey);
        if (cached && Date.now() - cached.fetchedAt < QUOTE_CACHE_TTL_MS) {
            return cached.quote;
        }
    }

    const fromToken = resolveToken(fromSymbol);
    const toToken = resolveToken(toSymbol);

    if (!fromToken)
        return { error: `Unknown token: ${fromSymbol}. Try using a contract address instead.` };
    if (!toToken)
        return { error: `Unknown token: ${toSymbol}. Try using a contract address instead.` };

    const env = getEnv();
    const apiKey = env.ZEROX_API_KEY;

    // Parse amount to smallest unit
    let sellAmount: string;
    try {
        sellAmount = ethers.parseUnits(amount, fromToken.decimals).toString();
    } catch {
        return { error: `Invalid amount: ${amount}` };
    }

    const params = new URLSearchParams({
        sellToken: fromToken.address,
        buyToken: toToken.address,
        sellAmount,
        chainId: BASE_CHAIN_ID.toString(),
        slippagePercentage: "0.01", // 1% slippage tolerance
    });

    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["0x-api-key"] = apiKey;

        const response = await fetch(`${ZEROX_BASE_URL}/swap/v1/quote?${params}`, { headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = (errorData as { reason?: string })?.reason || response.statusText;
            return { error: `0x API error: ${errorMsg}` };
        }

        const data = (await response.json()) as QuoteResponse;

        const quote: SwapQuote = {
            fromToken: fromSymbol.toUpperCase(),
            toToken: toSymbol.toUpperCase(),
            fromAmount: amount,
            toAmount: data.buyAmount,
            toAmountFormatted: ethers.formatUnits(data.buyAmount, toToken.decimals),
            price: data.price,
            estimatedGas: data.estimatedGas,
            sources:
                data.sources?.filter((s) => parseFloat(s.proportion) > 0)?.map((s) => s.name) || [],
        };

        // Cache successful quote
        quoteCache.set(cacheKey, { quote, fetchedAt: Date.now() });

        return quote;
    } catch (err) {
        return { error: `Failed to get quote: ${getErrorMessage(err, "unknown")}` };
    }
}
