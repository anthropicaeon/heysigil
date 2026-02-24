import { ArrowUpRight, CheckCircle, Clock, Coins, ExternalLink, Layers3, TrendingUp, User } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LaunchListItem } from "@/types";

function hashIndex(str: string, bucketCount: number): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % bucketCount;
}

function avatarAccent(platform: string, projectId: string): string {
    const byPlatform: Record<string, string> = {
        github: "bg-sage/40",
        twitter: "bg-lavender/40",
        facebook: "bg-rose/40",
        instagram: "bg-cream/70",
        domain: "bg-background",
    };

    const fromPlatform = byPlatform[platform.toLowerCase()];
    if (fromPlatform) return fromPlatform;

    const accents = ["bg-sage/40", "bg-lavender/40", "bg-rose/40", "bg-cream/70"];
    return accents[hashIndex(projectId, accents.length)];
}

function displayName(launch: LaunchListItem): string {
    if (launch.name) return launch.name;
    const colon = launch.projectId.indexOf(":");
    return colon > -1 ? launch.projectId.slice(colon + 1) : launch.projectId;
}

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

export function LaunchCard({ launch }: { launch: LaunchListItem }) {
    const name = displayName(launch);
    const avatarClass = avatarAccent(launch.platform, launch.projectId);

    return (
        <article className="bg-background hover:bg-secondary/20 transition-colors">
            <div className="flex items-center justify-between gap-3 px-6 py-4 lg:px-8 border-border border-b">
                <div className="flex items-center gap-4 min-w-0">
                    <div
                        className={cn(
                            "size-12 flex items-center justify-center text-foreground font-bold text-lg border border-border shrink-0",
                            avatarClass,
                        )}
                    >
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <Link
                            href={`/launches/${launch.poolTokenAddress}`}
                            className="font-semibold text-foreground text-lg truncate hover:text-primary transition-colors block"
                        >
                            {name}
                        </Link>
                        <p className="text-sm text-muted-foreground font-mono truncate">{launch.projectId}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="border-border capitalize text-xs">
                        {launch.platform}
                    </Badge>
                    {launch.attestationUid ? (
                        <Badge variant="sage">
                            <CheckCircle className="size-3 mr-1" />
                            Verified
                        </Badge>
                    ) : (
                        <Badge variant="outline">
                            <Clock className="size-3 mr-1" />
                            Pending
                        </Badge>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-border border-b">
                <div className="flex-1 px-6 py-4 lg:px-8">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Token</p>
                    <a
                        href={`https://basescan.org/address/${launch.poolTokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-mono text-foreground hover:text-primary flex items-center gap-1"
                    >
                        {short(launch.poolTokenAddress)}
                        <ArrowUpRight className="size-3" />
                    </a>
                </div>
                <div className="flex-1 px-6 py-4 lg:px-8">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Owner</p>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-foreground">
                            {launch.ownerWallet ? short(launch.ownerWallet) : "—"}
                        </p>
                        {launch.ownerWallet ? (
                            <Badge className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0">
                                Claimed
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Unclaimed
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex-1 px-6 py-4 lg:px-8">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Market Cap</p>
                    <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                        <TrendingUp className="size-3 text-primary" />
                        {formatUsd(launch.marketCap)}
                    </p>
                </div>
                <div className="flex-1 px-6 py-4 lg:px-8">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Volume 24h</p>
                    <p className="text-sm text-foreground">{formatUsd(launch.volume24h)}</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 px-6 py-3 lg:px-8 bg-secondary/10">
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Layers3 className="size-3" />
                        {launch.deployedBy || "unknown deployer"}
                    </span>
                    <span className="flex items-center gap-1">
                        <User className="size-3" />
                        {launch.ownerWallet ? "claimed" : "unclaimed"}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <a href={launch.explorerUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="gap-1">
                            <ExternalLink className="size-4" />
                            Explorer
                        </Button>
                    </a>
                    <a href={launch.dexUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" className="gap-1">
                            <Coins className="size-4" />
                            Trade
                        </Button>
                    </a>
                    <Link href={`/launches/${launch.poolTokenAddress}`}>
                        <Button variant="outline" size="sm">
                            View Token
                        </Button>
                    </Link>
                </div>
            </div>
        </article>
    );
}
