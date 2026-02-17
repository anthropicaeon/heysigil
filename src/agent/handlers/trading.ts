/**
 * Trading Handlers - swap, bridge, price
 */

import type { ActionHandler } from "./types.js";
import { executeSwap, resolveToken } from "../../services/trading.js";
import { requireWallet } from "../helpers/wallet-check.js";
import { getCoinGeckoId } from "../../config/price-lookup.js";

export const swapHandler: ActionHandler = async (params, sessionId) => {
    const { fromToken, toToken, amount } = params;
    const from = String(fromToken || "");
    const to = String(toToken || "");
    const amt = String(amount || "");

    if (!from || !to || !amt) {
        return {
            success: false,
            message: 'Please specify what to swap. Example: "swap 0.01 ETH to USDC"',
        };
    }

    // Ensure user has a wallet
    const walletCheck = await requireWallet(sessionId, {
        action: "swap tokens",
        createPrompt:
            'Say **"show my wallet"** to create one and get your deposit address. Fund it with ETH, then try swapping again.',
    });
    if (!walletCheck.ok) return walletCheck.result;

    // Check if tokens are known
    const fromResolved = resolveToken(from);
    const toResolved = resolveToken(to);
    if (!fromResolved)
        return {
            success: false,
            message: `Unknown token: ${from}. Try using a contract address (0x...) instead.`,
        };
    if (!toResolved)
        return {
            success: false,
            message: `Unknown token: ${to}. Try using a contract address (0x...) instead.`,
        };

    // Execute the swap
    const result = await executeSwap(walletCheck.sessionId, from, to, amt);

    if (result.success) {
        return {
            success: true,
            message: [
                `✅ **Swap Executed!**`,
                "",
                `${amt} ${from.toUpperCase()} → ${result.toAmount} ${to.toUpperCase()}`,
                "",
                `🔗 [View on BaseScan](${result.explorerUrl})`,
                "",
                `Tx: \`${result.txHash}\``,
            ].join("\n"),
            data: { ...result },
        };
    } else {
        return {
            success: false,
            message: `❌ Swap failed: ${result.error}`,
            data: { ...result },
        };
    }
};

export const bridgeHandler: ActionHandler = async (params) => {
    const { token, amount, fromChain, toChain } = params;
    return {
        success: true,
        message: `Bridge ${amount} ${token} from ${fromChain} → ${toChain}.\n\n🚧 Cross-chain bridging is coming soon. For now, you can swap tokens on Base.`,
        data: { token, amount, fromChain, toChain, status: "coming_soon" },
    };
};

export const priceHandler: ActionHandler = async (params) => {
    const { token } = params;
    const tokenStr = String(token || "eth").toLowerCase();
    const coinId = getCoinGeckoId(tokenStr);

    try {
        const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`,
        );
        const data = (await res.json()) as Record<string, { usd: number; usd_24h_change: number }>;
        const priceData = data[coinId];

        if (!priceData) {
            return {
                success: false,
                message: `Couldn't find price for "${token}". Try a common token like ETH, BTC, SOL, or USDC.`,
            };
        }

        const price = priceData.usd;
        const change24h = priceData.usd_24h_change;
        const changeStr = change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`;
        const emoji = change24h >= 0 ? "📈" : "📉";

        return {
            success: true,
            message: `${emoji} **${String(token).toUpperCase()}**: $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}\n24h change: ${changeStr}`,
            data: { token: tokenStr, price, change24h, source: "coingecko" },
        };
    } catch {
        return {
            success: false,
            message: `Failed to fetch price for ${token}. CoinGecko API may be rate-limited, try again in a moment.`,
        };
    }
};
