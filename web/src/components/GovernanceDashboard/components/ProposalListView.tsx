/**
 * ProposalListView
 *
 * Renders proposal list or empty state.
 */

import Image from "next/image";
import type { Proposal, TabFilter } from "../types";
import { ProposalCard } from "./ProposalCard";

interface ProposalListViewProps {
    proposals: Proposal[];
    activeTab: TabFilter;
    onSelectProposal: (proposal: Proposal) => void;
}

export function ProposalListView({ proposals, activeTab, onSelectProposal }: ProposalListViewProps) {
    if (proposals.length > 0) {
        return (
            <div className="proposal-list">
                {proposals.map((p) => (
                    <ProposalCard key={p.id} proposal={p} onClick={() => onSelectProposal(p)} />
                ))}
            </div>
        );
    }

    return (
        <div className="gov-empty">
            <Image
                src="/icons/check-verified-02.svg"
                alt=""
                width={48}
                height={48}
                className="gov-empty-icon"
                style={{ opacity: 0.4, display: "block", margin: "0 auto var(--space-4)" }}
            />
            <h3>No proposals yet</h3>
            <p>
                {activeTab === "all"
                    ? "Be the first to propose a milestone for this project."
                    : `No ${activeTab} proposals found.`}
            </p>
        </div>
    );
}
