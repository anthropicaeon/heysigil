"use client";

/**
 * Fee Vault Hook
 *
 * Reads on-chain fee balances and claims via server-side API.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";

import { FEE_VAULT_ABI, FEE_VAULT_ADDRESS, publicClient, USDC_ADDRESS } from "@/config/contracts";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";
import { formatCurrency } from "@/lib/format";

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
    /** Gas funding in progress */
    fundingGas: boolean;
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

// ─── Hook ───────────────────────────────────────────────

export function useFeeVault(walletAddress?: string): UseFeeVaultReturn {
    const [claimableUsdc, setClaimableUsdc] = useState("$0.00");
    const [lifetimeUsdc, setLifetimeUsdc] = useState("$0.00");
    const [allBalances, setAllBalances] = useState<FeeBalance[]>([]);
    const [loading, setLoading] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [fundingGas, setFundingGas] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);

    const privy = useOptionalPrivy();
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // ── Fetch balances ──
    const refresh = useCallback(async () => {
        if (!walletAddress || FEE_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000")
            return;

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

            setClaimableUsdc(formatCurrency(usdcBalance));
            setLifetimeUsdc(formatCurrency(usdcLifetime));

            const feeBalances: FeeBalance[] = [];
            for (let i = 0; i < tokens.length; i++) {
                if (balances[i] > BigInt(0)) {
                    const isUsdc = tokens[i].toLowerCase() === USDC_ADDRESS.toLowerCase();
                    feeBalances.push({
                        token: tokens[i],
                        symbol: isUsdc ? "USDC" : tokens[i].slice(0, 6) + "...",
                        balance: balances[i],
                        formatted: isUsdc
                            ? formatCurrency(balances[i])
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

    // ── Fund gas before claim ──
    const fundGas = useCallback(async () => {
        setFundingGas(true);
        try {
            const token = await privy?.getAccessToken?.();
            if (!token) {
                throw new Error("Not authenticated — sign in to claim fees");
            }
            const result = await apiClient.fees.claimGas(token);
            if (!result.funded) {
                throw new Error("Failed to fund gas");
            }
            // Wait a moment for the gas tx to propagate
            if (!result.alreadyFunded) {
                await new Promise((r) => setTimeout(r, 2000));
            }
        } finally {
            setFundingGas(false);
        }
    }, [privy]);

    // ── Server-side claim helper ──
    const claimViaBackend = useCallback(
        async (token?: string) => {
            const accessToken = await privy?.getAccessToken?.();
            if (!accessToken) {
                throw new Error("Not authenticated — sign in to claim fees");
            }
            const result = await apiClient.fees.claim(accessToken, token);
            if (!result.success) {
                throw new Error(result.error || "Claim failed");
            }
            setLastTxHash(result.txHash);
            // Refresh balances after claim
            await refresh();
        },
        [privy, refresh],
    );

    // ── Claim USDC ──
    const claimUsdc = useCallback(async () => {
        setClaiming(true);
        setError(null);
        try {
            // Backend auto-funds gas + signs claim tx
            await claimViaBackend(USDC_ADDRESS);
        } catch (err) {
            setError(getErrorMessage(err, "Claim failed"));
        } finally {
            setClaiming(false);
        }
    }, [claimViaBackend]);

    // ── Claim All ──
    const claimAll = useCallback(async () => {
        setClaiming(true);
        setError(null);
        try {
            // Backend auto-funds gas + signs claim tx
            await claimViaBackend();
        } catch (err) {
            setError(getErrorMessage(err, "Claim failed"));
        } finally {
            setClaiming(false);
        }
    }, [claimViaBackend]);

    return {
        claimableUsdc,
        lifetimeUsdc,
        allBalances,
        loading,
        claiming,
        fundingGas,
        error,
        lastTxHash,
        claimUsdc,
        claimAll,
        refresh,
    };
}

