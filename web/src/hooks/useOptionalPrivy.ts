/**
 * Optional Privy Hooks
 *
 * Access Privy authentication state via context bridge.
 * Safe to call from any component — uses useContext (not usePrivy directly).
 * Returns null when Privy is not configured.
 */

import { usePrivyState, usePrivyWallets } from "@/providers/PrivyAuthProvider";

// ─── Types ──────────────────────────────────────────────

export interface PrivyContext {
    ready: boolean;
    authenticated: boolean;
    user: PrivyUser | null;
    login: () => void;
    logout: () => Promise<void>;
}

interface PrivyUser {
    id?: string;
    github?: { username: string };
    telegram?: { username: string };
    email?: { address: string };
    farcaster?: { username: string };
    wallet?: { address: string };
}

// ─── Hooks ──────────────────────────────────────────────

/**
 * Access Privy state. Returns null if Privy is not configured.
 * This is just useContext — no rules-of-hooks issues.
 */
export function useOptionalPrivy(): PrivyContext | null {
    return usePrivyState() as PrivyContext | null;
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

/**
 * Access Privy wallets. Returns null if Privy is not configured.
 * This wraps the wallet context bridge — no rules-of-hooks issues.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useOptionalWallets(): { wallets: any[] } | null {
    return usePrivyWallets();
}
