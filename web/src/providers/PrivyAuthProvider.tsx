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
                // Login methods: GitHub, Telegram, Email, Farcaster (no X/Twitter)
                loginMethods: ["github", "telegram", "email", "farcaster"],

                // Branding
                appearance: {
                    theme: "light",
                    accentColor: "#482863",
                    logo: "/logo-sage.png",
                    landingHeader: "Sign in to Sigil",
                    loginMessage: "Fund builders. Trade tokens. No wallet needed.",
                },

                // Create embedded EVM wallet on login for users without one
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "users-without-wallets",
                    },
                },

                // Legal
                legal: {
                    termsAndConditionsUrl: "https://sigil.sh/terms",
                    privacyPolicyUrl: "https://sigil.sh/privacy",
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
