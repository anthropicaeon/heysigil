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
    user: Record<string, unknown> | null;
    login: () => void;
    logout: () => Promise<void>;
}

const PrivyStateContext = createContext<PrivyState | null>(null);

/**
 * Read Privy state from context. Returns null if Privy is not configured.
 * Safe to call from any component — no hooks rules violations.
 */
export function usePrivyState(): PrivyState | null {
    return useContext(PrivyStateContext);
}

// ─── Inner bridge component ─────────────────────────────
// This component lives INSIDE PrivyProvider, so usePrivy() is always valid.

function PrivyStateBridge({ children }: { children: React.ReactNode }) {
    const { ready, authenticated, user, login, logout } = usePrivy();

    return (
        <PrivyStateContext.Provider value={{ ready, authenticated, user, login, logout }}>
            {children}
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
        // No Privy configured — context returns null
        return (
            <PrivyStateContext.Provider value={null}>
                {children}
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
