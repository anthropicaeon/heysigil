"use client";

/**
 * Profile Dashboard
 *
 * Main dashboard showing claimable tokens, verified projects, and portfolio metrics.
 * Memorable border-centric design with PixelCard heroes and visual flows.
 */

import {
    AlertCircle,
    ArrowRight,
    ChevronRight,
    CircleDollarSign,
    DollarSign,
    ExternalLink,
    FolderGit2,
    Gift,
    Landmark,
    Rocket,
    Shield,
    TrendingUp,
    Wallet,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { FeeClaimCard } from "@/components/FeeVault/FeeClaimCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
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
        {
            label: "Your Projects",
            value: projects.length.toString(),
            icon: FolderGit2,
            color: "text-blue-600",
            bg: "bg-blue-50",
        },
        {
            label: "Tokens Deployed",
            value: tokensDeployed.toString(),
            icon: Rocket,
            color: "text-purple-600",
            bg: "bg-purple-50",
        },
        {
            label: "Fees Accrued",
            value: totalFeesUsdc,
            icon: TrendingUp,
            color: "text-green-600",
            bg: "bg-green-50",
        },
        {
            label: "Claimable Now",
            value: claimableUsdc,
            icon: DollarSign,
            color: "text-primary",
            bg: "bg-primary/10",
            highlight: true,
        },
    ];

    const flowSteps = [
        { label: "Verify", icon: Shield, color: "bg-lavender/50" },
        { label: "Deploy", icon: Rocket, color: "bg-blue-50" },
        { label: "Earn", icon: CircleDollarSign, color: "bg-green-50" },
        { label: "Claim", icon: Wallet, color: "bg-primary/10" },
    ];

    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                {/* Hero Header with PixelCard */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-lavender/20"
                >
                    <div className="flex flex-col lg:flex-row">
                        {/* Avatar Cell */}
                        <div className="lg:w-32 px-6 py-8 lg:px-0 lg:py-0 flex items-center justify-center border-border border-b lg:border-b-0 lg:border-r">
                            <div className="size-20 bg-lavender/60 border-2 border-border flex items-center justify-center">
                                <span className="text-3xl font-bold text-primary">
                                    {walletAddress ? walletAddress.charAt(2).toUpperCase() : "?"}
                                </span>
                            </div>
                        </div>

                        {/* Title Section with Accent */}
                        <div className="flex-1 px-6 py-8 lg:px-10 lg:py-10 border-l-4 border-l-primary">
                            <div className="flex items-center gap-3 mb-2">
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    builder dashboard
                                </p>
                                <Badge variant="sage" className="text-xs">
                                    <Zap className="size-3 mr-1" />
                                    SIGIL ACTIVE
                                </Badge>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground lowercase mb-2">
                                my portfolio
                            </h1>
                            <p className="text-muted-foreground font-mono text-sm flex items-center gap-2">
                                <Wallet className="size-4" />
                                {displayAddress}
                            </p>
                        </div>

                        {/* Quick Action Cell */}
                        <div className="hidden lg:flex lg:w-48 items-center justify-center px-6 border-border border-l">
                            <Link href="/verify">
                                <Button variant="outline" className="gap-2">
                                    <Shield className="size-4" />
                                    Verify
                                </Button>
                            </Link>
                        </div>
                    </div>
                </PixelCard>

                {/* Stats Row - Dramatic Bordered Cells */}
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-border border-b bg-background">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className={cn(
                                "flex-1 px-6 py-6 lg:px-8 text-center",
                                stat.highlight && "bg-primary/5",
                            )}
                        >
                            <div
                                className={cn(
                                    "inline-flex items-center justify-center size-10 mb-3 border border-border",
                                    stat.bg,
                                )}
                            >
                                <stat.icon className={cn("size-5", stat.color)} />
                            </div>
                            <div className={cn("text-3xl font-bold mb-1", stat.color)}>
                                {stat.value}
                            </div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Visual Flow */}
                <div className="bg-sage/10 border-border border-b">
                    <div className="px-6 py-3 lg:px-8 border-border border-b">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            How Sigil Works
                        </span>
                    </div>
                    <div className="flex items-stretch divide-x divide-border">
                        {flowSteps.map((step, index) => (
                            <div
                                key={step.label}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-4 py-4 lg:py-5",
                                    step.color,
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="size-8 border border-border bg-background flex items-center justify-center">
                                        <step.icon className="size-4 text-foreground" />
                                    </div>
                                    <span className="text-sm font-medium text-foreground hidden sm:inline">
                                        {step.label}
                                    </span>
                                </div>
                                {index < flowSteps.length - 1 && (
                                    <ArrowRight className="size-4 text-muted-foreground/50 hidden lg:block ml-2" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Fee Claim Section */}
                {walletAddress && (
                    <div className="border-border border-b">
                        <div className="px-6 py-3 lg:px-8 border-border border-b bg-rose/20">
                            <div className="flex items-center gap-2">
                                <CircleDollarSign className="size-4 text-primary" />
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Fee Earnings
                                </span>
                            </div>
                        </div>
                        <div className="px-6 py-6 lg:px-8 bg-rose/10">
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
                    </div>
                )}

                {!walletAddress && (
                    <div className="border-border border-b">
                        <div className="flex flex-col lg:flex-row">
                            <div className="lg:w-16 flex items-center justify-center px-4 py-4 lg:py-0 border-border border-b lg:border-b-0 lg:border-r bg-orange-50">
                                <AlertCircle className="size-6 text-orange-600" />
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 bg-orange-50/50">
                                <h3 className="font-semibold text-foreground mb-1">
                                    Connect Wallet
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {isPrivyConfigured
                                        ? "Connect your wallet to view and claim fee earnings."
                                        : "Sign in is not configured in this environment."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading state */}
                {projectsLoading && (
                    <div className="px-6 py-16 lg:px-12 text-center border-border border-b bg-background">
                        <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading your projects…</p>
                    </div>
                )}

                {/* Error state */}
                {projectsError && (
                    <div className="border-border border-b">
                        <div className="flex flex-col lg:flex-row">
                            <div className="lg:w-16 flex items-center justify-center px-4 py-4 lg:py-0 border-border border-b lg:border-b-0 lg:border-r bg-red-50">
                                <AlertCircle className="size-6 text-red-600" />
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 bg-red-50/50">
                                <p className="text-destructive">{projectsError}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Claimable Tokens Section */}
                {!projectsLoading && !projectsError && claimableProjects.length > 0 && (
                    <div className="bg-background">
                        <div className="border-border border-b bg-orange-50">
                            <div className="flex items-center gap-3 px-6 py-4 lg:px-8">
                                <div className="size-10 bg-orange-100 border border-orange-200 flex items-center justify-center">
                                    <Gift className="size-5 text-orange-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground lowercase">
                                        claimable tokens
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Tokens linked to your repos awaiting verification
                                    </p>
                                </div>
                            </div>
                        </div>
                        <ProjectSection projects={claimableProjects} showHeader={false} claimable />
                    </div>
                )}

                {/* Projects Section */}
                <div className="bg-background flex-1 flex flex-col">
                    <div className="px-6 py-4 lg:px-8 border-border border-b bg-sage/20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-sage/40 border border-border flex items-center justify-center">
                                    <FolderGit2 className="size-5 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-foreground lowercase">
                                        your projects
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Verified projects earning fees
                                    </p>
                                </div>
                            </div>
                            {projects.length > 0 && (
                                <Badge variant="outline">{projects.length} projects</Badge>
                            )}
                        </div>
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
                            <PixelCard
                                variant="sage"
                                active
                                centerFade
                                noFocus
                                className="flex-1 flex flex-col border-border border-b"
                            >
                                <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:px-12 text-center">
                                    <div className="size-20 bg-sage/40 border-2 border-border flex items-center justify-center mb-6">
                                        <FolderGit2 className="size-10 text-muted-foreground/60" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-foreground mb-3 lowercase">
                                        no projects yet
                                    </h3>
                                    <p className="text-muted-foreground max-w-md mb-8">
                                        No tokens are linked to your GitHub account yet. Launch a
                                        token or verify your ownership of an existing project to
                                        start earning fees.
                                    </p>
                                    <div className="flex items-center justify-center gap-4">
                                        <Link href="/verify">
                                            <Button size="lg" className="gap-2">
                                                Verify a Project
                                                <ArrowRight className="size-4" />
                                            </Button>
                                        </Link>
                                        <Link href="/developers">
                                            <Button variant="outline" size="lg">
                                                Learn More
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </PixelCard>
                        )}
                </div>

                {/* Quick Actions Footer */}
                <div className="border-border border-t">
                    <div className="px-6 py-3 lg:px-8 border-border border-b bg-cream/50">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Quick Actions
                        </span>
                    </div>
                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border">
                        {/* View Attestation */}
                        <div className="flex-1 px-6 py-5 lg:px-8 bg-sage/20">
                            <div className="flex items-start gap-3">
                                <div className="size-10 bg-sage/40 border border-border flex items-center justify-center shrink-0">
                                    <Shield className="size-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground mb-1">
                                        View Attestation
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-3">
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
                            </div>
                        </div>

                        {/* Governance */}
                        <div className="flex-1 px-6 py-5 lg:px-8 bg-lavender/20">
                            <div className="flex items-start gap-3">
                                <div className="size-10 bg-lavender/40 border border-border flex items-center justify-center shrink-0">
                                    <Landmark className="size-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground mb-1">
                                        Governance
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Vote on milestone proposals for your projects
                                    </p>
                                    <Link href="/governance">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            View Proposals
                                            <ChevronRight className="size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Add Verification */}
                        <div className="flex-1 px-6 py-5 lg:px-8 bg-cream/30">
                            <div className="flex items-start gap-3">
                                <div className="size-10 bg-cream/60 border border-border flex items-center justify-center shrink-0">
                                    <Zap className="size-5 text-amber-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-foreground mb-1">
                                        Add Verification
                                    </h3>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Strengthen your Sigil with more channels
                                    </p>
                                    <Link href="/verify">
                                        <Button variant="outline" size="sm" className="gap-2">
                                            Add Channel
                                            <ChevronRight className="size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
