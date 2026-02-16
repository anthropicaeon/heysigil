"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Try to get Privy auth — returns null if Privy not configured
function useOptionalPrivy() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { usePrivy } = require("@privy-io/react-auth");
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return usePrivy();
    } catch {
        return null;
    }
}

interface TokenBalance {
    symbol: string;
    balance: string;
    address: string;
}

interface WalletData {
    exists: boolean;
    address: string | null;
    balance: {
        eth: string;
        tokens: TokenBalance[];
    } | null;
}

// Token colors for visual differentiation
const TOKEN_COLORS: Record<string, string> = {
    ETH: "#627EEA",
    USDC: "#2775CA",
    WETH: "#EC627A",
    DAI: "#F4B731",
    DEGEN: "#A36EFD",
    AERO: "#0052FF",
    BRETT: "#46C6B1",
    TOSHI: "#4E8EE9",
    cbBTC: "#F7931A",
};

function getTokenColor(symbol: string): string {
    return TOKEN_COLORS[symbol] || "#86868b";
}

function getUserDisplay(privy: ReturnType<typeof useOptionalPrivy>): { name: string; provider: string } | null {
    if (!privy?.user) return null;
    const u = privy.user;
    if (u.github?.username) return { name: u.github.username, provider: "GitHub" };
    if (u.telegram?.username) return { name: u.telegram.username, provider: "Telegram" };
    if (u.email?.address) return { name: u.email.address, provider: "Email" };
    if (u.farcaster?.username) return { name: u.farcaster.username, provider: "Farcaster" };
    return { name: "User", provider: "" };
}

