"use client";

/**
 * Profile Dashboard
 *
 * Main dashboard showing claimable tokens, verified projects, and portfolio metrics.
 * Fetches real project data from the backend API.
 * Border-centric pastel design system.
 */

import {
    AlertCircle,
    ChevronRight,
    DollarSign,
    ExternalLink,
    FolderGit2,
    Gift,
    Rocket,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { FeeClaimCard } from "@/components/FeeVault/FeeClaimCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFeeVault } from "@/hooks/useFeeVault";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { apiClient } from "@/lib/api-client";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useIsPrivyConfigured } from "@/providers/PrivyAuthProvider";
import type { ProjectInfo } from "@/types";

import { ProjectSection } from "./TokenSection";

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
    const loadProjects = useCallback(async () => {
        if (!privy?.authenticated || !privy?.getAccessToken) return;

        setProjectsLoading(true);
        setProjectsError(null);

        try {
            const token = await privy.getAccessToken();
            if (!token) return;

            const data = await apiClient.launch.myProjects(token);
            setProjects(data.projects);
            setClaimableProjects(data.claimableProjects);
        } catch (err) {
            setProjectsError(err instanceof Error ? err.message : "Failed to load projects");
        } finally {
            setProjectsLoading(false);
        }
    }, [privy]);

    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    const tokensDeployed = projects.filter((p) => p.poolTokenAddress).length;

    const totalFees = [...projects, ...claimableProjects].reduce((sum, p) => {
        return sum + Number(p.feesAccruedWei || "0");
    }, 0);
    const totalFeesUsdc =
        totalFees > 0
            ? `$${(totalFees / 1e6).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : "$0.00";

    const stats = [
        { label: "Your Projects", value: projects.length.toString(), icon: FolderGit2 },
        { label: "Tokens Deployed", value: tokensDeployed.toString(), icon: Rocket },
        { label: "Fees Accrued", value: totalFeesUsdc, icon: TrendingUp },
        { label: "Claimable Now", value: claimableUsdc, icon: DollarSign, highlight: true },
    ];

    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream">
                {/* Profile Header */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-2/3 px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <div className="flex items-center gap-4">
                                <div className="size-16 bg-lavender flex items-center justify-center shrink-0 border border-border">
                                    <span className="text-2xl font-semibold text-primary">
                                        {walletAddress
                                            ? walletAddress.charAt(2).toUpperCase()
                                            : "?"}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-foreground">
                                        My Dashboard
                                    </h1>
                                    <p className="text-muted-foreground font-mono text-sm">
                                        {displayAddress}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="lg:w-1/3 px-6 py-8 lg:px-12 flex items-center justify-between lg:justify-center">
                            <Badge variant="sage" className="text-sm">
                                SIGIL ACTIVE
                            </Badge>
                            <Link href="/verify" className="lg:hidden">
                                <Button variant="outline" size="sm">
                                    Manage
                                    <ChevronRight className="size-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Fee Claim Section */}
                {walletAddress && (
                    <div className="border-border border-b bg-rose/30 px-6 py-6 lg:px-12">
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
                    </div>
                )}

                {!walletAddress && (
                    <div className="border-border border-b bg-rose/30 px-6 py-8 lg:px-12">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="size-5 text-orange-600" />
                            <span className="text-sm font-medium text-foreground uppercase tracking-wider">
                                Connect Wallet
                            </span>
                        </div>
                        <p className="text-muted-foreground">
                            {isPrivyConfigured
                                ? "Connect your wallet to view and claim fee earnings."
                                : "Sign in is not configured in this environment. Add NEXT_PUBLIC_PRIVY_APP_ID to enable wallet connection."}
                        </p>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col sm:flex-row">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className={cn(
                                    "flex-1 px-6 py-6 lg:px-8",
                                    "border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0",
                                    stat.highlight && "bg-primary/5",
                                )}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <stat.icon className="size-4 text-primary" />
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                        {stat.label}
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        "text-2xl font-semibold",
                                        stat.highlight ? "text-primary" : "text-foreground",
                                    )}
                                >
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Loading state */}
                {projectsLoading && (
                    <div className="px-6 py-16 lg:px-12 text-center border-border border-b bg-background">
                        <p className="text-muted-foreground">Loading your projects…</p>
                    </div>
                )}

                {/* Error state */}
                {projectsError && (
                    <div className="px-6 py-16 lg:px-12 text-center border-border border-b bg-background">
                        <p className="text-destructive">{projectsError}</p>
                    </div>
                )}

                {/* Claimable Tokens Section */}
                {!projectsLoading && !projectsError && claimableProjects.length > 0 && (
                    <div className="bg-background">
                        <div className="px-6 py-4 lg:px-12 border-border border-b bg-orange-50">
                            <div className="flex items-center gap-2">
                                <Gift className="size-5 text-orange-500" />
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    claimable tokens
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                These tokens are linked to your GitHub repos but haven&apos;t been
                                claimed yet. Verify ownership to claim them.
                            </p>
                        </div>
                        <ProjectSection projects={claimableProjects} showHeader={false} claimable />
                    </div>
                )}

                {/* Projects Section */}
                <div className="bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            your projects
                        </h2>
                    </div>

                    {/* Real projects */}
                    {!projectsLoading && !projectsError && projects.length > 0 && (
                        <ProjectSection projects={projects} showHeader={false} />
                    )}

                    {/* Empty state */}
                    {!projectsLoading &&
                        !projectsError &&
                        projects.length === 0 &&
                        claimableProjects.length === 0 && (
                            <div className="px-6 py-16 lg:px-12 text-center border-border border-b bg-background">
                                <FolderGit2 className="size-12 mx-auto mb-4 text-muted-foreground/30" />
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    No projects found
                                </h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                                    No tokens are linked to your GitHub account yet. Launch a token
                                    or verify your ownership of an existing project.
                                </p>
                                <div className="flex items-center justify-center gap-4">
                                    <Link href="/verify">
                                        <Button>Verify a Project</Button>
                                    </Link>
                                    <Link href="/developers">
                                        <Button variant="outline">Learn how it works</Button>
                                    </Link>
                                </div>
                            </div>
                        )}
                </div>

                {/* Quick Actions */}
                <div className="border-border border-t bg-sage/50">
                    <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 px-6 py-6 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <h3 className="font-semibold text-foreground mb-2">View Attestation</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Check your onchain Sigil on EAS Explorer
                            </p>
                            <Link
                                href="https://base.easscan.org"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Button variant="outline" size="sm" className="gap-2">
                                    <ExternalLink className="size-4" />
                                    EAS Explorer
                                </Button>
                            </Link>
                        </div>
                        <div className="flex-1 px-6 py-6 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <h3 className="font-semibold text-foreground mb-2">Governance</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Vote on milestone proposals for your projects
                            </p>
                            <Link href="/governance">
                                <Button variant="outline" size="sm">
                                    View Proposals
                                </Button>
                            </Link>
                        </div>
                        <div className="flex-1 px-6 py-6 lg:px-12">
                            <h3 className="font-semibold text-foreground mb-2">Add Verification</h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Strengthen your Sigil with more channels
                            </p>
                            <Link href="/verify">
                                <Button variant="outline" size="sm">
                                    Add Channel
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
