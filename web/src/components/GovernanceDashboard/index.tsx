/**
 * GovernanceDashboard
 *
 * Main governance dashboard component for viewing and creating proposals.
 * Currently shows an empty state — proposals will come from on-chain
 * contract reads when milestone governance is live.
 */

"use client";

import { FileCheck } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { CreateProposalModal } from "./components/CreateProposalModal";
import { GovernanceHeader } from "./components/GovernanceHeader";
import { ProposalDetail } from "./components/ProposalDetail";
import { ProposalFilter } from "./components/ProposalFilter";
import { ProposalListView } from "./components/ProposalListView";
import type { Proposal, TabFilter } from "./types";

export default function GovernanceDashboard() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
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
            <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
                <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-sage flex flex-col">
                    <ProposalDetail
                        proposal={selectedProposal}
                        onBack={() => setSelectedProposal(null)}
                    />
                </div>
            </section>
        );
    }

    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-sage flex flex-col">
                <GovernanceHeader proposals={proposals} escrowBalance="0" />
                <ProposalFilter
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onCreateClick={() => setShowCreate(true)}
                />

                {proposals.length === 0 ? (
                    <div className="flex-1 flex flex-col bg-background">
                        {/* Empty State Header */}
                        <div className="px-6 py-4 lg:px-12 border-border border-b bg-cream/30">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Proposals
                            </span>
                        </div>
                        {/* Empty State Content */}
                        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:px-12 text-center border-border border-b">
                            <div className="size-16 bg-sage/30 border border-border flex items-center justify-center mb-4">
                                <FileCheck className="size-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2 lowercase">
                                no proposals yet
                            </h3>
                            <p className="text-muted-foreground max-w-md text-sm">
                                Governance launches when the first milestone proposal is created. Token
                                holders can propose milestones and the community votes to unlock funds.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ProposalListView
                        proposals={filteredProposals}
                        activeTab={activeTab}
                        onSelectProposal={setSelectedProposal}
                    />
                )}

                {/* Footer */}
                <div className="border-border border-t px-6 py-5 lg:px-12 bg-sage/40">
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
