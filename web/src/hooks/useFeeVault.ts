"use client";

/**
 * Fee Vault Hook
 *
 * Reads on-chain fee balances and claims via server-side API.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";

import { FEE_VAULT_ABI, FEE_VAULT_ADDRESS, FEE_VAULT_ADDRESS_V1, publicClient, USDC_ADDRESS } from "@/config/contracts";
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
    /** Raw claimable bigint (USDC 6 dec) */
    claimableRaw: bigint;
    /** USDC lifetime earned */
    lifetimeUsdc: string;
    /** Raw lifetime earned bigint (USDC 6 dec) */
    lifetimeRaw: bigint;
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

// ─── Helper: read fees from a single vault ──────────────

async function readVaultFees(
    vaultAddress: `0x${string}`,
    wallet: `0x${string}`,
): Promise<{ usdc: bigint; lifetime: bigint; balances: FeeBalance[] }> {
    const [usdcBalance, usdcLifetime, [tokens, amounts]] = await Promise.all([
        publicClient.readContract({
            address: vaultAddress,
            abi: FEE_VAULT_ABI,
            functionName: "devFees",
            args: [wallet, USDC_ADDRESS],
        }),
        publicClient.readContract({
            address: vaultAddress,
            abi: FEE_VAULT_ABI,
            functionName: "totalDevFeesEarned",
            args: [wallet, USDC_ADDRESS],
        }),
        publicClient.readContract({
            address: vaultAddress,
            abi: FEE_VAULT_ABI,
            functionName: "getDevFeeBalances",
            args: [wallet],
        }),
    ]);

    const balances: FeeBalance[] = [];
    for (let i = 0; i < tokens.length; i++) {
        if (amounts[i] > BigInt(0)) {
            const isUsdc = tokens[i].toLowerCase() === USDC_ADDRESS.toLowerCase();
            balances.push({
                token: tokens[i],
                symbol: isUsdc ? "USDC" : tokens[i].slice(0, 6) + "...",
                balance: amounts[i],
                formatted: isUsdc
                    ? formatCurrency(amounts[i])
                    : formatUnits(amounts[i], 18),
            });
        }
    }

    return { usdc: usdcBalance as bigint, lifetime: usdcLifetime as bigint, balances };
}

// ─── Hook ───────────────────────────────────────────────

export function useFeeVault(walletAddress?: string): UseFeeVaultReturn {
    const [claimableUsdc, setClaimableUsdc] = useState("$0.00");
    const [claimableRaw, setClaimableRaw] = useState(BigInt(0));
    const [lifetimeUsdc, setLifetimeUsdc] = useState("$0.00");
    const [lifetimeRaw, setLifetimeRaw] = useState(BigInt(0));
    const [allBalances, setAllBalances] = useState<FeeBalance[]>([]);
    const [loading, setLoading] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);

    const privy = useOptionalPrivy();
    const isMounted = useRef(true);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // ── Fetch balances from both V2 + V1 vaults ──
    const refresh = useCallback(async () => {
        if (!walletAddress || FEE_VAULT_ADDRESS === "0x0000000000000000000000000000000000000000")
            return;

        setLoading(true);
        setError(null);

        try {
            const wallet = walletAddress as `0x${string}`;

            // Read from current vault (V3)
            const v2 = await readVaultFees(FEE_VAULT_ADDRESS, wallet);

            // Read from V1 vault (if configured)
            let v1 = { usdc: BigInt(0), lifetime: BigInt(0), balances: [] as FeeBalance[] };
            if (FEE_VAULT_ADDRESS_V1 && (FEE_VAULT_ADDRESS_V1 as string) !== "") {
                try {
                    v1 = await readVaultFees(FEE_VAULT_ADDRESS_V1, wallet);
                } catch {
                    // V1 vault read failed — that's fine, just use V2
                }
            }

            if (!isMounted.current) return;

            // Aggregate totals
            const totalUsdc = v2.usdc + v1.usdc;
            const totalLifetime = v2.lifetime + v1.lifetime;

            setClaimableUsdc(formatCurrency(totalUsdc));
            setClaimableRaw(totalUsdc);
            setLifetimeUsdc(formatCurrency(totalLifetime));
            setLifetimeRaw(totalLifetime);

            // Merge balances (combine same-token entries)
            const balanceMap = new Map<string, FeeBalance>();
            for (const b of [...v2.balances, ...v1.balances]) {
                const key = b.token.toLowerCase();
                const existing = balanceMap.get(key);
                if (existing) {
                    const combined = existing.balance + b.balance;
                    const isUsdc = key === USDC_ADDRESS.toLowerCase();
                    balanceMap.set(key, {
                        ...existing,
                        balance: combined,
                        formatted: isUsdc
                            ? formatCurrency(combined)
                            : formatUnits(combined, 18),
                    });
                } else {
                    balanceMap.set(key, b);
                }
            }
            setAllBalances(Array.from(balanceMap.values()));
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
        claimableRaw,
        lifetimeUsdc,
        lifetimeRaw,
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

