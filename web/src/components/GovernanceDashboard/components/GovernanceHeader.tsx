/**
 * GovernanceHeader
 *
 * Header section with title, description, and key stats.
 * Border-centric design with two-column layout.
 */

import { Check, FileCheck, Hourglass } from "lucide-react";

import type { Proposal } from "../types";
import { formatTokens } from "../utils";

interface GovernanceHeaderProps {
    proposals: Proposal[];
    escrowBalance: string;
}

export function GovernanceHeader({ proposals, escrowBalance }: GovernanceHeaderProps) {
    const activeVotes = proposals.filter((p) => p.status === "Voting").length;
    const completed = proposals.filter((p) =>
        ["Completed", "Overridden"].includes(p.status),
    ).length;

    const stats = [
        { label: "In Escrow", value: formatTokens(escrowBalance), icon: Hourglass },
        { label: "Active Votes", value: activeVotes.toString(), icon: FileCheck },
        { label: "Completed", value: completed.toString(), icon: Check },
    ];

    return (
        <div className="border-border border-b bg-sage/20">
            <div className="flex flex-col lg:flex-row">
                {/* Title Section */}
                <div className="lg:w-2/3 px-6 py-8 lg:px-12 lg:py-10 border-border border-b lg:border-b-0 lg:border-r">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-2">
                        governance
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground lowercase">
                        milestone proposals
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Propose milestones, vote on unlocks, and shape the future of this project.
                        Developers earn tokens by delivering on their promises.
                    </p>
                </div>
                {/* Stats Sidebar */}
                <div className="lg:w-1/3 flex flex-col divide-y divide-border">
                    {stats.map((stat) => (
                        <div
                            key={stat.label}
                            className="flex-1 px-6 py-4 lg:px-8 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
                                <stat.icon className="size-4" />
                                {stat.label}
                            </div>
                            <div className="text-xl font-bold text-foreground">{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
