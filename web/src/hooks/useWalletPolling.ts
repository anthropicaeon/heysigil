"use client";

/**
 * Wallet Polling Hook
 *
 * Fetches wallet info for a session and polls every 30 seconds.
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient, type WalletInfo } from "@/lib/api-client";
import { getErrorMessage } from "@/lib/errors";

interface UseWalletPollingResult {
    wallet: WalletInfo | null;
    loading: boolean;
    refreshing: boolean;
    error: string | null;
    fetchWallet: () => Promise<void>;
    createWallet: () => Promise<void>;
    refreshBalance: () => Promise<void>;
}

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function useWalletPolling(sessionId: string | null): UseWalletPollingResult {
    const [wallet, setWallet] = useState<WalletInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchWallet = useCallback(async () => {
        if (!sessionId) return;

        try {
            const data = await apiClient.wallet.getInfo(sessionId);
            setWallet(data);
            setError(null);
        } catch (err) {
            setError(
                `Wallet service unavailable (${getErrorMessage(err, "request failed")}). Check backend and NEXT_PUBLIC_API_URL.`,
            );
        }
    }, [sessionId]);

    const createWallet = useCallback(async () => {
        if (!sessionId) return;
        setLoading(true);

        try {
            await apiClient.wallet.create(sessionId);
            setError(null);
            await fetchWallet();
        } catch (err) {
            setError(
                `Could not create wallet (${getErrorMessage(err, "request failed")}). Check backend and NEXT_PUBLIC_API_URL.`,
            );
        } finally {
            setLoading(false);
        }
    }, [sessionId, fetchWallet]);

    const refreshBalance = useCallback(async () => {
        setRefreshing(true);
        await fetchWallet();
        setTimeout(() => setRefreshing(false), 600);
    }, [fetchWallet]);

    // Fetch wallet on mount and every 30s
    useEffect(() => {
        fetchWallet();
        const interval = setInterval(fetchWallet, POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchWallet]);

    return {
        wallet,
        loading,
        refreshing,
        error,
        fetchWallet,
        createWallet,
        refreshBalance,
    };
}
