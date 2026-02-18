/**
 * GovernanceDashboard
 *
 * Main governance dashboard component for viewing and creating proposals.
 * Currently shows an empty state — proposals will come from on-chain
 * contract reads when milestone governance is live.
 */

"use client";

import { useState, useCallback } from "react";
import Image from "next/image";

import type { Proposal, TabFilter } from "./types";
import { GovernanceHeader } from "./components/GovernanceHeader";
import { ProposalFilter } from "./components/ProposalFilter";
import { ProposalListView } from "./components/ProposalListView";
import { ProposalDetail } from "./components/ProposalDetail";
import { CreateProposalModal } from "./components/CreateProposalModal";

export default function GovernanceDashboard() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [activeTab, setActiveTab] = useState<TabFilter>("all");
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const filteredProposals = proposals.filter((p) => {
        if (activeTab === "all") return true;
        if (activeTab === "active")
            return ["Voting", "Approved", "ProofSubmitted"].includes(p.status);
        if (activeTab === "completed")
            return ["Completed", "Overridden"].includes(p.status);
        if (activeTab === "rejected")
            return ["Rejected", "Expired", "Disputed"].includes(p.status);
        return true;
    });

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
        [proposals.length]
    );

    if (selectedProposal) {
        return (
            <div className="container" style={{ padding: "var(--space-12) var(--space-6)" }}>
                <ProposalDetail proposal={selectedProposal} onBack={() => setSelectedProposal(null)} />
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: "var(--space-12) var(--space-6)" }}>
            <GovernanceHeader proposals={proposals} escrowBalance="0" />

            <ProposalFilter
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onCreateClick={() => setShowCreate(true)}
            />

            {proposals.length === 0 ? (
                <div style={{
                    textAlign: "center",
                    padding: "var(--space-16) var(--space-6)",
                    color: "var(--text-secondary)",
                }}>
                    <Image
                        src="/icons/check-verified-02.svg"
                        alt=""
                        width={48}
                        height={48}
                        style={{ opacity: 0.2, marginBottom: "var(--space-4)" }}
                    />
                    <h3 style={{ color: "var(--text-primary)", marginBottom: "var(--space-2)" }}>
                        No proposals yet
                    </h3>
                    <p style={{ maxWidth: 400, margin: "0 auto", lineHeight: 1.6 }}>
                        Governance launches when the first milestone proposal is created.
                        Token holders can propose milestones and the community votes to unlock funds.
                    </p>
                </div>
            ) : (
                <ProposalListView
                    proposals={filteredProposals}
                    activeTab={activeTab}
                    onSelectProposal={setSelectedProposal}
                />
            )}

            {showCreate && (
                <CreateProposalModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
            )}
        </div>
    );
}

// Re-export types for external use
export type { Proposal, ProposalStatus, TabFilter } from "./types";
