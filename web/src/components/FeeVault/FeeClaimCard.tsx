"use client";

/**
 * Fee Claim Card
 *
 * Displays claimable USDC with loss aversion framing and urgency indicators.
 * Updated with pastel design system.
 */

import { Coins, RefreshCw } from "lucide-react";

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
        <div
            className={cn(
                "rounded-xl border bg-background p-6 transition-all",
                isHighValue ? "border-orange-300 bg-rose/30" : "border-border",
            )}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3
                        className={cn(
                            "text-xs uppercase tracking-wider font-medium mb-1",
                            isHighValue ? "text-orange-600" : "text-muted-foreground",
                        )}
                    >
                        {isZero ? "Claimable USDC" : "Unclaimed USDC"}
                    </h3>
                    <div
                        className={cn(
                            "text-3xl font-bold",
                            isHighValue ? "text-orange-600" : "text-foreground",
                        )}
                    >
                        {loading ? (
                            <span className="inline-block size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                            claimableUsdc
                        )}
                    </div>
                    {/* Loss aversion: urgency message */}
                    {!isZero && !loading && (
                        <p
                            className={cn(
                                "text-sm mt-2",
                                isNearExpiry
                                    ? "text-orange-600 font-medium"
                                    : "text-muted-foreground",
                            )}
                        >
                            {isNearExpiry
                                ? `Claim within ${daysUntilExpiry} days or fees return to protocol`
                                : isMediumValue
                                    ? "Don't leave money on the table"
                                    : `${daysUntilExpiry} days to claim`}
                        </p>
                    )}
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

            <div className="flex gap-6 mb-4 text-sm">
                <div>
                    <span className="text-muted-foreground">Lifetime Earned</span>
                    <span className="ml-2 font-medium text-foreground">{lifetimeUsdc}</span>
                </div>
                {!isZero && (
                    <div>
                        <span className="text-muted-foreground">Expiry</span>
                        <span
                            className={cn(
                                "ml-2 font-medium",
                                isNearExpiry ? "text-orange-600" : "text-foreground",
                            )}
                        >
                            {daysUntilExpiry} days
                        </span>
                    </div>
                )}
            </div>

            <Button
                onClick={onClaim}
                disabled={loading || claiming}
                className={cn("w-full", isHighValue && "bg-orange-600 hover:bg-orange-700")}
                size="lg"
            >
                {claiming ? (
                    <>
                        <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                        Claiming...
                    </>
                ) : (
                    <>
                        <Coins className="size-4 mr-2" />
                        {isZero ? "Claim USDC" : `Claim ${claimableUsdc} Now`}
                    </>
                )}
            </Button>

            {/* Success toast */}
            {lastTxHash && !claiming && (
                <div className="mt-4 p-3 rounded-lg bg-sage/50 border border-sage text-sm text-green-700 flex items-center gap-2">
                    <span>✓ Claimed!</span>
                    <a
                        href={`https://basescan.org/tx/${lastTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                    >
                        View tx ↗
                    </a>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-4 p-3 rounded-lg bg-rose/50 border border-rose text-sm text-red-700">
                    {error}
                </div>
            )}
        </div>
    );
}
