/**
 * GovernanceDashboard
 *
 * Main governance dashboard component for viewing and creating proposals.
 */

"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";

import type { Proposal, TabFilter } from "./types";
import { formatTokens } from "./utils";
import { MOCK_PROPOSALS, MOCK_ESCROW_BALANCE } from "./hooks/useMockProposals";
import { ProposalCard } from "./components/ProposalCard";
import { ProposalDetail } from "./components/ProposalDetail";
import { CreateProposalModal } from "./components/CreateProposalModal";

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
        [proposals, activeTab]
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
            {/* Header */}
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
                        <div className="gov-stat-value">{formatTokens(MOCK_ESCROW_BALANCE)}</div>
                        <div className="gov-stat-label">In Escrow</div>
                    </div>
                    <div className="gov-stat">
                        <div className="gov-stat-value">{proposals.filter((p) => p.status === "Voting").length}</div>
                        <div className="gov-stat-label">Active Votes</div>
                    </div>
                    <div className="gov-stat">
                        <div className="gov-stat-value">{proposals.filter((p) => ["Completed", "Overridden"].includes(p.status)).length}</div>
                        <div className="gov-stat-label">Completed</div>
                    </div>
                </div>
            </div>

            {/* Tabs + Create */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div className="gov-tabs">
                    {(["all", "active", "completed", "rejected"] as TabFilter[]).map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            className={`gov-tab ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setShowCreate(true)}
                    style={{ marginBottom: "var(--space-6)" }}
                >
                    + New Proposal
                </button>
            </div>

            {/* Proposal List */}
            {filteredProposals.length > 0 ? (
                <div className="proposal-list">
                    {filteredProposals.map((p) => (
                        <ProposalCard key={p.id} proposal={p} onClick={() => setSelectedProposal(p)} />
                    ))}
                </div>
            ) : (
                <div className="gov-empty">
                    <Image src="/icons/check-verified-02.svg" alt="" width={48} height={48} className="gov-empty-icon" style={{ opacity: 0.4, display: "block", margin: "0 auto var(--space-4)" }} />
                    <h3>No proposals yet</h3>
                    <p>
                        {activeTab === "all"
                            ? "Be the first to propose a milestone for this project."
                            : `No ${activeTab} proposals found.`}
                    </p>
                </div>
            )}

            {/* Create Modal */}
            {showCreate && (
                <CreateProposalModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />
            )}
        </div>
    );
}

// Re-export types for external use
export type { Proposal, ProposalStatus, TabFilter } from "./types";
