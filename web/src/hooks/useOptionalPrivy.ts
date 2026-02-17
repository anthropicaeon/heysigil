/**
 * Optional Privy Hooks
 *
 * Safely access Privy authentication context without requiring the provider.
 * Returns null if Privy is not configured or available.
 */

// Type for Privy user object
interface PrivyUser {
    id: string;
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
    login?: () => void;
    logout?: () => void;
    getAccessToken?: () => Promise<string | null>;
}

/**
 * Safely access Privy context without requiring provider.
 * Returns null if Privy is not configured or available.
 */
export function useOptionalPrivy(): PrivyContext | null {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { usePrivy } = require("@privy-io/react-auth");
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return usePrivy();
    } catch {
        return null;
    }
}

/**
 * Safely access Privy wallets without requiring provider.
 */
export function useOptionalWallets() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { useWallets } = require("@privy-io/react-auth");
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useWallets();
    } catch {
        return null;
    }
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
