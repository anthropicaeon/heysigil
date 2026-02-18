/**
 * GovernanceDashboard
 *
 * Main governance dashboard component for viewing and creating proposals.
 * Orchestrates child components for header, filtering, and proposal list.
 */

"use client";

import { useCallback, useMemo, useState } from "react";

import { CreateProposalModal } from "./components/CreateProposalModal";
import { GovernanceHeader } from "./components/GovernanceHeader";
import { ProposalDetail } from "./components/ProposalDetail";
import { ProposalFilter } from "./components/ProposalFilter";
import { ProposalListView } from "./components/ProposalListView";
import { MOCK_ESCROW_BALANCE, MOCK_PROPOSALS } from "./hooks/useMockProposals";
import type { Proposal, TabFilter } from "./types";

export default function GovernanceDashboard() {
    const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
    const [activeTab, setActiveTab] = useState<TabFilter>("all");
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const filteredProposals = useMemo(
        () =>
            proposals.filter((p) => {
                if (activeTab === "all") return true;
                if (activeTab === "active")
                    return ["Voting", "Approved", "ProofSubmitted"].includes(p.status);
                if (activeTab === "completed")
                    return ["Completed", "Overridden"].includes(p.status);
                if (activeTab === "rejected")
                    return ["Rejected", "Expired", "Disputed"].includes(p.status);
                return true;
            }),
        [proposals, activeTab],
    );

    const handleCreate = useCallback(
        (partial: Partial<Proposal>) => {
            const newProposal: Proposal = {
                id: proposals.length + 1,
                proposer: "0xYou...0000",
                title: partial.title || "",
                description: partial.description || "",
                tokenAmount: partial.tokenAmount || "0",
                targetDate: partial.targetDate || 0,
                status: "Voting",
                votingDeadline: Date.now() / 1000 + 5 * 86400,
                yesVotes: "0",
                noVotes: "0",
                proofUri: "",
                completionDeadline: 0,
                completionYes: "0",
                completionNo: "0",
            };
            setProposals((prev) => [newProposal, ...prev]);
            setShowCreate(false);
        },
        [proposals.length],
    );

    if (selectedProposal) {
        return (
            <section className="min-h-screen bg-sage relative overflow-hidden px-2.5 lg:px-0">
                <div className="border-border relative container border-l border-r min-h-screen px-0">
                    <ProposalDetail
                        proposal={selectedProposal}
                        onBack={() => setSelectedProposal(null)}
                    />
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-sage relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                <GovernanceHeader proposals={proposals} escrowBalance={MOCK_ESCROW_BALANCE} />
                <ProposalFilter
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onCreateClick={() => setShowCreate(true)}
                />
                <ProposalListView
                    proposals={filteredProposals}
                    activeTab={activeTab}
                    onSelectProposal={setSelectedProposal}
                />
                {/* Footer */}
                <div className="border-border border-t px-6 py-4 lg:px-12 bg-sage/30">
                    <p className="text-xs text-muted-foreground text-center">
                        Governance is onchain. All votes are recorded permanently on Base.
                    </p>
                </div>
            </div>
            {showCreate && (
                <CreateProposalModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
            )}
        </section>
    );
}

// Re-export types for external use
export type { Proposal, ProposalStatus, TabFilter } from "./types";
