"use client";

/**
 * Individual Token Detail Page
 *
 * Displays token info, DexScreener chart embed, claimed/unclaimed badge,
 * market cap, volume, and chat-to-buy/sell CTAs.
 * Follows Savage design system (border-centric, lowercase headings).
 */

import {
    ArrowLeft,
    ArrowUpRight,
    CheckCircle,
    Clock,
    ExternalLink,
    Layers3,
    MessageCircle,
    TrendingUp,
    User,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import { apiClient } from "@/lib/api-client";
import type { LaunchListItem } from "@/types";

function short(value: string, start = 6, end = 4): string {
    if (value.length <= start + end + 1) return value;
    return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function formatUsd(value: number | null): string {
    if (value === null || value === undefined) return "—";
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
    if (value >= 1) return `$${value.toFixed(0)}`;
    return `$${value.toFixed(2)}`;
}

function displayName(launch: LaunchListItem): string {
    if (launch.name) return launch.name;
    const colon = launch.projectId.indexOf(":");
    return colon > -1 ? launch.projectId.slice(colon + 1) : launch.projectId;
}

export default function TokenDetailPage() {
    const params = useParams<{ address: string }>();
    const address = params.address;

    const [token, setToken] = useState<LaunchListItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchToken = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiClient.launch.list({ q: address, limit: 1 });
            if (data.launches.length > 0) {
                setToken(data.launches[0]);
            } else {
                setError("Token not found");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load token");
        } finally {
            setLoading(false);
        }
    }, [address]);

    useEffect(() => {
        void fetchToken();
    }, [fetchToken]);

    if (loading) {
        return (
            <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
                <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex items-center justify-center">
                    <p className="text-muted-foreground">Loading token data...</p>
                </div>
            </section>
        );
    }

    if (error || !token) {
        return (
            <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
                <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col items-center justify-center gap-4">
                    <p className="text-destructive">{error || "Token not found"}</p>
                    <Link href="/launches">
                        <Button variant="outline" className="gap-2">
                            <ArrowLeft className="size-4" />
                            Back to launches
                        </Button>
                    </Link>
                </div>
            </section>
        );
    }

    const name = displayName(token);
    const symbol = token.name?.match(/:\s*(.+)/)?.[1] || name;

    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                {/* ─── Header Band ─── */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-lavender/20"
                >
                    <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
                            <div className="flex items-center gap-3 mb-2">
                                <Link
                                    href="/launches"
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <ArrowLeft className="size-4" />
                                </Link>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    token detail
                                </p>
                                {token.ownerWallet ? (
                                    <Badge className="bg-green-100 text-green-700">
                                        <CheckCircle className="size-3 mr-1" />
                                        Claimed
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">
                                        <Clock className="size-3 mr-1" />
                                        Unclaimed
                                    </Badge>
                                )}
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground lowercase mb-2">
                                {name}
                            </h1>
                            <a
                                href={`https://basescan.org/address/${token.poolTokenAddress}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-mono text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                                {token.poolTokenAddress}
                                <ArrowUpRight className="size-3" />
                            </a>
                        </div>
                    </div>
                </PixelCard>

                {/* ─── Stats Band ─── */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-3 lg:px-12 border-border border-b bg-sage/20">
                        <h2 className="text-xs text-muted-foreground uppercase tracking-wider">
                            market data
                        </h2>
                    </div>
                    <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
                        <div className="flex-1 px-6 py-5 lg:px-12">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Market Cap
                            </p>
                            <p className="text-2xl font-semibold text-foreground flex items-center gap-2">
                                <TrendingUp className="size-5 text-primary" />
                                {formatUsd(token.marketCap)}
                            </p>
                        </div>
                        <div className="flex-1 px-6 py-5 lg:px-12">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Volume 24h
                            </p>
                            <p className="text-2xl font-semibold text-foreground">
                                {formatUsd(token.volume24h)}
                            </p>
                        </div>
                        <div className="flex-1 px-6 py-5 lg:px-12">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Owner
                            </p>
                            <div className="flex items-center gap-2">
                                <User className="size-4 text-muted-foreground" />
                                <p className="text-sm font-mono text-foreground">
                                    {token.ownerWallet ? short(token.ownerWallet, 8, 6) : "Unclaimed"}
                                </p>
                            </div>
                        </div>
                        <div className="flex-1 px-6 py-5 lg:px-12">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Deployer
                            </p>
                            <div className="flex items-center gap-2">
                                <Layers3 className="size-4 text-muted-foreground" />
                                <p className="text-sm text-foreground">
                                    {token.deployedBy || "unknown"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ─── Chart Band ─── */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-3 lg:px-12 border-border border-b bg-lavender/20">
                        <h2 className="text-xs text-muted-foreground uppercase tracking-wider">
                            price chart
                        </h2>
                    </div>
                    <div className="w-full" style={{ height: "500px" }}>
                        <iframe
                            src={`https://dexscreener.com/base/${token.poolTokenAddress}?embed=1&theme=light&info=0`}
                            title="DexScreener Chart"
                            className="w-full h-full border-0"
                            allow="clipboard-write"
                            loading="lazy"
                        />
                    </div>
                </div>

                {/* ─── Actions Band ─── */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-3 lg:px-12 border-border border-b bg-sage/20">
                        <h2 className="text-xs text-muted-foreground uppercase tracking-wider">
                            trade
                        </h2>
                    </div>
                    <div className="px-6 py-6 lg:px-12">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <Link href={`/chat?prompt=${encodeURIComponent(`Buy ${symbol}`)}`} className="flex-1">
                                <Button size="lg" className="w-full gap-2 bg-green-700 hover:bg-green-800 text-white">
                                    <MessageCircle className="size-5" />
                                    Chat to Buy
                                </Button>
                            </Link>
                            <Link href={`/chat?prompt=${encodeURIComponent(`Sell ${symbol}`)}`} className="flex-1">
                                <Button size="lg" variant="outline" className="w-full gap-2 border-red-300 text-red-700 hover:bg-red-50">
                                    <MessageCircle className="size-5" />
                                    Chat to Sell
                                </Button>
                            </Link>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            Opens the Sigil chat with a pre-filled trade command. You can adjust amount and confirm before executing.
                        </p>
                    </div>
                </div>

                {/* ─── External Links Band ─── */}
                <div className="bg-background px-6 py-5 lg:px-12 flex flex-wrap items-center gap-3">
                    <a href={token.explorerUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2">
                            <ExternalLink className="size-4" />
                            Basescan
                        </Button>
                    </a>
                    <a href={token.dexUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2">
                            <TrendingUp className="size-4" />
                            DexScreener
                        </Button>
                    </a>
                    <Link href={`/governance?token=${token.poolTokenAddress}`}>
                        <Button variant="outline">Governance</Button>
                    </Link>
                    <Link href="/launches">
                        <Button variant="ghost" className="gap-2">
                            <ArrowLeft className="size-4" />
                            All Launches
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
