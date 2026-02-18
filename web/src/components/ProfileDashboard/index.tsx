"use client";

/**
 * Profile Dashboard
 *
 * Main dashboard showing fee claims, portfolio metrics, and token holdings.
 * Updated with pastel design system.
 */

import {
    AlertCircle,
    ChevronRight,
    Coins,
    DollarSign,
    ExternalLink,
    FolderGit2,
    TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { FeeClaimCard } from "@/components/FeeVault/FeeClaimCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_DEV_TOKENS, MOCK_HELD_TOKENS } from "@/fixtures";
import { useFeeVault } from "@/hooks/useFeeVault";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { truncateAddress } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useIsPrivyConfigured } from "@/providers/PrivyAuthProvider";

import { TokenSection } from "./TokenSection";

type TabFilter = "all" | "dev" | "held";

const tabs: { id: TabFilter; label: string }[] = [
    { id: "all", label: "All Tokens" },
    { id: "dev", label: "My Projects" },
    { id: "held", label: "Holdings" },
];

export default function ProfileDashboard() {
    const [activeTab, setActiveTab] = useState<TabFilter>("all");
    const isPrivyConfigured = useIsPrivyConfigured();

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

    const filteredTokens = useMemo(() => {
        if (activeTab === "all") return allTokens;
        if (activeTab === "dev") return devTokens;
        return heldTokens;
    }, [activeTab, allTokens, devTokens, heldTokens]);

    const stats = [
        { label: "Total Tokens", value: allTokens.length.toString(), icon: Coins },
        { label: "Your Projects", value: devTokens.length.toString(), icon: FolderGit2 },
        { label: "Lifetime Earned", value: lifetimeUsdc, icon: TrendingUp },
        { label: "Claimable Now", value: claimableUsdc, icon: DollarSign, highlight: true },
    ];

    return (
        <section className="min-h-screen bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
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

                {/* Portfolio Section */}
                <div className="bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            your portfolio
                        </h2>
                    </div>

                    {/* Tab Bar */}
                    <div className="flex border-border border-b overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-6 py-4 lg:px-8 text-sm font-medium transition-colors whitespace-nowrap",
                                    "border-border border-r last:border-r-0",
                                    activeTab === tab.id
                                        ? "bg-primary/5 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Token Grid */}
                    {filteredTokens.length > 0 ? (
                        <TokenSection tokens={filteredTokens} showHeader={false} />
                    ) : (
                        <div className="px-6 py-16 lg:px-12 text-center border-border border-b bg-background">
                            <p className="text-muted-foreground">No tokens found</p>
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
