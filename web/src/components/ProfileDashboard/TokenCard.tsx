"use client";

/**
 * Token Card
 *
 * Displays a single token with balance, governance info, and actions.
 * Border-centric pastel design system.
 */

import { ChevronRight, Coins, FileCheck, Zap } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TokenInfo } from "@/types";

function formatNumericString(value: string): string {
    const num = parseFloat(value.replace(/,/g, "")) || 0;
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
}

export const TokenCard = memo(function TokenCard({ token }: { token: TokenInfo }) {
    const isAboveThreshold =
        token.role === "holder" && parseFloat(token.balance.replace(/,/g, "")) >= 50_000_000;

    return (
        <div className="border-border border-b last:border-b-0 bg-background hover:bg-secondary/30 transition-colors">
            {/* Header Row */}
            <div className="flex items-center justify-between px-6 py-4 lg:px-8 border-border border-b">
                <div className="flex items-center gap-3">
                    <div
                        className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: token.color }}
                    >
                        {token.ticker.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground">{token.name}</h3>
                        <span className="text-sm text-muted-foreground">${token.ticker}</span>
                    </div>
                </div>
                <Badge variant={token.role === "dev" ? "default" : "outline"} className="text-xs">
                    {token.role === "dev" ? (
                        <>
                            <Zap className="size-3 mr-1" />
                            Builder
                        </>
                    ) : (
                        <>
                            <Coins className="size-3 mr-1" />
                            Holder
                        </>
                    )}
                </Badge>
            </div>

            {/* Stats Row */}
            <div className="flex border-border border-b">
                <div className="flex-1 px-6 py-4 lg:px-8 border-border border-r">
                    <p className="text-2xl font-bold text-foreground">
                        {formatNumericString(token.balance)}
                    </p>
                    <p className="text-xs text-muted-foreground">Your Balance</p>
                </div>
                <div className="flex-1 px-6 py-4 lg:px-8 border-border border-r">
                    <p className="text-2xl font-bold text-foreground">
                        {formatNumericString(token.escrowBalance)}
                    </p>
                    <p className="text-xs text-muted-foreground">In Escrow</p>
                </div>
                <div className="flex-1 px-6 py-4 lg:px-8">
                    <p className="text-2xl font-bold text-foreground">
                        {token.activeProposals}
                        <span className="text-muted-foreground font-normal text-lg">
                            /{token.totalProposals}
                        </span>
                    </p>
                    <p className="text-xs text-muted-foreground">Active Proposals</p>
                </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between px-6 py-3 lg:px-8">
                <div className="flex gap-2">
                    <Link href={`/governance?token=${token.address}`}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <FileCheck className="size-4" />
                            Governance
                        </Button>
                    </Link>
                    {token.role === "holder" && isAboveThreshold && (
                        <Link href={`/governance?token=${token.address}&action=propose`}>
                            <Button variant="secondary" size="sm">
                                Propose
                            </Button>
                        </Link>
                    )}
                </div>
                {token.role === "holder" && !isAboveThreshold && (
                    <span className="text-xs text-muted-foreground">Need 50M to propose</span>
                )}
                <Link
                    href={`/governance?token=${token.address}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronRight className="size-5" />
                </Link>
            </div>
        </div>
    );
});
