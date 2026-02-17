"use client";

/**
 * Profile Dashboard
 *
 * Main dashboard showing fee claims, portfolio metrics, and token holdings.
 */

import { useState, useMemo } from "react";
import Image from "next/image";
import { useFeeVault } from "@/hooks/useFeeVault";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { EmptyState } from "@/components/common/EmptyState";
import { truncateAddress } from "@/lib/format";
import { MOCK_DEV_TOKENS, MOCK_HELD_TOKENS } from "@/fixtures";
import { FeeClaimCard } from "@/components/FeeVault/FeeClaimCard";
import { TokenSection } from "./TokenSection";

export default function ProfileDashboard() {
    const [activeSection, setActiveSection] = useState<"all" | "dev" | "held">("all");

    // Get wallet address from Privy
    const privy = useOptionalPrivy();
    const walletAddress = privy?.user?.wallet?.address as string | undefined;
    const displayAddress = walletAddress ? truncateAddress(walletAddress) : "Not connected";

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

    const tabDefinitions = useMemo(
        () =>
            [
                ["all", `All Tokens (${allTokens.length})`],
                ["dev", `My Projects (${devTokens.length})`],
                ["held", `Holdings (${heldTokens.length})`],
            ] as const,
        [allTokens.length, devTokens.length, heldTokens.length],
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
                    <div
                        className="fee-claim-card"
                        style={{ textAlign: "center", padding: "var(--space-8)" }}
                    >
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
                        <div className="value" style={{ color: "var(--success)" }}>
                            {lifetimeUsdc}
                        </div>
                        <div className="label">Lifetime Earned</div>
                    </div>
                    <div className="profile-summary-card">
                        <div className="value" style={{ color: "var(--success)" }}>
                            {claimableUsdc}
                        </div>
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
            {(activeSection === "all" || activeSection === "dev") && (
                <TokenSection
                    tokens={devTokens}
                    title="Your Projects"
                    icon="/icons/zap-fast.svg"
                    showHeader={activeSection === "all"}
                />
            )}

            {/* Held Tokens Section */}
            {(activeSection === "all" || activeSection === "held") && (
                <TokenSection
                    tokens={heldTokens}
                    title="Token Holdings"
                    icon="/icons/coins-stacked-02.svg"
                    showHeader={activeSection === "all"}
                />
            )}

            {/* Empty states with Progressive Disclosure */}
            {activeSection === "dev" && devTokens.length === 0 && (
                <EmptyState
                    className="profile-empty-section"
                    useRawClasses
                    stepHint="Get Started"
                    icon={
                        <Image
                            src="/icons/zap-fast.svg"
                            alt=""
                            width={40}
                            height={40}
                            style={{ opacity: 0.3 }}
                        />
                    }
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
                    icon={
                        <Image
                            src="/icons/coins-stacked-02.svg"
                            alt=""
                            width={40}
                            height={40}
                            style={{ opacity: 0.3 }}
                        />
                    }
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
