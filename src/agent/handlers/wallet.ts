/**
 * Wallet Handlers - balance, deposit, export_key, send, history
 */

import type { ActionHandler } from "./types.js";
import {
    createWallet,
    hasWallet,
    getAddress,
    getBalance as getWalletBalance,
    getSignerWallet,
    requestExport,
    confirmExport,
    hasPendingExport,
} from "../../services/wallet.js";
import { resolveToken } from "../../services/trading.js";
import { getEnv } from "../../config/env.js";

export const balanceHandler: ActionHandler = async (_params, sessionId) => {
    if (!sessionId || !hasWallet(sessionId)) {
        return {
            success: true,
            message:
                'You don\'t have a wallet yet. Say **"show my wallet"** to create one and get your deposit address.',
            data: { status: "no_wallet" },
        };
    }

    const address = getAddress(sessionId);
    const balance = await getWalletBalance(sessionId);

    if (!balance) {
        return { success: false, message: "Failed to fetch balance. Please try again." };
    }

    const lines = [
        `💰 **Your Wallet Balance**`,
        "",
        `Address: \`${address}\``,
        "",
        `**ETH:** ${balance.ethFormatted} ETH`,
    ];

    if (balance.tokens.length > 0) {
        lines.push("");
        for (const t of balance.tokens) {
            lines.push(`**${t.symbol}:** ${t.formatted}`);
        }
    }

    if (parseFloat(balance.ethFormatted) === 0 && balance.tokens.length === 0) {
        lines.push(
            "",
            "Your wallet is empty. Send ETH or tokens to the address above to get started.",
        );
    }

    return {
        success: true,
        message: lines.join("\n"),
        data: { address, ...balance },
    };
};

export const depositHandler: ActionHandler = async (_params, sessionId) => {
    if (!sessionId) return { success: false, message: "Session error." };

    const walletInfo = createWallet(sessionId);

    return {
        success: true,
        message: [
            "🏦 **Your Sigil Wallet**",
            "",
            `Address: \`${walletInfo.address}\``,
            "",
            "**To fund your wallet**, send ETH (on Base) to the address above.",
            "",
            "You can send from:",
            "• Coinbase → withdraw ETH to Base",
            "• MetaMask → send to this address on Base network",
            "• Any exchange that supports Base",
            "",
            "Once funded, you can:",
            '• **"swap 0.01 ETH to USDC"** — trade tokens',
            '• **"what\'s my balance"** — check your funds',
            '• **"send 10 USDC to 0x..."** — transfer tokens',
            '• **"export my private key"** — take full control of your wallet',
        ].join("\n"),
        data: { address: walletInfo.address },
    };
};

export const exportKeyHandler: ActionHandler = async (params, sessionId) => {
    if (!sessionId) return { success: false, message: "Session error." };

    if (!hasWallet(sessionId)) {
        return {
            success: false,
            message: 'You don\'t have a wallet yet. Say **"show my wallet"** to create one.',
        };
    }

    // Check if this is a confirmation of a pending export
    const rawText = String(params.rawText || "").toLowerCase();
    const isConfirm = rawText.includes("yes") && rawText.includes("export");

    if (isConfirm && hasPendingExport(sessionId)) {
        const result = confirmExport(sessionId);
        return {
            success: result.success,
            message: result.message,
            data: result.success ? { exported: true } : undefined,
        };
    }

    // First request — show warning
    const result = requestExport(sessionId);
    return {
        success: true,
        message: result.message,
        data: { pending: true },
    };
};

