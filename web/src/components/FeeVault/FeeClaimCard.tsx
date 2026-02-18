"use client";

/**
 * Fee Claim Card
 *
 * Displays claimable USDC with loss aversion framing and urgency indicators.
 * Border-centric design with visual hierarchy.
 */

import { AlertTriangle, CheckCircle, Clock, Coins, RefreshCw, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FeeClaimCardProps {
    claimableUsdc: string;
    lifetimeUsdc: string;
    claiming: boolean;
    error: string | null;
    lastTxHash: string | null;
    loading: boolean;
    onClaim: () => void;
    onRefresh: () => void;
}

export function FeeClaimCard({
    claimableUsdc,
    lifetimeUsdc,
    claiming,
    error,
    lastTxHash,
    loading,
    onClaim,
    onRefresh,
}: FeeClaimCardProps) {
    const isZero = claimableUsdc === "$0.00";
    const claimableAmount = parseFloat(claimableUsdc.replace(/[$,]/g, "")) || 0;

    // Loss aversion: urgency levels based on amount
    const isHighValue = claimableAmount >= 100;
    const isMediumValue = claimableAmount >= 25;

    // Simulate days until expiry (in production, get from contract)
    const daysUntilExpiry = 23;
    const isNearExpiry = daysUntilExpiry <= 7;

    return (
        <div className="border border-border bg-background">
            {/* Main Content Row */}
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border">
                {/* Claimable Amount */}
                <div
                    className={cn(
                        "flex-1 px-6 py-6 lg:px-8",
                        isHighValue && "bg-orange-50 border-l-4 border-l-orange-500",
                    )}
                >
                    <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div
                                className={cn(
                                    "size-10 border flex items-center justify-center",
                                    isHighValue
                                        ? "bg-orange-100 border-orange-200"
                                        : "bg-primary/10 border-border",
                                )}
                            >
                                <Coins
                                    className={cn(
                                        "size-5",
                                        isHighValue ? "text-orange-600" : "text-primary",
                                    )}
                                />
                            </div>
                            <div>
                                <p
                                    className={cn(
                                        "text-xs uppercase tracking-wider font-medium",
                                        isHighValue ? "text-orange-600" : "text-muted-foreground",
                                    )}
                                >
                                    {isZero ? "Claimable USDC" : "Unclaimed USDC"}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={onRefresh}
                            disabled={loading}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
                        </Button>
                    </div>

                    <div
                        className={cn(
                            "text-4xl font-bold mb-2",
                            isHighValue ? "text-orange-600" : "text-foreground",
                        )}
                    >
                        {loading ? (
                            <span className="inline-block size-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            claimableUsdc
                        )}
                    </div>

                    {/* Urgency message */}
                    {!isZero && !loading && (
                        <p
                            className={cn(
                                "text-sm flex items-center gap-1.5",
                                isNearExpiry
                                    ? "text-orange-600 font-medium"
                                    : "text-muted-foreground",
                            )}
                        >
                            {isNearExpiry ? (
                                <>
                                    <AlertTriangle className="size-4" />
                                    Claim within {daysUntilExpiry} days or fees return to protocol
                                </>
                            ) : isMediumValue ? (
                                <>
                                    <Wallet className="size-4" />
                                    Don&apos;t leave money on the table
                                </>
                            ) : (
                                <>
                                    <Clock className="size-4" />
                                    {daysUntilExpiry} days to claim
                                </>
                            )}
                        </p>
                    )}
                </div>

                {/* Stats */}
                <div className="lg:w-64 flex flex-col divide-y divide-border">
                    <div className="flex-1 px-6 py-4 lg:px-6">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Lifetime Earned
                        </p>
                        <p className="text-xl font-bold text-foreground">{lifetimeUsdc}</p>
                    </div>
                    {!isZero && (
                        <div className="flex-1 px-6 py-4 lg:px-6">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Expires In
                            </p>
                            <p
                                className={cn(
                                    "text-xl font-bold",
                                    isNearExpiry ? "text-orange-600" : "text-foreground",
                                )}
                            >
                                {daysUntilExpiry} days
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Action Row */}
            <div className="border-border border-t px-6 py-4 lg:px-8 bg-secondary/10">
                <Button
                    onClick={onClaim}
                    disabled={loading || claiming}
                    className={cn(
                        "w-full gap-2",
                        isHighValue && "bg-orange-600 hover:bg-orange-700",
                    )}
                    size="lg"
                >
                    {claiming ? (
                        <>
                            <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Claiming...
                        </>
                    ) : (
                        <>
                            <Coins className="size-4" />
                            {isZero ? "Claim USDC" : `Claim ${claimableUsdc} Now`}
                        </>
                    )}
                </Button>
            </div>

            {/* Success State */}
            {lastTxHash && !claiming && (
                <div className="border-border border-t px-6 py-4 lg:px-8 bg-green-50">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-green-100 border border-green-200 flex items-center justify-center">
                            <CheckCircle className="size-5 text-green-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-green-700">Successfully Claimed!</p>
                            <a
                                href={`https://basescan.org/tx/${lastTxHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                            >
                                View transaction ↗
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="border-border border-t px-6 py-4 lg:px-8 bg-red-50">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-red-100 border border-red-200 flex items-center justify-center">
                            <AlertTriangle className="size-5 text-red-600" />
                        </div>
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
