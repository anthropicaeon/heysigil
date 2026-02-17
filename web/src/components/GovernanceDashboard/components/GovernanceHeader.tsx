/**
 * GovernanceHeader
 *
 * Header section with title, description, and key stats.
 */

import type { Proposal } from "../types";
import { formatTokens } from "../utils";

interface GovernanceHeaderProps {
    proposals: Proposal[];
    escrowBalance: string;
}

export function GovernanceHeader({ proposals, escrowBalance }: GovernanceHeaderProps) {
    const activeVotes = proposals.filter((p) => p.status === "Voting").length;
    const completed = proposals.filter((p) =>
        ["Completed", "Overridden"].includes(p.status)
    ).length;

    return (
        <div className="gov-header">
            <div>
                <h1>Governance</h1>
                <p>
                    Propose milestones, vote on unlocks, and shape the future of this project.
                    Developers earn tokens by delivering on their promises.
                </p>
            </div>
            <div className="gov-stats">
                <div className="gov-stat">
                    <div className="gov-stat-value">{formatTokens(escrowBalance)}</div>
                    <div className="gov-stat-label">In Escrow</div>
                </div>
                <div className="gov-stat">
                    <div className="gov-stat-value">{activeVotes}</div>
                    <div className="gov-stat-label">Active Votes</div>
                </div>
                <div className="gov-stat">
                    <div className="gov-stat-value">{completed}</div>
                    <div className="gov-stat-label">Completed</div>
                </div>
            </div>
        </div>
    );
}
