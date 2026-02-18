"use client";

/**
 * Profile Dashboard
 *
 * Main dashboard showing claimable tokens, verified projects, and portfolio metrics.
 * Fetches real project data from the backend API.
 */

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useFeeVault } from "@/hooks/useFeeVault";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { useIsPrivyConfigured } from "@/providers/PrivyAuthProvider";
import { EmptyState } from "@/components/common/EmptyState";
import { truncateAddress } from "@/lib/format";
import { apiClient } from "@/lib/api-client";
import { FeeClaimCard } from "@/components/FeeVault/FeeClaimCard";
import { ProjectSection } from "./TokenSection";
import type { ProjectInfo } from "@/types";

export default function ProfileDashboard() {
    const isPrivyConfigured = useIsPrivyConfigured();

    // Get wallet address + access token from Privy
    const privy = useOptionalPrivy();
    const walletAddress = privy?.user?.wallet?.address as string | undefined;
    const displayAddress = walletAddress ? truncateAddress(walletAddress) : "Not connected";

    // Real project data from API
    const [projects, setProjects] = useState<ProjectInfo[]>([]);
    const [claimableProjects, setClaimableProjects] = useState<ProjectInfo[]>([]);
    const [projectsLoading, setProjectsLoading] = useState(false);
    const [projectsError, setProjectsError] = useState<string | null>(null);

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

    // Fetch user's projects when authenticated
    useEffect(() => {
        let cancelled = false;

        async function loadProjects() {
            if (!privy?.authenticated || !privy?.getAccessToken) return;

            setProjectsLoading(true);
            setProjectsError(null);

            try {
                const token = await privy.getAccessToken();
                if (!token || cancelled) return;

                const data = await apiClient.launch.myProjects(token);
                if (!cancelled) {
                    setProjects(data.projects);
                    setClaimableProjects(data.claimableProjects);
                }
            } catch (err) {
                if (!cancelled) {
                    setProjectsError(err instanceof Error ? err.message : "Failed to load projects");
                }
            } finally {
                if (!cancelled) {
                    setProjectsLoading(false);
                }
            }
        }

        loadProjects();
        return () => { cancelled = true; };
    }, [privy?.authenticated, privy?.getAccessToken]);

    const totalFees = [...projects, ...claimableProjects].reduce((sum, p) => {
        return sum + Number(p.feesAccruedWei || "0");
    }, 0);
    const totalFeesUsdc = totalFees > 0
        ? `$${(totalFees / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "$0.00";

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
                            {isPrivyConfigured
                                ? "Connect your wallet to view and claim fee earnings."
                                : "Sign in is not configured in this environment. Add NEXT_PUBLIC_PRIVY_APP_ID to enable wallet connection."}
                        </p>
                    </div>
                )}
            </div>

            {/* Miller's Law: Chunk 2 - At a Glance */}
            <div className="dashboard-chunk">
                <h2 className="chunk-title">
                    <span className="chunk-icon">📊</span>
                    At a Glance
                </h2>
                <div className="profile-summary">
                    <div className="profile-summary-card">
                        <div className="value">{projects.length}</div>
                        <div className="label">Your Projects</div>
                    </div>
                    <div className="profile-summary-card">
                        <div className="value" style={{ color: "var(--warning)" }}>
                            {claimableProjects.length}
                        </div>
                        <div className="label">Claimable</div>
                    </div>
                    <div className="profile-summary-card">
                        <div className="value" style={{ color: "var(--success)" }}>
                            {totalFeesUsdc}
                        </div>
                        <div className="label">Fees Accrued</div>
                    </div>
                    <div className="profile-summary-card">
                        <div className="value" style={{ color: "var(--success)" }}>
                            {claimableUsdc}
                        </div>
                        <div className="label">Claimable USDC</div>
                    </div>
                </div>
            </div>

            {/* Loading state */}
            {projectsLoading && (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    Loading your projects…
                </div>
            )}

            {/* Error state */}
            {projectsError && (
                <div style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--danger)" }}>
                    {projectsError}
                </div>
            )}

            {/* Miller's Law: Chunk 3 - Claimable Tokens */}
            {!projectsLoading && !projectsError && claimableProjects.length > 0 && (
                <div className="dashboard-chunk">
                    <h2 className="chunk-title">
                        <span className="chunk-icon">🎁</span>
                        Claimable Tokens
                    </h2>
                    <p style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--text-sm)",
                        margin: "0 0 var(--space-4) 0",
                    }}>
                        These tokens are linked to your GitHub repos but haven&apos;t been claimed yet.
                        Verify ownership to claim them.
                    </p>
                    <ProjectSection
                        projects={claimableProjects}
                        title="Claimable Tokens"
                        icon="/icons/zap-fast.svg"
                        showHeader={false}
                        claimable
                    />
                </div>
            )}

            {/* Miller's Law: Chunk 4 - Your Projects */}
            <div className="dashboard-chunk">
                <h2 className="chunk-title">
                    <span className="chunk-icon">💎</span>
                    Your Projects
                </h2>

                {/* Real projects */}
                {!projectsLoading && !projectsError && projects.length > 0 && (
                    <ProjectSection
                        projects={projects}
                        title="Verified Projects"
                        icon="/icons/zap-fast.svg"
                        showHeader={false}
                    />
                )}

                {/* Empty state */}
                {!projectsLoading && !projectsError && projects.length === 0 && claimableProjects.length === 0 && (
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
                        title="No projects found"
                        description="No tokens are linked to your GitHub account yet. Launch a token or verify your ownership of an existing project."
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
            </div>
        </div>
    );
}
