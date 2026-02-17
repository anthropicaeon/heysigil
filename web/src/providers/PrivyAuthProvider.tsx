"use client";

import { createContext, useContext } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

// Context to signal whether Privy is actually configured
const PrivyConfiguredContext = createContext(false);

export function useIsPrivyConfigured() {
    return useContext(PrivyConfiguredContext);
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
                {children}
            </PrivyProvider>
        </PrivyConfiguredContext.Provider>
    );
}
