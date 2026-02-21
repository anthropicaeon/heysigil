/**
 * useMigratorRead — Read migration state from SigilMigrator + V1/V2 token balances.
 *
 * Uses viem publicClient directly (same pattern as useEscrowRead).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import { formatEther } from "viem";

import {
    ERC20_ABI,
    MIGRATOR_ABI,
    MIGRATOR_ADDRESS,
    publicClient,
    V1_TOKEN_ADDRESS,
    V2_TOKEN_ADDRESS,
} from "@/lib/contracts/migrator";

// ─── Return type ────────────────────────────────────────

export interface MigratorReadData {
    /** Max V2 tokens allocated to this address */
    allocation: bigint;
    /** V2 tokens already claimed */
    claimed: bigint;
    /** V2 tokens still claimable */
    claimable: bigint;
    /** V1 token balance of the connected wallet */
    v1Balance: bigint;
    /** V1 allowance approved to the migrator */
    v1Allowance: bigint;
    /** V2 token balance of the connected wallet */
    v2Balance: bigint;
    /** Whether migration is paused */
    paused: boolean;

    // Formatted strings for display
    allocationFormatted: string;
    claimedFormatted: string;
    claimableFormatted: string;
    v1BalanceFormatted: string;
    v2BalanceFormatted: string;

    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// ─── Helper ─────────────────────────────────────────────

function formatTokens(value: bigint): string {
    const num = Number(formatEther(value));
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(2);
}

// ─── Hook ───────────────────────────────────────────────

export function useMigratorRead(userAddress: Address | null): MigratorReadData {
    const [allocation, setAllocation] = useState<bigint>(BigInt(0));
    const [claimed, setClaimed] = useState<bigint>(BigInt(0));
    const [claimable, setClaimable] = useState<bigint>(BigInt(0));
    const [v1Balance, setV1Balance] = useState<bigint>(BigInt(0));
    const [v1Allowance, setV1Allowance] = useState<bigint>(BigInt(0));
    const [v2Balance, setV2Balance] = useState<bigint>(BigInt(0));
    const [paused, setPaused] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!userAddress) return;

        setLoading(true);
        setError(null);

        console.log("[useMigratorRead] Fetching for:", userAddress);
        console.log("[useMigratorRead] MIGRATOR_ADDRESS:", MIGRATOR_ADDRESS);
        console.log("[useMigratorRead] V1_TOKEN_ADDRESS:", V1_TOKEN_ADDRESS);
        console.log("[useMigratorRead] V2_TOKEN_ADDRESS:", V2_TOKEN_ADDRESS);

        // Read each value individually so one failure doesn't wipe out the rest
        const errors: string[] = [];

        try {
            const val = await publicClient.readContract({
                address: MIGRATOR_ADDRESS, abi: MIGRATOR_ABI,
                functionName: "allocation", args: [userAddress],
            });
            console.log("[useMigratorRead] allocation:", val);
            setAllocation(val);
        } catch (e) {
            errors.push(`allocation: ${e instanceof Error ? e.message : String(e)}`);
        }

        try {
            const val = await publicClient.readContract({
                address: MIGRATOR_ADDRESS, abi: MIGRATOR_ABI,
                functionName: "claimed", args: [userAddress],
            });
            setClaimed(val);
        } catch (e) {
            errors.push(`claimed: ${e instanceof Error ? e.message : String(e)}`);
        }

        try {
            const val = await publicClient.readContract({
                address: MIGRATOR_ADDRESS, abi: MIGRATOR_ABI,
                functionName: "claimable", args: [userAddress],
            });
            setClaimable(val);
        } catch (e) {
            errors.push(`claimable: ${e instanceof Error ? e.message : String(e)}`);
        }

        try {
            const val = await publicClient.readContract({
                address: MIGRATOR_ADDRESS, abi: MIGRATOR_ABI,
                functionName: "paused",
            });
            setPaused(val);
        } catch (e) {
            errors.push(`paused: ${e instanceof Error ? e.message : String(e)}`);
        }

        try {
            const val = await publicClient.readContract({
                address: V1_TOKEN_ADDRESS, abi: ERC20_ABI,
                functionName: "balanceOf", args: [userAddress],
            });
            setV1Balance(val);
        } catch (e) {
            errors.push(`v1Balance: ${e instanceof Error ? e.message : String(e)}`);
        }

        try {
            const val = await publicClient.readContract({
                address: V1_TOKEN_ADDRESS, abi: ERC20_ABI,
                functionName: "allowance", args: [userAddress, MIGRATOR_ADDRESS],
            });
            setV1Allowance(val);
        } catch (e) {
            errors.push(`v1Allowance: ${e instanceof Error ? e.message : String(e)}`);
        }

        try {
            const val = await publicClient.readContract({
                address: V2_TOKEN_ADDRESS, abi: ERC20_ABI,
                functionName: "balanceOf", args: [userAddress],
            });
            setV2Balance(val);
        } catch (e) {
            errors.push(`v2Balance: ${e instanceof Error ? e.message : String(e)}`);
        }

        if (errors.length > 0) {
            console.error("[useMigratorRead] Errors:", errors);
            setError(errors.join("; "));
        }

        setLoading(false);
    }, [userAddress]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        allocation,
        claimed,
        claimable,
        v1Balance,
        v1Allowance,
        v2Balance,
        paused,
        allocationFormatted: formatTokens(allocation),
        claimedFormatted: formatTokens(claimed),
        claimableFormatted: formatTokens(claimable),
        v1BalanceFormatted: formatTokens(v1Balance),
        v2BalanceFormatted: formatTokens(v2Balance),
        loading,
        error,
        refetch: fetchData,
    };
}
