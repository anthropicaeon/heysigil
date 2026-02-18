/**
 * GovernanceHeader
 *
 * Header section with title, description, and key stats.
 * Updated with pastel design system.
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
        <div className="border-border border-b px-6 py-8 lg:px-12 lg:py-12">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
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
                <div className="flex gap-6 lg:gap-8">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center lg:text-right">
                            <div className="flex items-center gap-1 justify-center lg:justify-end text-muted-foreground text-xs uppercase tracking-wider mb-1">
                                <stat.icon className="size-3" />
                                {stat.label}
                            </div>
                            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
