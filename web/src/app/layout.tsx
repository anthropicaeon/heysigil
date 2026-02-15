import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sigil | We Fund Builders",
  description:
    "Funding for developer projects. Stamp your Sigil, earn USDC fees, and let us handle the rest. You build. We support.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-inner">
            <Link href="/" className="nav-brand">
              <div className="nav-logo">S</div>
              <span className="nav-wordmark">Sigil</span>
            </Link>
            <div className="nav-links">
              <Link href="/landing" className="nav-link">About</Link>
              <Link href="/chat" className="nav-link">Chat</Link>
              <Link href="/verify" className="nav-link">Verify</Link>
              <Link href="/verify" className="nav-cta">Get Started</Link>
            </div>
          </div>
        </nav>
        {children}
        <footer className="footer">
          <div className="footer-inner">
            <p>Sigil</p>
            <div className="footer-links">
              <Link href="/chat">Chat</Link>
              <Link href="/verify">Verify</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
