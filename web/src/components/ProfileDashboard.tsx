"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────

interface TokenInfo {
    address: string;
    name: string;
    ticker: string;
    color: string; // gradient start color for the icon
    role: "dev" | "holder";
    balance: string;
    escrowBalance: string;
    usdcFeesEarned: string;
    usdcFeesPending: string;
    activeProposals: number;
    totalProposals: number;
    projectId: string;
}

// ─── Mock Data ───────────────────────────────────────

const MOCK_WALLET = "0x7a3d...8F2e";
const MOCK_TOTAL_USDC_EARNED = "$4,218.50";
const MOCK_TOTAL_USDC_CLAIMABLE = "$312.80";

const MOCK_DEV_TOKENS: TokenInfo[] = [
    {
        address: "0xTOKEN1...aaaa",
        name: "NexusAI Protocol",
        ticker: "NEXUS",
        color: "#6C5CE7",
        role: "dev",
        balance: "50,000,000",
        escrowBalance: "7,300,000,000",
        usdcFeesEarned: "$2,840.00",
        usdcFeesPending: "$210.40",
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
        usdcFeesEarned: "$1,378.50",
        usdcFeesPending: "$102.40",
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
        usdcFeesEarned: "$0",
        usdcFeesPending: "$0",
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
        usdcFeesEarned: "$0",
        usdcFeesPending: "$0",
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
        usdcFeesEarned: "$0",
        usdcFeesPending: "$0",
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

// ─── Token Card ──────────────────────────────────────

function TokenCard({ token }: { token: TokenInfo }) {
    const isAboveThreshold =
        token.role === "holder" &&
        parseFloat(token.balance.replace(/,/g, "")) >= 50_000_000; // 0.05% of 100B

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

            {/* Dev fees */}
            {token.role === "dev" && (
                <div style={{ marginBottom: "var(--space-3)" }}>
                    <div className="fee-row">
                        <span className="fee-label">USDC Earned</span>
                        <span className="fee-value">{token.usdcFeesEarned}</span>
                    </div>
                    <div className="fee-row">
                        <span className="fee-label">Claimable</span>
                        <span className="fee-value" style={{ color: "var(--success)" }}>
                            {token.usdcFeesPending}
                        </span>
                    </div>
                </div>
            )}

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
                {token.role === "dev" && (
                    <button onClick={() => console.log("Claim fees for", token.ticker)}>
                        <Image src="/icons/coins-hand.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.6 }} /> Claim USDC
                    </button>
                )}
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
                    {MOCK_WALLET.charAt(2).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h1>My Dashboard</h1>
                    <span className="profile-address">{MOCK_WALLET}</span>
                </div>
            </div>

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
                    <div className="value" style={{ color: "var(--success)" }}>{MOCK_TOTAL_USDC_EARNED}</div>
                    <div className="label">Total USDC Earned</div>
                </div>
                <div className="profile-summary-card">
                    <div className="value" style={{ color: "var(--success)" }}>{MOCK_TOTAL_USDC_CLAIMABLE}</div>
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
                        {(activeSection === "dev" ? devTokens : devTokens).map((t) => (
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
                        {(activeSection === "held" ? heldTokens : heldTokens).map((t) => (
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
