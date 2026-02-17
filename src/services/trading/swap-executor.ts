/**
 * Swap Executor
 *
 * Executes token swaps on Base via 0x Swap API.
 * Uses the custodial wallet from wallet.ts to sign and broadcast.
 */

import { ethers } from "ethers";
import { getSignerWallet } from "../wallet.js";
import { getEnv } from "../../config/env.js";
import { resolveToken, NATIVE_ETH_ADDRESS, BASE_CHAIN_ID } from "../../config/tokens.js";
import { getErrorMessage } from "../../utils/errors.js";
import { ensureApproval } from "./erc20-approval.js";
import type { SwapResult, SwapTransaction } from "./types.js";

const ZEROX_BASE_URL = "https://base.api.0x.org";

/**
 * Execute a swap using the session's custodial wallet.
 */
export async function executeSwap(
    sessionId: string,
    fromSymbol: string,
    toSymbol: string,
    amount: string,
): Promise<SwapResult> {
    const wallet = await getSignerWallet(sessionId);
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
    const isNativeETH = fromToken.address === NATIVE_ETH_ADDRESS;

    try {
        // Get the full swap transaction from 0x
        const params = new URLSearchParams({
            sellToken: fromToken.address,
            buyToken: toToken.address,
            sellAmount,
            takerAddress: wallet.address,
            chainId: BASE_CHAIN_ID.toString(),
            slippagePercentage: "0.01", // 1% slippage tolerance
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

        const quoteData = (await response.json()) as SwapTransaction;

        // Approve ERC-20 spending if needed
        if (!isNativeETH && quoteData.allowanceTarget) {
            await ensureApproval(
                wallet,
                fromToken.address,
                quoteData.allowanceTarget,
                BigInt(sellAmount),
            );
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
        const msg = getErrorMessage(err);

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
