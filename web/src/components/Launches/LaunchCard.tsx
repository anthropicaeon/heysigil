import { ArrowUpRight, CheckCircle, Clock, Coins, ExternalLink, Layers3, User } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LaunchListItem } from "@/types";

function hashColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 35%, 65%)`;
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

export function LaunchCard({ launch }: { launch: LaunchListItem }) {
    const name = displayName(launch);
    const color = hashColor(launch.projectId);
    const date = launch.createdAt ? new Date(launch.createdAt).toLocaleDateString() : "Unknown";

    return (
        <article className="bg-background hover:bg-secondary/20 transition-colors">
            <div className="flex items-center justify-between px-6 py-4 lg:px-8 border-border border-b">
                <div className="flex items-center gap-4 min-w-0">
                    <div
                        className="size-12 flex items-center justify-center text-white font-bold text-lg border border-border shrink-0"
                        style={{ backgroundColor: color }}
                    >
                        {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold text-foreground text-lg truncate">{name}</h3>
                        <p className="text-sm text-muted-foreground font-mono truncate">{launch.projectId}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="border-border capitalize">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border border-border border-b">
                <div className="px-6 py-4 lg:px-8">
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
                <div className="px-6 py-4 lg:px-8">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Pool</p>
                    <p className="text-sm font-mono text-foreground">{short(launch.poolId, 8, 6)}</p>
                </div>
                <div className="px-6 py-4 lg:px-8">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Owner</p>
                    <p className="text-sm text-foreground">{launch.ownerWallet ? short(launch.ownerWallet) : "Unclaimed"}</p>
                </div>
                <div className="px-6 py-4 lg:px-8">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Launched</p>
                    <p className="text-sm text-foreground">{date}</p>
                </div>
            </div>

            <div className="flex items-center justify-between px-6 py-3 lg:px-8 bg-secondary/10">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Layers3 className="size-3" />
                        {launch.deployedBy || "unknown deployer"}
                    </span>
                    <span className="flex items-center gap-1">
                        <User className="size-3" />
                        {launch.ownerWallet ? "claimed" : "unclaimed"}
                    </span>
                </div>
                <div className="flex items-center gap-2">
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
                    <Link href={`/governance?token=${launch.poolTokenAddress}`}>
                        <Button variant="outline" size="sm">
                            Governance
                        </Button>
                    </Link>
                </div>
            </div>
        </article>
    );
}
