/**
 * Optional Privy Hooks
 *
 * Safely access Privy authentication context.
 * Returns null when Privy is not configured (no NEXT_PUBLIC_PRIVY_APP_ID).
 * Uses real usePrivy hook when Privy IS configured.
 */

"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useIsPrivyConfigured } from "@/providers/PrivyAuthProvider";

// Type for Privy user object
interface PrivyUser {
    id?: string;
    github?: { username: string };
    telegram?: { username: string };
    email?: { address: string };
    farcaster?: { username: string };
    wallet?: { address: string };
}

// Return type for useOptionalPrivy
export interface PrivyContext {
    ready: boolean;
    authenticated: boolean;
    user: PrivyUser | null;
    login: () => void;
    logout: () => Promise<void>;
}

/**
 * Access Privy context. Returns null if Privy is not configured.
 * When Privy IS configured, uses the real usePrivy hook.
 */
export function useOptionalPrivy(): PrivyContext | null {
    const isConfigured = useIsPrivyConfigured();

    if (!isConfigured) {
        return null;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { ready, authenticated, user, login, logout } = usePrivy();
    return { ready, authenticated, user: user as PrivyUser | null, login, logout };
}

/**
 * Access Privy wallets. Returns null if Privy is not configured.
 */
export function useOptionalWallets() {
    const isConfigured = useIsPrivyConfigured();

    if (!isConfigured) {
        return null;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useWallets();
}

/**
 * Extract display name and provider from Privy user.
 */
export function getUserDisplay(privy: PrivyContext | null): { name: string; provider: string } | null {
    if (!privy?.user) return null;
    const u = privy.user;
    if (u.github?.username) return { name: u.github.username, provider: "GitHub" };
    if (u.telegram?.username) return { name: u.telegram.username, provider: "Telegram" };
    if (u.email?.address) return { name: u.email.address, provider: "Email" };
    if (u.farcaster?.username) return { name: u.farcaster.username, provider: "Farcaster" };
    return { name: "User", provider: "" };
}
