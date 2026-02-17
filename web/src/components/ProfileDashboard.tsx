"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFeeVault } from "@/hooks/useFeeVault";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import type { TokenInfo } from "@/types";

// ─── Mock Data (token holdings — live fee data comes from hook) ─

const MOCK_DEV_TOKENS: TokenInfo[] = [
    {
        address: "0xTOKEN1...aaaa",
        name: "NexusAI Protocol",
        ticker: "NEXUS",
        color: "#6C5CE7",
        role: "dev",
        balance: "50,000,000",
        escrowBalance: "7,300,000,000",
        activeProposals: 1,
        totalProposals: 4,
        projectId: "nexusai",
    },
    {
        address: "0xTOKEN2...bbbb",
        name: "DeFi Guardian",
        ticker: "GUARD",
        color: "#00B894",
        role: "dev",
        balance: "50,000,000",
        escrowBalance: "9,100,000,000",
        activeProposals: 0,
        totalProposals: 2,
        projectId: "defi-guardian",
    },
];

const MOCK_HELD_TOKENS: TokenInfo[] = [
    {
        address: "0xTOKEN3...cccc",
        name: "Quantum Chain",
        ticker: "QNTM",
        color: "#E17055",
        role: "holder",
        balance: "125,000,000",
        escrowBalance: "6,800,000,000",
        activeProposals: 2,
        totalProposals: 6,
        projectId: "quantum-chain",
    },
    {
        address: "0xTOKEN4...dddd",
        name: "SocialFi Hub",
        ticker: "SHUB",
        color: "#0984E3",
        role: "holder",
        balance: "89,500,000",
        escrowBalance: "8,200,000,000",
        activeProposals: 1,
        totalProposals: 3,
        projectId: "socialfi-hub",
    },
    {
        address: "0xTOKEN5...eeee",
        name: "DataVault Network",
        ticker: "DVLT",
        color: "#FDCB6E",
        role: "holder",
        balance: "52,000,000",
        escrowBalance: "5,400,000,000",
        activeProposals: 0,
        totalProposals: 1,
        projectId: "datavault",
    },
];

// ─── Helpers ─────────────────────────────────────────

function formatNum(val: string): string {
    const num = parseFloat(val.replace(/,/g, ""));
    if (isNaN(num)) return val;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(0)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
    return val;
}

// ─── Fee Claim Card ──────────────────────────────────

