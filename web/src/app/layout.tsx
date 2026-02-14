import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sigil — Claim Pool Rewards",
  description:
    "Prove you own a project and claim your pool rewards. Chat with Sigil to verify, trade, and manage your crypto.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
