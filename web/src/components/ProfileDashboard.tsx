"use client";

import { useState, memo, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFeeVault } from "@/hooks/useFeeVault";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { LoadingButton } from "@/components/common/LoadingButton";
import { EmptyState } from "@/components/common/EmptyState";
import { formatNumericString, truncateAddress } from "@/lib/format";
import { MOCK_DEV_TOKENS, MOCK_HELD_TOKENS } from "@/fixtures";
import type { TokenInfo } from "@/types";

// ─── Fee Claim Card (with Loss Aversion framing) ──────

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
    const claimableAmount = parseFloat(claimableUsdc.replace(/[$,]/g, "")) || 0;

    // Loss aversion: urgency levels based on amount
    const isHighValue = claimableAmount >= 100;
    const isMediumValue = claimableAmount >= 25;

    // Simulate days until expiry (in production, get from contract)
    const daysUntilExpiry = 23;
    const isNearExpiry = daysUntilExpiry <= 7;

    return (
        <div className={`fee-claim-card ${isHighValue ? "fee-claim-urgent" : ""}`}>
            <div className="fee-claim-header">
                <div>
                    <h3 style={{ margin: 0, fontSize: "var(--text-sm)", color: isHighValue ? "var(--warning)" : "var(--text-secondary)" }}>
                        {isZero ? "Claimable USDC" : "Unclaimed USDC"}
                    </h3>
                    <div className="fee-claim-amount" style={{ color: isHighValue ? "var(--warning)" : undefined }}>
                        {loading ? (
                            <span className="spinner" style={{ width: 20, height: 20 }} />
                        ) : (
                            claimableUsdc
                        )}
                    </div>
                    {/* Loss aversion: urgency message */}
                    {!isZero && !loading && (
                        <p className={`fee-claim-urgency ${isNearExpiry ? "urgent" : ""}`}>
                            {isNearExpiry
                                ? `Claim within ${daysUntilExpiry} days or fees return to protocol`
                                : isMediumValue
                                    ? "Don't leave money on the table"
                                    : `${daysUntilExpiry} days to claim`}
                        </p>
                    )}
                </div>
                <button
                    type="button"
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
                {!isZero && (
                    <div className="fee-claim-stat">
                        <span className="fee-label">Expiry</span>
                        <span className={`fee-value ${isNearExpiry ? "fee-expiry-urgent" : ""}`}>
                            {daysUntilExpiry} days
                        </span>
                    </div>
                )}
            </div>

            <LoadingButton
                className={`fee-claim-btn ${isHighValue ? "fee-claim-btn-urgent" : ""}`}
                onClick={onClaim}
                loading={claiming}
                disabled={isZero || loading}
                loadingText="Claiming…"
            >
                <Image
                    src="/icons/coins-hand.svg"
                    alt=""
                    width={16}
                    height={16}
                    style={{ display: "inline", verticalAlign: "middle", marginRight: 6, opacity: 0.7 }}
                />
                {isZero ? "No USDC to Claim" : `Claim ${claimableUsdc} Now`}
            </LoadingButton>

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
            {error && <ErrorAlert error={error} className="fee-claim-error" />}
        </div>
    );
}

// ─── Token Card ──────────────────────────────────────

const TokenCard = memo(function TokenCard({ token }: { token: TokenInfo }) {
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
                    <div className="stat-value">{formatNumericString(token.balance)}</div>
                    <div className="stat-label">Your Balance</div>
                </div>
                <div className="token-stat">
                    <div className="stat-value">{formatNumericString(token.escrowBalance)}</div>
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
});

// ─── Main Dashboard ──────────────────────────────────

export default function ProfileDashboard() {
    const [activeSection, setActiveSection] = useState<"all" | "dev" | "held">("all");

    // Get wallet address from Privy
    const privy = useOptionalPrivy();
    const walletAddress = privy?.user?.wallet?.address as string | undefined;
    const displayAddress = walletAddress
        ? truncateAddress(walletAddress)
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

    const tabDefinitions = useMemo(
        () =>
            [
                ["all", `All Tokens (${allTokens.length})`],
                ["dev", `My Projects (${devTokens.length})`],
                ["held", `Holdings (${heldTokens.length})`],
            ] as const,
        [allTokens.length, devTokens.length, heldTokens.length]
    );

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

            {/* Miller's Law: Chunk 1 - Take Action (urgent items requiring attention) */}
            <div className="dashboard-chunk">
                <h2 className="chunk-title">
                    <span className="chunk-icon">⚡</span>
                    Take Action
                </h2>

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
            </div>

            {/* Miller's Law: Chunk 2 - At a Glance (max 4-5 key metrics) */}
            <div className="dashboard-chunk">
                <h2 className="chunk-title">
                    <span className="chunk-icon">📊</span>
                    At a Glance
                </h2>
                <div className="profile-summary">
                    <div className="profile-summary-card">
                        <div className="value">{devTokens.length + heldTokens.length}</div>
                        <div className="label">Total Tokens</div>
                    </div>
                    <div className="profile-summary-card">
                        <div className="value">{devTokens.length}</div>
                        <div className="label">Your Projects</div>
                    </div>
                    <div className="profile-summary-card">
                        <div className="value" style={{ color: "var(--success)" }}>{lifetimeUsdc}</div>
                        <div className="label">Lifetime Earned</div>
                    </div>
                    <div className="profile-summary-card">
                        <div className="value" style={{ color: "var(--success)" }}>{claimableUsdc}</div>
                        <div className="label">Claimable Now</div>
                    </div>
                </div>
            </div>

            {/* Miller's Law: Chunk 3 - Your Portfolio */}
            <div className="dashboard-chunk">
                <h2 className="chunk-title">
                    <span className="chunk-icon">💎</span>
                    Your Portfolio
                </h2>

                {/* Filter tabs */}
                <div className="gov-tabs" style={{ marginBottom: "var(--space-6)" }}>
                    {tabDefinitions.map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            className={`gov-tab ${activeSection === key ? "active" : ""}`}
                            onClick={() => setActiveSection(key as "all" | "dev" | "held")}
                        >
                            {label}
                        </button>
                    ))}
                </div>
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

            {/* Empty states with Progressive Disclosure */}
            {activeSection === "dev" && devTokens.length === 0 && (
                <EmptyState
                    className="profile-empty-section"
                    useRawClasses
                    stepHint="Get Started"
                    icon={<Image src="/icons/zap-fast.svg" alt="" width={40} height={40} style={{ opacity: 0.3 }} />}
                    title="You haven't launched any tokens yet"
                    description="Verify your project ownership to create a Sigil token and start earning USDC fees from LP activity."
                    action={{
                        label: "Verify a Project",
                        href: "/verify",
                    }}
                    secondaryAction={{
                        label: "Learn how it works",
                        href: "/developers",
                    }}
                />
            )}

            {activeSection === "held" && heldTokens.length === 0 && (
                <EmptyState
                    className="profile-empty-section"
                    useRawClasses
                    stepHint="Discover"
                    icon={<Image src="/icons/coins-stacked-02.svg" alt="" width={40} height={40} style={{ opacity: 0.3 }} />}
                    title="You don't hold any Sigil-launched tokens"
                    description="Browse verified projects and back the builders shaping the agentic economy."
                    action={{
                        label: "Explore Projects",
                        href: "/chat",
                    }}
                />
            )}
        </div>
    );
}
