/**
 * Optional Privy Hooks
 *
 * Safely access Privy authentication context.
 * Returns null when Privy is not configured (no NEXT_PUBLIC_PRIVY_APP_ID).
 * Uses real usePrivy hook when Privy IS configured.
 */

"use client";

import { useContext } from "react";
import { OptionalPrivyContext, OptionalWalletsContext } from "@/providers/PrivyAuthProvider";

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
    getAccessToken: () => Promise<string | null>;
}

/**
 * Access Privy context. Returns null if Privy is not configured.
 * Reads from OptionalPrivyContext — populated inside PrivyProvider by PrivyBridge.
 * No conditional hook calls: satisfies the Rules of Hooks.
 */
export function useOptionalPrivy(): PrivyContext | null {
    const privyData = useContext(OptionalPrivyContext);
    if (!privyData) return null;
    const { ready, authenticated, user, login, logout, getAccessToken } = privyData;
    return { ready, authenticated, user: user as PrivyUser | null, login, logout, getAccessToken };
}

/**
 * Access Privy wallets. Returns null if Privy is not configured.
 * Reads from OptionalWalletsContext — populated inside PrivyProvider by PrivyBridge.
 */
export function useOptionalWallets() {
    return useContext(OptionalWalletsContext);
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
