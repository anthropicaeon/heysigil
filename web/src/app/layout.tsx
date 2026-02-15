import type { Metadata } from "next";
import "./globals.css";
import LayoutInner from "./LayoutInner";

export const metadata: Metadata = {
  title: "Sigil | We Fund Builders",
  description:
    "Funding for developer projects. Stamp your Sigil, earn USDC fees, and let us handle the rest. You build. We support.",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Sigil | We Fund Builders",
    description:
      "Funding for developer projects. Stamp your Sigil, earn USDC fees, and let us handle the rest.",
    images: [{ url: "/og-image.png", width: 900, height: 900, alt: "Sigil" }],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sigil | We Fund Builders",
    description:
      "Funding for developer projects. Stamp your Sigil, earn USDC fees.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LayoutInner>{children}</LayoutInner>
      </body>
    </html>
  );
}