export const sendHandler: ActionHandler = async (params, sessionId) => {
    const { token, amount, toAddress } = params;
    const to = String(toAddress || "");
    const amt = String(amount || "");
    const tkn = String(token || "ETH");

    if (!to || !amt) {
        return {
            success: false,
            message: 'Please specify amount and recipient. Example: "send 0.01 ETH to 0x1234..."',
        };
    }

    if (!sessionId || !hasWallet(sessionId)) {
        return {
            success: false,
            message: 'You need a wallet first. Say **"show my wallet"** to create one.',
        };
    }

    const wallet = getSignerWallet(sessionId);
    if (!wallet) return { success: false, message: "Wallet error. Please try again." };

    try {
        const { ethers } = await import("ethers");

        if (tkn.toUpperCase() === "ETH") {
            const tx = await wallet.sendTransaction({
                to,
                value: ethers.parseEther(amt),
            });
            const receipt = await tx.wait(1);
            return {
                success: true,
                message: [
                    `✅ **Sent ${amt} ETH** to \`${to.slice(0, 10)}...${to.slice(-8)}\``,
                    "",
                    `🔗 [View on BaseScan](https://basescan.org/tx/${receipt?.hash || tx.hash})`,
                ].join("\n"),
                data: { txHash: receipt?.hash || tx.hash },
            };
        } else {
            // ERC-20 transfer
            const resolved = resolveToken(tkn);
            if (!resolved) return { success: false, message: `Unknown token: ${tkn}` };

            const erc20 = new ethers.Contract(
                resolved.address,
                ["function transfer(address, uint256) returns (bool)"],
                wallet,
            );
            const value = ethers.parseUnits(amt, resolved.decimals);
            const tx = await erc20.transfer(to, value);
            const receipt = await tx.wait(1);
            return {
                success: true,
                message: [
                    `✅ **Sent ${amt} ${tkn.toUpperCase()}** to \`${to.slice(0, 10)}...${to.slice(-8)}\``,
                    "",
                    `🔗 [View on BaseScan](https://basescan.org/tx/${receipt?.hash || tx.hash})`,
                ].join("\n"),
                data: { txHash: receipt?.hash || tx.hash },
            };
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        if (msg.includes("insufficient funds")) {
            return {
                success: false,
                message: "Insufficient funds. Deposit more ETH to cover this transfer + gas.",
            };
        }
        return { success: false, message: `Transfer failed: ${msg}` };
    }
};

// ─── Transaction History ────────────────────────────────

interface BasescanTx {
    hash: string;
    from: string;
    to: string;
    value: string;
    timeStamp: string;
    isError: string;
    functionName?: string;
}

interface BasescanResponse {
    status: string;
    message: string;
    result: BasescanTx[] | string;
}

export const historyHandler: ActionHandler = async (params, sessionId) => {
    if (!sessionId || !hasWallet(sessionId)) {
        return {
            success: true,
            message: 'You don\'t have a wallet yet. Say **"show my wallet"** to create one.',
            data: { status: "no_wallet" },
        };
    }

    const address = getAddress(sessionId);
    if (!address) {
        return { success: false, message: "Failed to get wallet address." };
    }

    const limit = Math.min(Number(params.limit) || 10, 25);

    try {
        const env = getEnv();
        const apiKey = env.BASESCAN_API_KEY || "";

        // Fetch recent transactions from Basescan API
        const url = new URL("https://api.basescan.org/api");
        url.searchParams.set("module", "account");
        url.searchParams.set("action", "txlist");
        url.searchParams.set("address", address);
        url.searchParams.set("startblock", "0");
        url.searchParams.set("endblock", "99999999");
        url.searchParams.set("page", "1");
        url.searchParams.set("offset", String(limit));
        url.searchParams.set("sort", "desc");
        if (apiKey) {
            url.searchParams.set("apikey", apiKey);
        }

        const response = await fetch(url.toString());
        const data = (await response.json()) as BasescanResponse;

        if (data.status !== "1" || typeof data.result === "string") {
            // "No transactions found" returns status "0" with message
            if (data.message === "No transactions found") {
                return {
                    success: true,
                    message: [
                        "📜 **Transaction History**",
                        "",
                        `Address: \`${address}\``,
                        "",
                        "No transactions yet. Send or receive funds to see activity here.",
                    ].join("\n"),
                    data: { address, transactions: [] },
                };
            }
            return {
                success: false,
                message: `Failed to fetch transaction history: ${data.message}`,
            };
        }

        const transactions = data.result;

        if (transactions.length === 0) {
            return {
                success: true,
                message: [
                    "📜 **Transaction History**",
                    "",
                    `Address: \`${address}\``,
                    "",
                    "No transactions yet. Send or receive funds to see activity here.",
                ].join("\n"),
                data: { address, transactions: [] },
            };
        }

        // Format transactions
        const { ethers } = await import("ethers");
        const lines = ["📜 **Recent Transactions**", "", `Address: \`${address}\``, ""];

        const formattedTxs = transactions.slice(0, limit).map((tx) => {
            const isIncoming = tx.to.toLowerCase() === address.toLowerCase();
            const direction = isIncoming ? "⬇️ IN" : "⬆️ OUT";
            const otherParty = isIncoming ? tx.from : tx.to;
            const value = ethers.formatEther(tx.value);
            const date = new Date(Number(tx.timeStamp) * 1000);
            const dateStr = date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
            const status = tx.isError === "1" ? "❌" : "✅";

            return {
                direction,
                value,
                otherParty,
                dateStr,
                status,
                hash: tx.hash,
            };
        });

        for (const tx of formattedTxs) {
            const shortAddr = `${tx.otherParty.slice(0, 6)}...${tx.otherParty.slice(-4)}`;
            lines.push(
                `${tx.status} ${tx.direction} **${tx.value} ETH** ${tx.direction.includes("IN") ? "from" : "to"} \`${shortAddr}\``,
            );
            lines.push(`   ${tx.dateStr} • [View](https://basescan.org/tx/${tx.hash})`);
            lines.push("");
        }

        lines.push(`[View all on BaseScan](https://basescan.org/address/${address})`);

        return {
            success: true,
            message: lines.join("\n"),
            data: {
                address,
                transactions: formattedTxs.map((tx) => ({
                    hash: tx.hash,
                    direction: tx.direction.includes("IN") ? "in" : "out",
                    value: tx.value,
                    otherParty: tx.otherParty,
                    date: tx.dateStr,
                })),
            },
        };
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return { success: false, message: `Failed to fetch history: ${msg}` };
    }
};
