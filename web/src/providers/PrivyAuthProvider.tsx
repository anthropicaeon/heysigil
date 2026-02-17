"use client";

import { createContext, useContext } from "react";
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";

// Context to signal whether Privy is actually configured
const PrivyConfiguredContext = createContext(false);

export function useIsPrivyConfigured() {
    return useContext(PrivyConfiguredContext);
}

// Contexts populated by PrivyBridge (always inside PrivyProvider).
// Default is null — hooks that consume these return null when Privy is not configured.
export const OptionalPrivyContext = createContext<ReturnType<typeof usePrivy> | null>(null);
export const OptionalWalletsContext = createContext<ReturnType<typeof useWallets> | null>(null);

/**
 * Inner bridge component — always rendered inside <PrivyProvider>.
 * Calls usePrivy() and useWallets() at the top level (no conditions),
 * satisfying the Rules of Hooks, then forwards the values via context.
 */
function PrivyBridge({ children }: { children: React.ReactNode }) {
    const privyData = usePrivy();
    const walletsData = useWallets();
    return (
        <OptionalPrivyContext.Provider value={privyData}>
            <OptionalWalletsContext.Provider value={walletsData}>
                {children}
            </OptionalWalletsContext.Provider>
        </OptionalPrivyContext.Provider>
    );
}

export default function PrivyAuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

    if (!appId) {
        // Graceful fallback when Privy isn't configured
        return (
            <PrivyConfiguredContext.Provider value={false}>
                {children}
            </PrivyConfiguredContext.Provider>
        );
    }

    return (
        <PrivyConfiguredContext.Provider value={true}>
            <PrivyProvider
                appId={appId}
                config={{
                    // Login methods — only include methods configured in Privy dashboard
                    loginMethods: ["email", "wallet", "github"],

                    // Branding
                    appearance: {
                        theme: "light",
                        accentColor: "#482863",
                        logo: "/logo-sage.png",
                        landingHeader: "Sign in to Sigil",
                        loginMessage: "Fund builders. Trade tokens. No wallet needed.",
                    },

                    // Legal
                    legal: {
                        termsAndConditionsUrl: "https://heysigil.fund/terms",
                        privacyPolicyUrl: "https://heysigil.fund/privacy",
                    },
                }}
            >
                <PrivyBridge>{children}</PrivyBridge>
            </PrivyProvider>
        </PrivyConfiguredContext.Provider>
    );
}
