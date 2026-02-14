import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sigil — Stamp Your Approval, Earn While You Build",
  description:
    "Funding for dev projects without the weight of handling a community. Stamp your Sigil to earn USDC fees from LPs while your native tokens remain locked.",
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
