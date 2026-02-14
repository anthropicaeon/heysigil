import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenClaw Verify — Claim Pool Rewards",
  description:
    "Prove you own a project and claim your pool rewards. Verify via GitHub, domain, tweet, or social accounts.",
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
