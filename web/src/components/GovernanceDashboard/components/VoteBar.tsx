/**
 * VoteBar Component
 *
 * Displays vote progress with border-centric dramatic design.
 */

import { ThumbsDown, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";

import { formatTokens, votePercentage } from "../utils";

interface VoteBarProps {
    yesVotes: string;
    noVotes: string;
    quorum?: string;
    size?: "default" | "large";
}

export function VoteBar({ yesVotes, noVotes, quorum, size = "default" }: VoteBarProps) {
    const pct = votePercentage(yesVotes, noVotes);
    const isLarge = size === "large";

    return (
        <div className="space-y-3">
            {/* Vote Counts */}
            <div className={cn(
                "flex divide-x divide-border border border-border",
                isLarge ? "text-base" : "text-sm"
            )}>
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-50">
                    <ThumbsUp className={cn("text-green-600", isLarge ? "size-5" : "size-4")} />
                    <span className="text-green-700 font-semibold">{formatTokens(yesVotes)}</span>
                    <span className="text-green-600/70">Yes</span>
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50">
                    <ThumbsDown className={cn("text-red-600", isLarge ? "size-5" : "size-4")} />
                    <span className="text-red-700 font-semibold">{formatTokens(noVotes)}</span>
                    <span className="text-red-600/70">No</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="border border-border overflow-hidden">
                <div className="h-4 bg-red-200 flex">
                    <div
                        className="h-full bg-green-500 transition-all duration-500 relative"
                        style={{ width: `${pct}%` }}
                    >
                        {pct > 10 && (
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                                {pct.toFixed(0)}%
                            </span>
                        )}
                    </div>
                    {pct <= 10 && pct > 0 && (
                        <span className="flex items-center px-2 text-[10px] font-bold text-red-700">
                            {pct.toFixed(0)}%
                        </span>
                    )}
                </div>
            </div>

            {/* Quorum Info */}
            {quorum && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Quorum required: {quorum}</span>
                    <span className="text-foreground font-medium">
                        {pct >= 50 ? "Passing" : "Not passing"}
                    </span>
                </div>
            )}
        </div>
    );
}
