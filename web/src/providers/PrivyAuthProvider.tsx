"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyAuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

    if (!appId) {
        // Graceful fallback when Privy isn't configured
        return <>{children}</>;
    }

    return (
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
    );
}
