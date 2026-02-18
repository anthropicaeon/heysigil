/**
 * ProposalListView
 *
 * Renders proposal list or empty state.
 * Updated with pastel design system.
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
            <div className="flex flex-col bg-background">
                {proposals.map((p) => (
                    <ProposalCard key={p.id} proposal={p} onClick={() => onSelectProposal(p)} />
                ))}
            </div>
        );
    }

    return (
        <div className="px-6 py-16 lg:px-12 text-center bg-background">
            <FileCheck className="size-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No proposals yet</h3>
            <p className="text-muted-foreground">
                {activeTab === "all"
                    ? "Be the first to propose a milestone for this project."
                    : `No ${activeTab} proposals found.`}
            </p>
        </div>
    );
}
