/**
 * ProposalListView
 *
 * Renders proposal list with section header.
 * Border-centric design with flex-1 for screen height adherence.
 */

import { FileCheck } from "lucide-react";

import type { Proposal, TabFilter } from "../types";
import { ProposalCard } from "./ProposalCard";

interface ProposalListViewProps {
    proposals: Proposal[];
    activeTab: TabFilter;
    onSelectProposal: (proposal: Proposal) => void;
}

export function ProposalListView({
    proposals,
    activeTab,
    onSelectProposal,
}: ProposalListViewProps) {
    if (proposals.length > 0) {
        return (
            <div className="flex-1 flex flex-col bg-background">
                {/* Section Header */}
                <div className="px-6 py-4 lg:px-12 border-border border-b bg-cream/30">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        {activeTab === "all" ? "All Proposals" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Proposals`}
                    </span>
                </div>
                {/* Proposal List */}
                <div className="flex-1 flex flex-col divide-y divide-border border-border border-b">
                    {proposals.map((p) => (
                        <ProposalCard key={p.id} proposal={p} onClick={() => onSelectProposal(p)} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Section Header */}
            <div className="px-6 py-4 lg:px-12 border-border border-b bg-cream/30">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Proposals
                </span>
            </div>
            {/* Empty State */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:px-12 text-center border-border border-b">
                <div className="size-16 bg-sage/30 border border-border flex items-center justify-center mb-4">
                    <FileCheck className="size-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 lowercase">
                    no proposals yet
                </h3>
                <p className="text-muted-foreground max-w-md text-sm">
                    {activeTab === "all"
                        ? "Be the first to propose a milestone for this project."
                        : `No ${activeTab} proposals found.`}
                </p>
            </div>
        </div>
    );
}
