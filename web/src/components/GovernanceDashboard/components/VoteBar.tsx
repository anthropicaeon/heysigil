/**
 * VoteBar Component
 *
 * Displays vote progress bar with yes/no percentages.
 * Updated with pastel design system.
 */

import { formatTokens, votePercentage } from "../utils";

interface VoteBarProps {
    yesVotes: string;
    noVotes: string;
    quorum?: string;
}

export function VoteBar({ yesVotes, noVotes, quorum }: VoteBarProps) {
    const pct = votePercentage(yesVotes, noVotes);

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">✓ {formatTokens(yesVotes)} Yes</span>
                <span className="text-red-600 font-medium">✗ {formatTokens(noVotes)} No</span>
            </div>
            <div className="h-3 bg-red-200 rounded-full overflow-hidden">
                <div
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                />
            </div>
            {quorum && <p className="text-xs text-muted-foreground">Quorum: {quorum}</p>}
        </div>
    );
}
