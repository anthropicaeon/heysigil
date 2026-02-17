"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { formatUnits, encodeFunctionData } from "viem";
import {
    publicClient,
    FEE_VAULT_ABI,
    FEE_VAULT_ADDRESS,
    USDC_ADDRESS,
} from "@/config/contracts";
import { getErrorMessage } from "@/lib/errors";

// ─── Types ──────────────────────────────────────────────

interface FeeBalance {
    token: string;
    symbol: string;
    balance: bigint;
    formatted: string;
}

interface UseFeeVaultReturn {
    /** USDC claimable right now */
    claimableUsdc: string;
    /** USDC lifetime earned */
    lifetimeUsdc: string;
    /** All token balances (if dev has fees in multiple tokens) */
    allBalances: FeeBalance[];
    /** Loading state for reads */
    loading: boolean;
    /** Claiming tx in progress */
    claiming: boolean;
    /** Last error message */
    error: string | null;
    /** Last successful claim tx hash */
    lastTxHash: string | null;
    /** Claim USDC fees */
    claimUsdc: () => Promise<void>;
    /** Claim all fee tokens */
    claimAll: () => Promise<void>;
    /** Refresh balances */
    refresh: () => Promise<void>;
}

// ─── Helpers ────────────────────────────────────────────

function formatUsdc(raw: bigint): string {
    const num = parseFloat(formatUnits(raw, 6));
    if (num === 0) return "$0.00";
    if (num < 0.01) return "<$0.01";
    return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Try to get Privy wallets — returns null if not configured
function useOptionalWallets() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useWallets } = require("@privy-io/react-auth");
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useWallets();
    } catch {
        return null;
    }
}

// ─── Hook ───────────────────────────────────────────────

export function useFeeVault(walletAddress?: string): UseFeeVaultReturn {
    const [claimableUsdc, setClaimableUsdc] = useState("$0.00");
    const [lifetimeUsdc, setLifetimeUsdc] = useState("$0.00");
    const [allBalances, setAllBalances] = useState<FeeBalance[]>([]);
    const [loading, setLoading] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);

    const walletsData = useOptionalWallets();
    const isMounted = useRef(true);

    useEffect(() => {
        return () => { isMounted.current = false; };
    }, []);

    // ── Fetch balances ──
    const refresh = useCallback(async () => {
        if (!walletAddress || FEE_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000") return;

        setLoading(true);
        setError(null);

        try {
            // Read USDC claimable
            const usdcBalance = await publicClient.readContract({
                address: FEE_VAULT_ADDRESS,
                abi: FEE_VAULT_ABI,
                functionName: "devFees",
                args: [walletAddress as `0x${string}`, USDC_ADDRESS],
            });

            // Read lifetime USDC
            const usdcLifetime = await publicClient.readContract({
                address: FEE_VAULT_ADDRESS,
                abi: FEE_VAULT_ABI,
                functionName: "totalDevFeesEarned",
                args: [walletAddress as `0x${string}`, USDC_ADDRESS],
            });

            // Read all token balances
            const [tokens, balances] = await publicClient.readContract({
                address: FEE_VAULT_ADDRESS,
                abi: FEE_VAULT_ABI,
                functionName: "getDevFeeBalances",
                args: [walletAddress as `0x${string}`],
            });

            if (!isMounted.current) return;

            setClaimableUsdc(formatUsdc(usdcBalance));
            setLifetimeUsdc(formatUsdc(usdcLifetime));

            const feeBalances: FeeBalance[] = [];
            for (let i = 0; i < tokens.length; i++) {
                if (balances[i] > BigInt(0)) {
                    const isUsdc = tokens[i].toLowerCase() === USDC_ADDRESS.toLowerCase();
                    feeBalances.push({
                        token: tokens[i],
                        symbol: isUsdc ? "USDC" : tokens[i].slice(0, 6) + "...",
                        balance: balances[i],
                        formatted: isUsdc
                            ? formatUsdc(balances[i])
                            : formatUnits(balances[i], 18), // assume 18 dec for non-USDC
                    });
                }
            }
            setAllBalances(feeBalances);
        } catch (err) {
            if (isMounted.current) {
                setError(getErrorMessage(err, "Failed to read fees"));
            }
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [walletAddress]);

    // Auto-fetch on mount and wallet change
    useEffect(() => {
        refresh();
    }, [refresh]);

    // ── Get wallet provider for writes ──
    const getProvider = useCallback(async () => {
        if (!walletsData?.wallets?.length) {
            throw new Error("No wallet connected");
        }

        // Find the embedded wallet or first available
        const wallet =
            walletsData.wallets.find(
                (w: { walletClientType: string }) => w.walletClientType === "privy"
            ) ?? walletsData.wallets[0];

        // Switch to Base if needed
        await wallet.switchChain(8453); // Base mainnet

        const provider = await wallet.getEthereumProvider();
        return { provider, address: wallet.address };
    }, [walletsData]);

    // ── Send transaction helper ──
    const sendTx = useCallback(
        async (data: `0x${string}`) => {
            const { provider, address } = await getProvider();

            const txHash = await provider.request({
                method: "eth_sendTransaction",
                params: [
                    {
                        from: address,
                        to: FEE_VAULT_ADDRESS,
                        data,
                    },
                ],
            });

            setLastTxHash(txHash as string);

            // Wait for confirmation
            await publicClient.waitForTransactionReceipt({
                hash: txHash as `0x${string}`,
            });

            // Refresh balances after claim
            await refresh();
        },
        [getProvider, refresh]
    );

    // ── Claim USDC ──
    const claimUsdc = useCallback(async () => {
        setClaiming(true);
        setError(null);
        try {
            const data = encodeFunctionData({
                abi: FEE_VAULT_ABI,
                functionName: "claimDevFees",
                args: [USDC_ADDRESS],
            });
            await sendTx(data);
        } catch (err) {
            setError(getErrorMessage(err, "Claim failed"));
        } finally {
            setClaiming(false);
        }
    }, [sendTx]);

    // ── Claim All ──
    const claimAll = useCallback(async () => {
        setClaiming(true);
        setError(null);
        try {
            const data = encodeFunctionData({
                abi: FEE_VAULT_ABI,
                functionName: "claimAllDevFees",
            });
            await sendTx(data);
        } catch (err) {
            setError(getErrorMessage(err, "Claim failed"));
        } finally {
            setClaiming(false);
        }
    }, [sendTx]);

    return {
        claimableUsdc,
        lifetimeUsdc,
        allBalances,
        loading,
        claiming,
        error,
        lastTxHash,
        claimUsdc,
        claimAll,
        refresh,
    };
}
