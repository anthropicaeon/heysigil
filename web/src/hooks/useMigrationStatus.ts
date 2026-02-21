"use client";

/**
 * useMigrationStatus — Reads migration data from the backend API
 *
 * Replaces useMigratorRead (which called contracts directly via viem).
 * The backend reads on-chain data + DB relayed amounts and returns a unified view.
 */

import { useState, useCallback, useEffect } from "react";
import { formatEther } from "viem";

// ─── Types ──────────────────────────────────────────────

interface RelayHistoryEntry {
    txIn: string;
    txOut: string | null;
    amount: string;
    status: string;
    reason: string | null;
    createdAt: string;
}

export interface MigrationStatusData {
    allocation: bigint;
    claimed: bigint;
    relayed: bigint;
    remaining: bigint;
    paused: boolean;
    relayerAddress: string;
    history: RelayHistoryEntry[];

    // Formatted display values
    allocationFormatted: string;
    claimedFormatted: string;
    relayedFormatted: string;
    remainingFormatted: string;

    // State
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// ─── Formatting ─────────────────────────────────────────

function formatTokenAmount(raw: bigint): string {
    const num = Number(formatEther(raw));
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
    return num.toFixed(2);
}

// ─── Hook ───────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export function useMigrationStatus(userAddress: string | null): MigrationStatusData {
    const [allocation, setAllocation] = useState<bigint>(BigInt(0));
    const [claimed, setClaimed] = useState<bigint>(BigInt(0));
    const [relayed, setRelayed] = useState<bigint>(BigInt(0));
    const [remaining, setRemaining] = useState<bigint>(BigInt(0));
    const [paused, setPaused] = useState(false);
    const [relayerAddress, setRelayerAddress] = useState("");
    const [history, setHistory] = useState<RelayHistoryEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!userAddress) return;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(
                `${API_BASE}/api/migration/status?address=${userAddress}`,
            );

            if (!res.ok) {
                const body = await res.json().catch(() => ({ error: "Unknown error" }));
                throw new Error(body.error || `HTTP ${res.status}`);
            }

            const data = await res.json();

            setAllocation(BigInt(data.allocation));
            setClaimed(BigInt(data.claimed));
            setRelayed(BigInt(data.relayed));
            setRemaining(BigInt(data.remaining));
            setPaused(data.paused);
            setRelayerAddress(data.relayerAddress || "");
            setHistory(data.history || []);
        } catch (err) {
            console.error("[useMigrationStatus] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch migration data");
        } finally {
            setLoading(false);
        }
    }, [userAddress]);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    return {
        allocation,
        claimed,
        relayed,
        remaining,
        paused,
        relayerAddress,
        history,

        allocationFormatted: formatTokenAmount(allocation),
        claimedFormatted: formatTokenAmount(claimed),
        relayedFormatted: formatTokenAmount(relayed),
        remainingFormatted: formatTokenAmount(remaining),

        loading,
        error,
        refetch: fetchStatus,
    };
}
