/**
 * VoteBar Component
 *
 * Displays vote progress bar with yes/no percentages.
 */

import { votePercentage, formatTokens } from "../utils";

interface VoteBarProps {
    yesVotes: string;
    noVotes: string;
    quorum?: string;
}

export function VoteBar({ yesVotes, noVotes, quorum }: VoteBarProps) {
    const pct = votePercentage(yesVotes, noVotes);

    return (
        <div className="vote-bar-container">
            <div className="vote-bar-labels">
                <span className="vote-bar-yes">{"\u2713"} {formatTokens(yesVotes)} Yes</span>
                <span className="vote-bar-no">{"\u2717"} {formatTokens(noVotes)} No</span>
            </div>
            <div className="vote-bar">
                <div className="vote-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            {quorum && (
                <div className="vote-bar-quorum">Quorum: {quorum}</div>
            )}
        </div>
    );
}
