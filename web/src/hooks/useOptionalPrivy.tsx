"use client";

/**
 * Optional Privy Hooks
 *
 * Safely access Privy authentication context.
 * Returns default "not authenticated" state when Privy provider isn't available.
 */

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { createContext, type ReactNode, useContext } from "react";

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

// Wallet type
interface WalletData {
    wallets: Array<{
        address: string;
        walletClientType: string;
        switchChain: (chainId: number) => Promise<void>;
        getEthereumProvider: () => Promise<unknown>;
    }>;
}

// Default context when Privy isn't configured
const DEFAULT_CONTEXT: PrivyContext = {
    ready: true,
    authenticated: false,
    user: null,
    login: undefined,
    logout: undefined,
    getAccessToken: undefined,
};

const DEFAULT_WALLETS: WalletData = {
    wallets: [],
};

// Internal context to share Privy state
const PrivyStateContext = createContext<{
    privy: PrivyContext;
    wallets: WalletData;
}>({
    privy: DEFAULT_CONTEXT,
    wallets: DEFAULT_WALLETS,
});

/**
 * Bridge that reads from actual Privy hooks.
 * MUST be used inside PrivyProvider.
 */
export function PrivyContextBridge({ children }: { children: ReactNode }) {
    const privyData = usePrivy();
    const walletsData = useWallets();

    const privy: PrivyContext = {
        ready: privyData.ready,
        authenticated: privyData.authenticated,
        user: privyData.user as PrivyUser | null,
        login: privyData.login,
        logout: privyData.logout,
        getAccessToken: privyData.getAccessToken,
    };

    return (
        <PrivyStateContext.Provider value={{ privy, wallets: walletsData }}>
            {children}
        </PrivyStateContext.Provider>
    );
}

/**
 * Fallback provider when Privy isn't configured.
 * Provides default unauthenticated state.
 */
export function PrivyContextFallback({ children }: { children: ReactNode }) {
    return (
        <PrivyStateContext.Provider value={{ privy: DEFAULT_CONTEXT, wallets: DEFAULT_WALLETS }}>
            {children}
        </PrivyStateContext.Provider>
    );
}

/**
 * Access Privy context safely.
 * Returns default unauthenticated state if Privy isn't configured.
 */
export function useOptionalPrivy(): PrivyContext {
    const ctx = useContext(PrivyStateContext);
    return ctx.privy;
}

/**
 * Access Privy wallets safely.
 * Returns empty wallets array if Privy isn't configured.
 */
export function useOptionalWallets(): WalletData {
    const ctx = useContext(PrivyStateContext);
    return ctx.wallets;
}

/**
 * Extract display name and provider from Privy user.
 */
export function getUserDisplay(
    privy: PrivyContext | null,
): { name: string; provider: string } | null {
    if (!privy?.user) return null;
    const u = privy.user;
    if (u.github?.username) return { name: u.github.username, provider: "GitHub" };
    if (u.telegram?.username) return { name: u.telegram.username, provider: "Telegram" };
    if (u.email?.address) return { name: u.email.address, provider: "Email" };
    if (u.farcaster?.username) return { name: u.farcaster.username, provider: "Farcaster" };
    return { name: "User", provider: "" };
}
