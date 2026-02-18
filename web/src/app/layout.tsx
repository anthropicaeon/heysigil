import "./globals.css";

import type { Metadata } from "next";
import { Figtree } from "next/font/google";

import { Footer } from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/contexts/SessionContext";
import PrivyAuthProvider from "@/providers/PrivyAuthProvider";

const figtree = Figtree({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-figtree",
});

export const metadata: Metadata = {
    title: {
        default: "Sigil | We Fund Builders",
        template: "%s | Sigil",
    },
    description:
        "The verification infrastructure for the agentic economy. Five-channel verification, onchain attestations, and milestone governance for dev projects.",
    keywords: [
        "Sigil",
        "Web3",
        "Verification",
        "Builder Funding",
        "EAS Attestation",
        "Governance",
        "Base",
        "Blockchain",
        "Developer Funding",
        "zkTLS",
    ],
    authors: [{ name: "Sigil Team" }],
    creator: "Sigil",
    publisher: "Sigil",
    robots: {
        index: true,
        follow: true,
    },
    icons: {
        icon: [
            { url: "/favicon.png", sizes: "48x48" },
            { url: "/favicon.png", type: "image/png" },
        ],
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
        shortcut: [{ url: "/favicon.png" }],
    },
    openGraph: {
        title: "Sigil | We Fund Builders",
        description:
            "The verification infrastructure for the agentic economy. Five-channel verification, onchain attestations, and milestone governance.",
        siteName: "Sigil",
        images: [
            {
                url: "/og-image.png",
                width: 900,
                height: 900,
                alt: "Sigil - We Fund Builders",
            },
        ],
        type: "website",
    },
    twitter: {
        card: "summary",
        title: "Sigil | We Fund Builders",
        description:
            "The verification infrastructure for the agentic economy. Five-channel verification, onchain attestations, and milestone governance.",
        images: ["/og-image.png"],
        creator: "@HeySigil",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`h-screen ${figtree.variable} antialiased`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    forcedTheme="light"
                    disableTransitionOnChange
                >
                    <PrivyAuthProvider>
                        <SessionProvider>
                            <Navbar />
                            <main>{children}</main>
                            <Footer />
                        </SessionProvider>
                    </PrivyAuthProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
