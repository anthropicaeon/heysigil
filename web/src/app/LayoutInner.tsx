"use client";

import Link from "next/link";
import Image from "next/image";
import PrivyAuthProvider from "../providers/PrivyAuthProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import { useOptionalPrivy, getUserDisplay } from "@/hooks/useOptionalPrivy";

function NavLoginButton() {
    const privy = useOptionalPrivy();

    // Privy not configured — show nothing
    if (!privy) return null;

    const userInfo = getUserDisplay(privy);
    // For email, show only the local part
    const userDisplay = userInfo
        ? (userInfo.provider === "Email" ? userInfo.name.split("@")[0] : userInfo.name)
        : "";

    if (!privy.ready) {
        return (
            <span className="nav-link" style={{ opacity: 0.4 }}>
                Loading...
            </span>
        );
    }

    if (privy.authenticated) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                <div className="nav-user-badge">
                    <div className="nav-user-avatar">
                        {userDisplay.charAt(0).toUpperCase()}
                    </div>
                    <span className="nav-user-name">{userDisplay}</span>
                </div>
                <button
                    className="btn-sm"
                    onClick={() => privy.logout?.()}
                    style={{
                        background: "transparent",
                        color: "var(--text-secondary)",
                        fontSize: "var(--text-xs)",
                        padding: "4px 10px",
                    }}
                >
                    Log out
                </button>
            </div>
        );
    }

    return (
        <button className="nav-cta" onClick={() => privy.login?.()}>
            Sign In
        </button>
    );
}

export default function LayoutInner({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ErrorBoundary>
            <PrivyAuthProvider>
                <nav className="nav">
                    <div className="nav-inner">
                        <Link href="/" className="nav-brand">
                            <Image
                                src="/logo-sage.png"
                                alt="Sigil"
                                width={28}
                                height={28}
                                className="nav-logo-img"
                            />
                            <span className="nav-wordmark">Sigil</span>
                        </Link>
                        {/* Serial Position Effect: Primary action first, settings last */}
                        <div className="nav-links">
                            <Link href="/verify" className="nav-link nav-link-primary">Verify</Link>
                            <Link href="/dashboard" className="nav-link">Dashboard</Link>
                            <Link href="/chat" className="nav-link">Chat</Link>
                            <Link href="/governance" className="nav-link">Governance</Link>
                            <Link href="/developers" className="nav-link">Developers</Link>
                            <NavLoginButton />
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
                            <Link href="/audit">Audited by Claude Opus 4.6 [1m]</Link>
                        </div>
                    </div>
                </footer>
            </PrivyAuthProvider>
        </ErrorBoundary>
    );
}
