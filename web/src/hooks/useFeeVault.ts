"use client";

/**
 * Fee Vault Hook
 *
 * Manages on-chain fee vault reads and claims.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { encodeFunctionData, formatUnits } from "viem";

import { FEE_VAULT_ABI, FEE_VAULT_ADDRESS, publicClient, USDC_ADDRESS } from "@/config/contracts";
import { useOptionalPrivy, useOptionalWallets } from "@/hooks/useOptionalPrivy";
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

    const walletsData = useOptionalWallets();
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

    // ── Get wallet provider for writes ──
    const getProvider = useCallback(async () => {
        if (!walletsData?.wallets?.length) {
            throw new Error("No wallet connected");
        }

        // Find the embedded wallet or first available
        const wallet =
            walletsData.wallets.find(
                (w: { walletClientType: string }) => w.walletClientType === "privy",
            ) ?? walletsData.wallets[0];

        // Switch to Base if needed
        await wallet.switchChain(8453); // Base mainnet

        const provider = (await wallet.getEthereumProvider()) as {
            request: (args: { method: string; params: unknown[] }) => Promise<unknown>;
        };
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
        [getProvider, refresh],
    );

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

    // ── Claim USDC ──
    const claimUsdc = useCallback(async () => {
        setClaiming(true);
        setError(null);
        try {
            // Step 1: Fund gas from backend
            await fundGas();

            // Step 2: Send claim tx
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
    }, [sendTx, fundGas]);

    // ── Claim All ──
    const claimAll = useCallback(async () => {
        setClaiming(true);
        setError(null);
        try {
            // Step 1: Fund gas from backend
            await fundGas();

            // Step 2: Send claim tx
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
    }, [sendTx, fundGas]);

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
