"use client";

/**
 * Wallet Polling Hook
 *
 * Fetches/creates a wallet for the user.
 *
 * Priority:
 * 1. Privy-authenticated: uses /api/wallet/me (identity-based, persists across sessions)
 * 2. Session-based fallback: uses /api/wallet/:sessionId (legacy)
 *
 * Auto-creates a wallet as soon as the user is authenticated via Privy.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { apiClient, type WalletInfo } from "@/lib/api-client";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
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

    const privy = useOptionalPrivy();
    const autoCreateAttempted = useRef(false);

    /**
     * Get a fresh Privy access token, or null if unavailable.
     */
    const getToken = useCallback(async (): Promise<string | null> => {
        if (!privy?.authenticated || !privy.getAccessToken) return null;
        try {
            return await privy.getAccessToken();
        } catch {
            return null;
        }
    }, [privy]);

    /**
     * Create a wallet — prefers Privy-authenticated /me endpoint,
     * falls back to session-based creation.
     */
    const createWallet = useCallback(async () => {
        setLoading(true);

        try {
            // Privy-authenticated: create identity-based wallet
            const token = await getToken();
            if (token) {
                const data = await apiClient.wallet.createMyWallet(token);
                setWallet(data);
                setError(null);
                return;
            }

            // Fallback: session-based wallet
            if (sessionId) {
                await apiClient.wallet.create(sessionId);
                const data = await apiClient.wallet.getInfo(sessionId);
                setWallet(data);
                setError(null);
                return;
            }

            // Neither auth nor session — nothing to do yet
        } catch (err) {
            console.error("[useWalletPolling] createWallet failed:", err);
            setError(
                `Could not create wallet (${getErrorMessage(err, "request failed")}).`,
            );
        } finally {
            setLoading(false);
        }
    }, [getToken, sessionId]);

    /**
     * Fetch wallet info — prefers Privy-authenticated /me endpoint.
     * Auto-creates if no wallet exists yet.
     */
    const fetchWallet = useCallback(async () => {
        try {
            let data: WalletInfo | null = null;

            // Privy-authenticated: fetch identity-based wallet
            const token = await getToken();
            if (token) {
                try {
                    data = await apiClient.wallet.getMyWallet(token);
                } catch (err) {
                    console.warn("[useWalletPolling] /me fetch failed, trying session:", err);
                    // Fall through to session-based
                }
            }

            // Fallback: session-based wallet
            if (!data && sessionId) {
                data = await apiClient.wallet.getInfo(sessionId);
            }

            if (!data) return; // No auth and no session yet — silent

            setWallet(data);
            setError(null);

            // Auto-create if no wallet exists
            if (!data.exists && !autoCreateAttempted.current) {
                autoCreateAttempted.current = true;
                await createWallet();
            }
        } catch (err) {
            console.error("[useWalletPolling] fetchWallet failed:", err);
            setError(
                `Wallet service unavailable (${getErrorMessage(err, "request failed")}).`,
            );
        }
    }, [getToken, sessionId, createWallet]);

    const refreshBalance = useCallback(async () => {
        setRefreshing(true);
        await fetchWallet();
        setTimeout(() => setRefreshing(false), 600);
    }, [fetchWallet]);

    // Reset auto-create flag when auth state or session changes
    useEffect(() => {
        autoCreateAttempted.current = false;
    }, [privy?.authenticated, sessionId]);

    // Fetch wallet on mount, on auth change, and poll every 30s
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