export default function PortfolioSidebar({
    sessionId,
    collapsed,
    onToggle,
}: {
    sessionId: string | null;
    collapsed: boolean;
    onToggle: () => void;
}) {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const privy = useOptionalPrivy();
    const isAuthenticated = privy?.authenticated ?? false;
    const userInfo = getUserDisplay(privy);

    const fetchWallet = useCallback(async () => {
        if (!sessionId) return;

        try {
            const res = await fetch(`${API_BASE}/api/wallet/${sessionId}`);
            const data = await res.json();
            setWallet(data);
        } catch {
            // Silent fail — sidebar is non-critical
        }
    }, [sessionId]);

    const createWallet = async () => {
        if (!sessionId) return;
        setLoading(true);

        try {
            await fetch(`${API_BASE}/api/wallet/${sessionId}/create`, {
                method: "POST",
            });
            await fetchWallet();
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
    };

    const refreshBalance = async () => {
        setRefreshing(true);
        await fetchWallet();
        setTimeout(() => setRefreshing(false), 600);
    };

    const copyAddress = async () => {
        if (!wallet?.address) return;
        await navigator.clipboard.writeText(wallet.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Fetch wallet on mount and every 30s
    useEffect(() => {
        fetchWallet();
        const interval = setInterval(fetchWallet, 30_000);
        return () => clearInterval(interval);
    }, [fetchWallet]);

    // Compute total portfolio value (just ETH for now)
    const ethBalance = wallet?.balance ? parseFloat(wallet.balance.eth) : 0;
    const hasTokens = wallet?.balance?.tokens && wallet.balance.tokens.length > 0;

    if (collapsed) {
        return (
            <div className="portfolio-sidebar portfolio-collapsed" onClick={onToggle}>
                <div className="portfolio-collapsed-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                        <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                        <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                    </svg>
                </div>
                {wallet?.exists && (
                    <div className="portfolio-collapsed-dot" />
                )}
            </div>
        );
    }

    return (
        <div className="portfolio-sidebar">
            {/* Header */}
            <div className="portfolio-header">
                <h3>Portfolio</h3>
                <button className="portfolio-toggle" onClick={onToggle} title="Collapse">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
            </div>

            {/* User identity */}
            {isAuthenticated && userInfo && (
                <div className="portfolio-address-card">
                    <div className="portfolio-address-row">
                        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                            <div className="nav-user-avatar" style={{ width: 28, height: 28 }}>
                                {userInfo.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                                    {userInfo.name}
                                </p>
                                {userInfo.provider && (
                                    <p style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", margin: 0 }}>
                                        via {userInfo.provider}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Not signed in — prompt to login */}
            {!isAuthenticated && privy && (
                <div className="portfolio-empty">
                    <div className="portfolio-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <p className="portfolio-empty-title">Sign in to get started</p>
                    <p className="portfolio-empty-desc">
                        Log in with GitHub, Telegram, or email to create a wallet and start trading.
                    </p>
                    <button
                        className="btn-primary btn-sm"
                        onClick={() => privy.login?.()}
                        style={{ width: "100%", marginTop: "var(--space-3)" }}
                    >
                        Sign In
                    </button>
                </div>
            )}

            {/* No wallet state — only show for authenticated users or when Privy isn't configured */}
            {!wallet?.exists && (isAuthenticated || !privy) && (
                <div className="portfolio-empty">
                    <div className="portfolio-empty-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                        </svg>
                    </div>
                    <p className="portfolio-empty-title">No wallet yet</p>
                    <p className="portfolio-empty-desc">
                        Create a wallet to start trading directly from chat.
                    </p>
                    <button
                        className="btn-primary btn-sm"
                        onClick={createWallet}
                        disabled={loading || !sessionId}
                        style={{ width: "100%", marginTop: "var(--space-3)" }}
                    >
                        {loading ? (
                            <span className="spinner" style={{ width: 14, height: 14 }} />
                        ) : (
                            "Create Wallet"
                        )}
                    </button>
                </div>
            )}

            {/* Wallet info */}
            {wallet?.exists && (
                <>
                    {/* Address card */}
                    <div className="portfolio-address-card">
                        <div className="portfolio-address-row">
                            <span className="portfolio-label">Address</span>
                            <button
                                className="portfolio-copy-btn"
                                onClick={copyAddress}
                                title="Copy address"
                            >
                                {copied ? (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <p className="portfolio-address font-mono">
                            {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "—"}
                        </p>
                    </div>

                    {/* Balance section */}
                    <div className="portfolio-section">
                        <div className="portfolio-section-header">
                            <span className="portfolio-label">Balance</span>
                            <button
                                className={`portfolio-refresh-btn ${refreshing ? "portfolio-refreshing" : ""}`}
                                onClick={refreshBalance}
                                title="Refresh"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                                </svg>
                            </button>
                        </div>

                        {/* ETH balance */}
                        <div className="portfolio-balance-main">
                            <div className="portfolio-token-icon" style={{ background: TOKEN_COLORS.ETH }}>
                                Ξ
                            </div>
                            <div>
                                <p className="portfolio-balance-value">
                                    {ethBalance.toFixed(ethBalance < 0.001 && ethBalance > 0 ? 6 : 4)} ETH
                                </p>
                            </div>
                        </div>

                        {/* Token balances */}
                        {hasTokens && (
                            <div className="portfolio-token-list">
                                {wallet.balance!.tokens.map((token) => (
                                    <div key={token.symbol} className="portfolio-token-row">
                                        <div className="portfolio-token-icon-sm" style={{ background: getTokenColor(token.symbol) }}>
                                            {token.symbol.charAt(0)}
                                        </div>
                                        <span className="portfolio-token-symbol">{token.symbol}</span>
                                        <span className="portfolio-token-balance">
                                            {parseFloat(token.balance).toFixed(
                                                parseFloat(token.balance) < 1 ? 4 : 2
                                            )}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {ethBalance === 0 && !hasTokens && (
                            <p className="portfolio-empty-balance">
                                Send ETH on Base to your address above to get started.
                            </p>
                        )}
                    </div>

                    {/* Quick actions */}
                    <div className="portfolio-section">
                        <span className="portfolio-label">Quick Actions</span>
                        <div className="portfolio-actions">
                            <button className="portfolio-action-btn" title="Deposit" onClick={copyAddress}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <polyline points="19 12 12 19 5 12" />
                                </svg>
                                <span>Deposit</span>
                            </button>
                            <a
                                className="portfolio-action-btn"
                                href={wallet.address ? `https://basescan.org/address/${wallet.address}` : "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                </svg>
                                <span>Explorer</span>
                            </a>
                        </div>
                    </div>

                    {/* Network badge */}
                    <div className="portfolio-network">
                        <div className="portfolio-network-dot" />
                        <span>Base Mainnet</span>
                    </div>
                </>
            )}
        </div>
    );
}