function FeeClaimCard({
    claimableUsdc,
    lifetimeUsdc,
    claiming,
    error,
    lastTxHash,
    loading,
    onClaim,
    onRefresh,
}: {
    claimableUsdc: string;
    lifetimeUsdc: string;
    claiming: boolean;
    error: string | null;
    lastTxHash: string | null;
    loading: boolean;
    onClaim: () => void;
    onRefresh: () => void;
}) {
    const isZero = claimableUsdc === "$0.00";

    return (
        <div className="fee-claim-card">
            <div className="fee-claim-header">
                <div>
                    <h3 style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                        Claimable USDC
                    </h3>
                    <div className="fee-claim-amount">
                        {loading ? (
                            <span className="spinner" style={{ width: 20, height: 20 }} />
                        ) : (
                            claimableUsdc
                        )}
                    </div>
                </div>
                <button
                    className="fee-claim-refresh"
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh balances"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                    </svg>
                </button>
            </div>

            <div className="fee-claim-stats">
                <div className="fee-claim-stat">
                    <span className="fee-label">Lifetime Earned</span>
                    <span className="fee-value">{lifetimeUsdc}</span>
                </div>
            </div>

            <button
                className="fee-claim-btn"
                onClick={onClaim}
                disabled={claiming || isZero || loading}
            >
                {claiming ? (
                    <>
                        <span className="spinner" style={{ width: 14, height: 14 }} />
                        Claiming…
                    </>
                ) : (
                    <>
                        <Image
                            src="/icons/coins-hand.svg"
                            alt=""
                            width={16}
                            height={16}
                            style={{ display: "inline", verticalAlign: "middle", marginRight: 6, opacity: 0.7 }}
                        />
                        {isZero ? "No USDC to Claim" : `Claim ${claimableUsdc}`}
                    </>
                )}
            </button>

            {/* Success toast */}
            {lastTxHash && !claiming && (
                <div className="fee-claim-success">
                    ✓ Claimed!{" "}
                    <a
                        href={`https://basescan.org/tx/${lastTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View tx ↗
                    </a>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="fee-claim-error">
                    {error}
                </div>
            )}
        </div>
    );
}

// ─── Token Card ──────────────────────────────────────

function TokenCard({ token }: { token: TokenInfo }) {
    const isAboveThreshold =
        token.role === "holder" &&
        parseFloat(token.balance.replace(/,/g, "")) >= 50_000_000;

    return (
        <div className="token-card">
            {/* Top: icon + name + role badge */}
            <div className="token-card-top">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="token-card-icon" style={{ background: token.color }}>
                        {token.ticker.charAt(0)}
                    </div>
                    <div className="token-card-name">
                        <h3>{token.name}</h3>
                        <span className="ticker">${token.ticker}</span>
                    </div>
                </div>
                <span className={`token-role-badge ${token.role === "dev" ? "role-dev" : "role-holder"}`}>
                    {token.role === "dev" ? <><Image src="/icons/zap-fast.svg" alt="" width={12} height={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 3, opacity: 0.6 }} /> Developer</> : <><Image src="/icons/coins-stacked-02.svg" alt="" width={12} height={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 3, opacity: 0.6 }} /> Holder</>}
                </span>
            </div>

            {/* Stats */}
            <div className="token-card-stats">
                <div className="token-stat">
                    <div className="stat-value">{formatNum(token.balance)}</div>
                    <div className="stat-label">Your Balance</div>
                </div>
                <div className="token-stat">
                    <div className="stat-value">{formatNum(token.escrowBalance)}</div>
                    <div className="stat-label">In Escrow</div>
                </div>
            </div>

            {/* Governance info */}
            <div className="fee-row" style={{ marginBottom: "var(--space-4)" }}>
                <span className="fee-label">Active Proposals</span>
                <span className="fee-value">
                    {token.activeProposals} / {token.totalProposals}
                </span>
            </div>

            {/* Actions */}
            <div className="token-card-actions">
                <Link href={`/governance?token=${token.address}`} className="action-primary">
                    <Image src="/icons/check-verified-02.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.6 }} /> Governance
                </Link>
                {token.role === "holder" && isAboveThreshold && (
                    <Link href={`/governance?token=${token.address}&action=propose`}>
                        <Image src="/icons/check-verified-02.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.6 }} /> Propose
                    </Link>
                )}
                {token.role === "holder" && !isAboveThreshold && (
                    <span
                        style={{
                            flex: 1,
                            padding: "var(--space-2) var(--space-3)",
                            fontSize: "var(--text-xs)",
                            textAlign: "center",
                            color: "var(--text-tertiary)",
                        }}
                    >
                        Need 50M to propose
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────

export default function ProfileDashboard() {
    const [activeSection, setActiveSection] = useState<"all" | "dev" | "held">("all");

    // Get wallet address from Privy
    const privy = useOptionalPrivy();
    const walletAddress = privy?.user?.wallet?.address as string | undefined;
    const displayAddress = walletAddress
        ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
        : "Not connected";

    // Fee vault hook — reads on-chain data
    const {
        claimableUsdc,
        lifetimeUsdc,
        loading,
        claiming,
        error,
        lastTxHash,
        claimUsdc,
        refresh,
    } = useFeeVault(walletAddress);

    const devTokens = MOCK_DEV_TOKENS;
    const heldTokens = MOCK_HELD_TOKENS;
    const allTokens = [...devTokens, ...heldTokens];

    const displayTokens =
        activeSection === "dev" ? devTokens :
            activeSection === "held" ? heldTokens :
                allTokens;

    return (
        <div className="container" style={{ padding: "var(--space-12) var(--space-6)" }}>
            {/* Profile Hero */}
            <div className="profile-hero">
                <div className="profile-avatar">
                    {walletAddress ? walletAddress.charAt(2).toUpperCase() : "?"}
                </div>
                <div className="profile-info">
                    <h1>My Dashboard</h1>
                    <span className="profile-address">{displayAddress}</span>
                </div>
            </div>

            {/* Fee Claim Card — LIVE on-chain data */}
            {walletAddress && (
                <FeeClaimCard
                    claimableUsdc={claimableUsdc}
                    lifetimeUsdc={lifetimeUsdc}
                    claiming={claiming}
                    error={error}
                    lastTxHash={lastTxHash}
                    loading={loading}
                    onClaim={claimUsdc}
                    onRefresh={refresh}
                />
            )}

            {/* Not connected prompt */}
            {!walletAddress && (
                <div className="fee-claim-card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                        Connect your wallet to view and claim fee earnings.
                    </p>
                </div>
            )}

            {/* Portfolio Summary */}
            <div className="profile-summary">
                <div className="profile-summary-card">
                    <div className="value">{devTokens.length + heldTokens.length}</div>
                    <div className="label">Sigil Tokens</div>
                </div>
                <div className="profile-summary-card">
                    <div className="value">{devTokens.length}</div>
                    <div className="label">As Developer</div>
                </div>
                <div className="profile-summary-card">
                    <div className="value" style={{ color: "var(--success)" }}>{lifetimeUsdc}</div>
                    <div className="label">Total USDC Earned</div>
                </div>
                <div className="profile-summary-card">
                    <div className="value" style={{ color: "var(--success)" }}>{claimableUsdc}</div>
                    <div className="label">Claimable USDC</div>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="gov-tabs" style={{ marginBottom: "var(--space-6)" }}>
                {([
                    ["all", `All Tokens (${allTokens.length})`],
                    ["dev", `My Projects (${devTokens.length})`],
                    ["held", `Holdings (${heldTokens.length})`],
                ] as [string, string][]).map(([key, label]) => (
                    <button
                        key={key}
                        className={`gov-tab ${activeSection === key ? "active" : ""}`}
                        onClick={() => setActiveSection(key as "all" | "dev" | "held")}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Dev Tokens Section */}
            {(activeSection === "all" || activeSection === "dev") && devTokens.length > 0 && (
                <>
                    {activeSection === "all" && (
                        <div className="profile-section-header">
                            <h2><Image src="/icons/zap-fast.svg" alt="" width={20} height={20} style={{ display: "inline", verticalAlign: "middle", marginRight: 6, opacity: 0.6 }} /> Your Projects</h2>
                            <span className="section-count">{devTokens.length} tokens</span>
                        </div>
                    )}
                    <div className="token-grid">
                        {devTokens.map((t) => (
                            <TokenCard key={t.address} token={t} />
                        ))}
                    </div>
                </>
            )}

            {/* Held Tokens Section */}
            {(activeSection === "all" || activeSection === "held") && heldTokens.length > 0 && (
                <>
                    {activeSection === "all" && (
                        <div className="profile-section-header">
                            <h2><Image src="/icons/coins-stacked-02.svg" alt="" width={20} height={20} style={{ display: "inline", verticalAlign: "middle", marginRight: 6, opacity: 0.6 }} /> Token Holdings</h2>
                            <span className="section-count">{heldTokens.length} tokens</span>
                        </div>
                    )}
                    <div className="token-grid">
                        {heldTokens.map((t) => (
                            <TokenCard key={t.address} token={t} />
                        ))}
                    </div>
                </>
            )}

            {/* Empty states */}
            {activeSection === "dev" && devTokens.length === 0 && (
                <div className="profile-empty-section">
                    <Image src="/icons/zap-fast.svg" alt="" width={40} height={40} className="empty-icon" style={{ opacity: 0.3, display: "block", margin: "0 auto var(--space-3)" }} />
                    <p>You haven&apos;t launched any tokens yet. Verify your project to start earning fees.</p>
                </div>
            )}

            {activeSection === "held" && heldTokens.length === 0 && (
                <div className="profile-empty-section">
                    <Image src="/icons/coins-stacked-02.svg" alt="" width={40} height={40} className="empty-icon" style={{ opacity: 0.3, display: "block", margin: "0 auto var(--space-3)" }} />
                    <p>You don&apos;t hold any Sigil-launched tokens yet. Explore projects to get started.</p>
                </div>
            )}
        </div>
    );
}
