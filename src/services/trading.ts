/**
 * Trading Service
 *
 * Executes token swaps on Base via 0x Swap API.
 * Uses the custodial wallet from wallet.ts to sign and broadcast.
 *
 * Flow:
 * 1. User: "swap 0.01 ETH to USDC"
 * 2. Get quote from 0x API
 * 3. Sign and broadcast via session wallet
 * 4. Return tx hash + result
 */

import { ethers } from "ethers";
import { getSignerWallet } from "./wallet.js";
import { getEnv } from "../config/env.js";
import { resolveToken, NATIVE_ETH_ADDRESS, BASE_CHAIN_ID } from "../config/tokens.js";

// Re-export resolveToken for backwards compatibility
export { resolveToken };

// ─── Types ──────────────────────────────────────────────

export interface SwapQuote {
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount: string;
    toAmountFormatted: string;
    price: string;
    estimatedGas: string;
    sources: string[];
}

export interface SwapResult {
    success: boolean;
    txHash?: string;
    fromToken: string;
    toToken: string;
    fromAmount: string;
    toAmount?: string;
    explorerUrl?: string;
    error?: string;
}

// ─── Price Cache ────────────────────────────────────────

interface CachedQuote {
    quote: SwapQuote;
    fetchedAt: number;
}

const quoteCache = new Map<string, CachedQuote>();
const QUOTE_CACHE_TTL_MS = 30_000; // 30 seconds

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
 * Results are cached for 30 seconds to reduce API calls.
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

        const data = (await response.json()) as {
            buyAmount: string;
            price: string;
            estimatedGas: string;
            sources: { name: string; proportion: string }[];
        };

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
        return { error: `Failed to get quote: ${err instanceof Error ? err.message : "unknown"}` };
    }
}

/**
 * Execute a swap using the session's custodial wallet.
 */
export async function executeSwap(
    sessionId: string,
    fromSymbol: string,
    toSymbol: string,
    amount: string,
): Promise<SwapResult> {
    const wallet = getSignerWallet(sessionId);
    if (!wallet) {
        return {
            success: false,
            fromToken: fromSymbol,
            toToken: toSymbol,
            fromAmount: amount,
            error: "No wallet found. Start a chat session first.",
        };
    }

    const fromToken = resolveToken(fromSymbol);
    const toToken = resolveToken(toSymbol);

    if (!fromToken)
        return {
            success: false,
            fromToken: fromSymbol,
            toToken: toSymbol,
            fromAmount: amount,
            error: `Unknown token: ${fromSymbol}`,
        };
    if (!toToken)
        return {
            success: false,
            fromToken: fromSymbol,
            toToken: toSymbol,
            fromAmount: amount,
            error: `Unknown token: ${toSymbol}`,
        };

    // Parse amount
    let sellAmount: string;
    try {
        sellAmount = ethers.parseUnits(amount, fromToken.decimals).toString();
    } catch {
        return {
            success: false,
            fromToken: fromSymbol,
            toToken: toSymbol,
            fromAmount: amount,
            error: `Invalid amount: ${amount}`,
        };
    }

    const env = getEnv();
    const apiKey = env.ZEROX_API_KEY;

    // If selling an ERC-20, check allowance + approve if needed
    const isNativeETH = fromToken.address === NATIVE_ETH_ADDRESS;

    try {
        // Get the full swap transaction from 0x
        const params = new URLSearchParams({
            sellToken: fromToken.address,
            buyToken: toToken.address,
            sellAmount,
            takerAddress: wallet.address,
            chainId: BASE_CHAIN_ID.toString(),
        });

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (apiKey) headers["0x-api-key"] = apiKey;

        const response = await fetch(`${ZEROX_BASE_URL}/swap/v1/quote?${params}`, { headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                success: false,
                fromToken: fromSymbol,
                toToken: toSymbol,
                fromAmount: amount,
                error: `Swap quote failed: ${(errorData as { reason?: string })?.reason || response.statusText}`,
            };
        }

        const quoteData = (await response.json()) as {
            to: string;
            data: string;
            value: string;
            gas: string;
            gasPrice: string;
            buyAmount: string;
            allowanceTarget?: string;
        };

        // Approve ERC-20 spending if needed
        if (!isNativeETH && quoteData.allowanceTarget) {
            const erc20 = new ethers.Contract(
                fromToken.address,
                [
                    "function allowance(address, address) view returns (uint256)",
                    "function approve(address, uint256) returns (bool)",
                ],
                wallet,
            );

            const currentAllowance = await erc20.allowance(
                wallet.address,
                quoteData.allowanceTarget,
            );
            if (currentAllowance < BigInt(sellAmount)) {
                const approveTx = await erc20.approve(quoteData.allowanceTarget, ethers.MaxUint256);
                await approveTx.wait(1);
            }
        }

        // Execute the swap
        const tx = await wallet.sendTransaction({
            to: quoteData.to,
            data: quoteData.data,
            value: isNativeETH ? BigInt(quoteData.value || "0") : 0n,
            gasLimit: BigInt(quoteData.gas || "500000"),
        });

        const receipt = await tx.wait(1);

        return {
            success: true,
            txHash: receipt?.hash || tx.hash,
            fromToken: fromSymbol.toUpperCase(),
            toToken: toSymbol.toUpperCase(),
            fromAmount: amount,
            toAmount: ethers.formatUnits(quoteData.buyAmount, toToken.decimals),
            explorerUrl: `https://basescan.org/tx/${receipt?.hash || tx.hash}`,
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";

        // Common error cases
        if (msg.includes("insufficient funds")) {
            return {
                success: false,
                fromToken: fromSymbol,
                toToken: toSymbol,
                fromAmount: amount,
                error: "Insufficient funds. Deposit more ETH to your wallet to cover this swap + gas.",
            };
        }

        return {
            success: false,
            fromToken: fromSymbol,
            toToken: toSymbol,
            fromAmount: amount,
            error: `Swap failed: ${msg}`,
        };
    }
}

// ─── Cache Utilities (monitoring/testing) ───────────────

/** Get current cache size */
export function getQuoteCacheSize(): number {
    return quoteCache.size;
}

/** Clear all cached quotes */
export function clearQuoteCache(): void {
    quoteCache.clear();
}

/** Get cache TTL in milliseconds */
export function getQuoteCacheTTL(): number {
    return QUOTE_CACHE_TTL_MS;
}
