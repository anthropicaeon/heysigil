"use client";

import { PrivyProvider } from "@privy-io/react-auth";

import { PrivyContextBridge, PrivyContextFallback } from "@/hooks/useOptionalPrivy";

// ─── Check if Privy is configured ────────────────────────

/**
 * Returns true if Privy is configured (NEXT_PUBLIC_PRIVY_APP_ID is set).
 */
export function useIsPrivyConfigured(): boolean {
    return Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);
}

// ─── Public provider ────────────────────────────────────

export default function PrivyAuthProvider({ children }: { children: React.ReactNode }) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

    if (!appId) {
        // Graceful fallback when Privy isn't configured
        // Provides default unauthenticated state
        return <PrivyContextFallback>{children}</PrivyContextFallback>;
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
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "all-users",
                    },
                },
                legal: {
                    termsAndConditionsUrl: "https://heysigil.com/terms",
                    privacyPolicyUrl: "https://heysigil.com/privacy",
                },
            }}
        >
            <PrivyContextBridge>{children}</PrivyContextBridge>
        </PrivyProvider>
    );
}
