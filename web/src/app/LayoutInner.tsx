"use client";

import Link from "next/link";
import Image from "next/image";
import PrivyAuthProvider from "../providers/PrivyAuthProvider";
import { usePrivy } from "@privy-io/react-auth";

function NavLoginButton() {
    let privyReady = false;
    let authenticated = false;
    let login: (() => void) | undefined;
    let logout: (() => void) | undefined;
    let userDisplay = "";

    try {
        // usePrivy only works inside PrivyProvider — if Privy isn't configured,
        // the provider renders children directly, so this will throw.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const privy = usePrivy();
        privyReady = privy.ready;
        authenticated = privy.authenticated;
        login = privy.login;
        logout = privy.logout;

        if (privy.user) {
            const u = privy.user;
            if (u.github?.username) {
                userDisplay = u.github.username;
            } else if (u.telegram?.username) {
                userDisplay = u.telegram.username;
            } else if (u.email?.address) {
                userDisplay = u.email.address.split("@")[0];
            } else if (u.farcaster?.username) {
                userDisplay = u.farcaster.username;
            } else {
                userDisplay = "User";
            }
        }
    } catch {
        // Privy not configured — show nothing
        return null;
    }

    if (!privyReady) {
        return (
            <span className="nav-link" style={{ opacity: 0.4 }}>
                Loading...
            </span>
        );
    }

    if (authenticated) {
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
                    onClick={() => logout?.()}
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
        <button className="nav-cta" onClick={() => login?.()}>
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
                    <div className="nav-links">
                        <Link href="/developers" className="nav-link">Developers</Link>
                        <Link href="/chat" className="nav-link">Chat</Link>
                        <Link href="/verify" className="nav-link">Verify</Link>
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
                    </div>
                </div>
            </footer>
        </PrivyAuthProvider>
    );
}
