"use client";

import { createContext, useContext } from "react";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";

// ─── Privy State Context ────────────────────────────────
// Bridge pattern: usePrivy() is called inside PrivyProvider,
// results are exposed via a plain React context that's safe
// to consume from any component (no conditional hooks needed).

interface PrivyState {
    ready: boolean;
    authenticated: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any | null;
    login: () => void;
    logout: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
}

const PrivyStateContext = createContext<PrivyState | null>(null);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const WalletsContext = createContext<{ wallets: any[] } | null>(null);

/**
 * Read Privy state from context. Returns null if Privy is not configured.
 * Safe to call from any component — no hooks rules violations.
 */
export function usePrivyState(): PrivyState | null {
    return useContext(PrivyStateContext);
}

/**
 * Returns true if Privy is configured (NEXT_PUBLIC_PRIVY_APP_ID is set).
 */
/**
 * Read Privy wallets from context. Returns null if Privy is not configured.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePrivyWallets(): { wallets: any[] } | null {
    return useContext(WalletsContext);
}

export function useIsPrivyConfigured(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
}

// ─── Inner bridge component ─────────────────────────────
// This component lives INSIDE PrivyProvider, so usePrivy() is always valid.

function PrivyStateBridge({ children }: { children: React.ReactNode }) {
    const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
    const { wallets } = useWallets();

    return (
        <PrivyStateContext.Provider value={{ ready, authenticated, user, login, logout, getAccessToken }}>
            <WalletsContext.Provider value={{ wallets }}>
                {children}
            </WalletsContext.Provider>
        </PrivyStateContext.Provider>
    );
}

// ─── Public provider ────────────────────────────────────

export default function PrivyAuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

    if (!appId) {
        // No Privy configured — contexts return null
        return (
            <PrivyStateContext.Provider value={null}>
                <WalletsContext.Provider value={null}>
                    {children}
                </WalletsContext.Provider>
            </PrivyStateContext.Provider>
        );
    }

    return (
        <PrivyProvider
            appId={appId}
            config={{
                loginMethods: ["email", "wallet", "github"],
                appearance: {
                    theme: "light",
                    accentColor: "#482863",
                    logo: "/logo-sage.png",
                    landingHeader: "Sign in to Sigil",
                    loginMessage: "Fund builders. Trade tokens. No wallet needed.",
                },
                legal: {
                    termsAndConditionsUrl: "https://heysigil.fund/terms",
                    privacyPolicyUrl: "https://heysigil.fund/privacy",
                },
            }}
        >
            <PrivyStateBridge>
                {children}
            </PrivyStateBridge>
        </PrivyProvider>
    );
}
