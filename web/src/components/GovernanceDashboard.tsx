"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";

// ─── Types ───────────────────────────────────────────
type ProposalStatus =
    | "Voting"
    | "Approved"
    | "Rejected"
    | "Expired"
    | "ProofSubmitted"
    | "Completed"
    | "Disputed"
    | "Overridden";

interface Proposal {
    id: number;
    proposer: string;
    title: string;
    description: string;
    tokenAmount: string;
    targetDate: number;
    status: ProposalStatus;
    votingDeadline: number;
    yesVotes: string;
    noVotes: string;
    proofUri: string;
    completionDeadline: number;
    completionYes: string;
    completionNo: string;
}

// ─── Mock Data (replace with contract reads) ─────────
const MOCK_PROPOSALS: Proposal[] = [
    {
        id: 1,
        proposer: "0xDev...1234",
        title: "Ship v2.0 — Complete UI Redesign",
        description:
            "Full redesign of the platform UI with new component library, dark mode support, and mobile-first responsive layouts. Includes user testing and accessibility audit.",
        tokenAmount: "1,000,000,000",
        targetDate: Date.now() / 1000 + 30 * 86400,
        status: "Voting",
        votingDeadline: Date.now() / 1000 + 4 * 86400,
        yesVotes: "3,200,000,000",
        noVotes: "800,000,000",
        proofUri: "",
        completionDeadline: 0,
        completionYes: "0",
        completionNo: "0",
    },
    {
        id: 2,
        proposer: "0xDev...1234",
        title: "API v3 Integration — Multi-chain Support",
        description:
            "Integrate Arbitrum and Optimism chain support into the existing API layer. Includes new RPC endpoints, cross-chain bridging helpers, and updated SDK.",
        tokenAmount: "500,000,000",
        targetDate: Date.now() / 1000 + 60 * 86400,
        status: "Approved",
        votingDeadline: Date.now() / 1000 - 1 * 86400,
        yesVotes: "5,400,000,000",
        noVotes: "600,000,000",
        proofUri: "",
        completionDeadline: 0,
        completionYes: "0",
        completionNo: "0",
    },
    {
        id: 3,
        proposer: "0xHolder...5678",
        title: "Community SDK Documentation",
        description:
            "Create comprehensive developer documentation, code examples, and quickstart guides for the project SDK. Community-driven proposal.",
        tokenAmount: "200,000,000",
        targetDate: Date.now() / 1000 + 14 * 86400,
        status: "ProofSubmitted",
        votingDeadline: Date.now() / 1000 - 7 * 86400,
        yesVotes: "4,800,000,000",
        noVotes: "200,000,000",
        proofUri: "https://github.com/example/docs-pr/pull/42",
        completionDeadline: Date.now() / 1000 + 2 * 86400,
        completionYes: "2,100,000,000",
        completionNo: "300,000,000",
    },
    {
        id: 4,
        proposer: "0xDev...1234",
        title: "Mobile App MVP",
        description:
            "Build a React Native mobile app with core features: wallet connection, swap interface, and governance voting.",
        tokenAmount: "2,000,000,000",
        targetDate: Date.now() / 1000 - 5 * 86400,
        status: "Completed",
        votingDeadline: Date.now() / 1000 - 30 * 86400,
        yesVotes: "6,200,000,000",
        noVotes: "800,000,000",
        proofUri: "https://apps.apple.com/example",
        completionDeadline: Date.now() / 1000 - 10 * 86400,
        completionYes: "5,500,000,000",
        completionNo: "500,000,000",
    },
    {
        id: 5,
        proposer: "0xHolder...9abc",
        title: "Token Burn Mechanism",
        description: "Implement a deflationary token burn on every swap. Rejected by the community due to concerns about long-term supply effects.",
        tokenAmount: "800,000,000",
        targetDate: Date.now() / 1000 - 10 * 86400,
        status: "Rejected",
        votingDeadline: Date.now() / 1000 - 15 * 86400,
        yesVotes: "1,200,000,000",
        noVotes: "4,800,000,000",
        proofUri: "",
        completionDeadline: 0,
        completionYes: "0",
        completionNo: "0",
    },
];

const MOCK_ESCROW_BALANCE = "7,300,000,000";
const MOCK_TOTAL_SUPPLY = "100,000,000,000";

// ─── Helpers ─────────────────────────────────────────
function statusClass(s: ProposalStatus): string {
    const map: Record<ProposalStatus, string> = {
        Voting: "status-voting",
        Approved: "status-approved",
        Rejected: "status-rejected",
        Expired: "status-expired",
        ProofSubmitted: "status-proof",
        Completed: "status-completed",
        Disputed: "status-disputed",
        Overridden: "status-overridden",
    };
    return map[s];
}

function statusLabel(s: ProposalStatus): string {
    if (s === "ProofSubmitted") return "Proof Submitted";
    return s;
}

function useCountdown(deadline: number): string {
    const [now, setNow] = useState(Date.now() / 1000);
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now() / 1000), 1000);
        return () => clearInterval(t);
    }, []);
    const diff = deadline - now;
    if (diff <= 0) return "Ended";
    const d = Math.floor(diff / 86400);
    const h = Math.floor((diff % 86400) / 3600);
    const m = Math.floor((diff % 3600) / 60);
    if (d > 0) return `${d}d ${h}h remaining`;
    if (h > 0) return `${h}h ${m}m remaining`;
    return `${m}m remaining`;
}

function votePercentage(yes: string, no: string): number {
    const y = parseFloat(yes.replace(/,/g, "")) || 0;
    const n = parseFloat(no.replace(/,/g, "")) || 0;
    if (y + n === 0) return 50;
    return (y / (y + n)) * 100;
}

function formatTokens(val: string): string {
    const num = parseFloat(val.replace(/,/g, ""));
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    return val;
}

// ─── Components ──────────────────────────────────────

function VoteBar({ yesVotes, noVotes, quorum }: { yesVotes: string; noVotes: string; quorum?: string }) {
    const pct = votePercentage(yesVotes, noVotes);
    return (
        <div className="vote-bar-container">
            <div className="vote-bar-labels">
                <span className="vote-bar-yes">✓ {formatTokens(yesVotes)} Yes</span>
                <span className="vote-bar-no">✗ {formatTokens(noVotes)} No</span>
            </div>
            <div className="vote-bar">
                <div className="vote-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            {quorum && (
                <div className="vote-bar-quorum">Quorum: {quorum}</div>
            )}
        </div>
    );
}

function Countdown({ deadline }: { deadline: number }) {
    const label = useCountdown(deadline);
    const isUrgent = deadline - Date.now() / 1000 < 86400 && deadline - Date.now() / 1000 > 0;
    return <span className={`countdown ${isUrgent ? "urgent" : ""}`}><Image src="/icons/target-04.svg" alt="" width={12} height={12} style={{ display: "inline", verticalAlign: "middle", marginRight: 3, opacity: 0.5 }} /> {label}</span>;
}

function ProposalCard({ proposal, onClick }: { proposal: Proposal; onClick: () => void }) {
    return (
        <div className="proposal-card" onClick={onClick}>
            <div className="proposal-card-header">
                <div>
                    <span className="proposal-id">#{proposal.id}</span>
                    <h3>{proposal.title}</h3>
                </div>
                <span className={`status-badge ${statusClass(proposal.status)}`}>
                    {statusLabel(proposal.status)}
                </span>
            </div>
            <div className="proposal-meta">
                <div className="proposal-meta-item">
                    <Image src="/icons/coins-stacked-02.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} /> <strong>{formatTokens(proposal.tokenAmount)}</strong> tokens
                </div>
                <div className="proposal-meta-item">
                    <Image src="/icons/target-04.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} /> Target: <strong>{new Date(proposal.targetDate * 1000).toLocaleDateString()}</strong>
                </div>
                <div className="proposal-meta-item">
                    <Image src="/icons/users-01.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} /> {proposal.proposer}
                </div>
                {(proposal.status === "Voting" || proposal.status === "ProofSubmitted") && (
                    <Countdown
                        deadline={
                            proposal.status === "Voting"
                                ? proposal.votingDeadline
                                : proposal.completionDeadline
                        }
                    />
                )}
            </div>
            <p className="proposal-description">{proposal.description}</p>
            <VoteBar
                yesVotes={
                    proposal.status === "ProofSubmitted" || proposal.status === "Completed" || proposal.status === "Disputed" || proposal.status === "Overridden"
                        ? proposal.completionYes
                        : proposal.yesVotes
                }
                noVotes={
                    proposal.status === "ProofSubmitted" || proposal.status === "Completed" || proposal.status === "Disputed" || proposal.status === "Overridden"
                        ? proposal.completionNo
                        : proposal.noVotes
                }
            />
        </div>
    );
}

function ProposalDetail({
    proposal,
    onBack,
}: {
    proposal: Proposal;
    onBack: () => void;
}) {
    const [comment, setComment] = useState("");
    const [voted, setVoted] = useState(false);

    const handleVote = (support: boolean) => {
        // TODO: Call contract voteWithComment or voteCompletionWithComment
        console.log(`Vote: ${support ? "YES" : "NO"}, comment: ${comment}`);
        setVoted(true);
    };

    const isVotingPhase = proposal.status === "Voting";
    const isCompletionPhase = proposal.status === "ProofSubmitted";
    const canVote = isVotingPhase || isCompletionPhase;

    return (
        <div className="proposal-detail">
            <button className="btn-sm" onClick={onBack} style={{ marginBottom: "var(--space-4)" }}>
                ← Back to proposals
            </button>

            <div className="proposal-detail-header">
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
                    <span className="proposal-id" style={{ fontSize: "var(--text-sm)" }}>Proposal #{proposal.id}</span>
                    <span className={`status-badge ${statusClass(proposal.status)}`}>
                        {statusLabel(proposal.status)}
                    </span>
                </div>
                <h1>{proposal.title}</h1>
                <div className="proposal-meta">
                    <div className="proposal-meta-item">
                        <Image src="/icons/coins-stacked-02.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} /> <strong>{formatTokens(proposal.tokenAmount)}</strong> tokens requested
                    </div>
                    <div className="proposal-meta-item">
                        <Image src="/icons/target-04.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} /> Target: <strong>{new Date(proposal.targetDate * 1000).toLocaleDateString()}</strong>
                    </div>
                    <div className="proposal-meta-item">
                        <Image src="/icons/users-01.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} /> Proposed by: <strong>{proposal.proposer}</strong>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="proposal-timeline">
                <div className={`timeline-item done`}>
                    <div className="timeline-title">Proposal Created</div>
                    <div className="timeline-date">By {proposal.proposer}</div>
                </div>
                <div
                    className={`timeline-item ${proposal.status === "Voting" ? "active" :
                        ["Approved", "ProofSubmitted", "Completed", "Disputed", "Overridden"].includes(proposal.status) ? "done" : ""
                        }`}
                >
                    <div className="timeline-title">Community Vote</div>
                    <div className="timeline-date">
                        {proposal.status === "Voting" ? (
                            <Countdown deadline={proposal.votingDeadline} />
                        ) : proposal.status === "Rejected" ? (
                            "Rejected by community"
                        ) : proposal.status === "Expired" ? (
                            "Expired — quorum not met"
                        ) : (
                            "Approved by community ✓"
                        )}
                    </div>
                </div>
                {["Approved", "ProofSubmitted", "Completed", "Disputed", "Overridden"].includes(proposal.status) && (
                    <>
                        <div
                            className={`timeline-item ${proposal.status === "Approved" ? "active" :
                                ["ProofSubmitted", "Completed", "Disputed", "Overridden"].includes(proposal.status) ? "done" : ""
                                }`}
                        >
                            <div className="timeline-title">Development</div>
                            <div className="timeline-date">
                                {proposal.status === "Approved"
                                    ? "In progress — awaiting proof"
                                    : "Proof submitted ✓"}
                            </div>
                        </div>
                        {["ProofSubmitted", "Completed", "Disputed", "Overridden"].includes(proposal.status) && (
                            <div
                                className={`timeline-item ${proposal.status === "ProofSubmitted" ? "active" :
                                    ["Completed", "Overridden"].includes(proposal.status) ? "done" : ""
                                    }`}
                            >
                                <div className="timeline-title">Completion Vote</div>
                                <div className="timeline-date">
                                    {proposal.status === "ProofSubmitted" ? (
                                        <Countdown deadline={proposal.completionDeadline} />
                                    ) : proposal.status === "Completed" ? (
                                        "Verified ✓ — tokens released"
                                    ) : proposal.status === "Overridden" ? (
                                        "Protocol override ✓ — tokens released"
                                    ) : (
                                        "Disputed — awaiting protocol review"
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Description */}
            <div className="card" style={{ padding: "var(--space-5)", marginBottom: "var(--space-6)" }}>
                <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-3)" }}>
                    Description
                </h3>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", lineHeight: 1.7 }}>
                    {proposal.description}
                </p>
            </div>

            {/* Proof Section */}
            {proposal.proofUri && (
                <div className="proof-section">
                    <h4><Image src="/icons/link-03.svg" alt="" width={16} height={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.6 }} /> Completion Proof</h4>
                    <a href={proposal.proofUri} target="_blank" rel="noopener noreferrer" className="proof-link">
                        {proposal.proofUri}
                    </a>
                </div>
            )}

            {/* Vote Results */}
            <div className="card" style={{ padding: "var(--space-5)", marginTop: "var(--space-6)" }}>
                <h3 style={{ fontSize: "var(--text-sm)", fontWeight: 600, marginBottom: "var(--space-2)" }}>
                    {isCompletionPhase ? "Completion Vote" : "Community Vote"}
                </h3>
                <VoteBar
                    yesVotes={isCompletionPhase ? proposal.completionYes : proposal.yesVotes}
                    noVotes={isCompletionPhase ? proposal.completionNo : proposal.noVotes}
                    quorum="4B tokens (4%)"
                />
            </div>

            {/* Voting Actions */}
            {canVote && !voted && (
                <>
                    <div className="comment-input-wrap">
                        <label>Add a comment (optional)</label>
                        <textarea
                            placeholder="Share your reasoning for voting..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                    </div>
                    <div className="proposal-actions">
                        <button className="vote-btn vote-btn-yes" onClick={() => handleVote(true)}>
                            ✓ Vote Yes
                        </button>
                        <button className="vote-btn vote-btn-no" onClick={() => handleVote(false)}>
                            ✗ Vote No
                        </button>
                    </div>
                </>
            )}

            {voted && (
                <div
                    className="card"
                    style={{
                        padding: "var(--space-5)",
                        marginTop: "var(--space-6)",
                        textAlign: "center",
                        background: "var(--sage)",
                    }}
                >
                    <p style={{ fontWeight: 600, color: "var(--success)" }}>✓ Your vote has been recorded</p>
                </div>
            )}
        </div>
    );
}

function CreateProposalModal({ onClose, onCreate }: { onClose: () => void; onCreate: (p: Partial<Proposal>) => void }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tokenAmount, setTokenAmount] = useState("");
    const [targetDate, setTargetDate] = useState("");

    const handleSubmit = () => {
        if (!title || !description || !tokenAmount || !targetDate) return;
        onCreate({
            title,
            description,
            tokenAmount,
            targetDate: new Date(targetDate).getTime() / 1000,
        });
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <h2>Create Proposal</h2>

                <div className="form-group">
                    <label>Title</label>
                    <input
                        type="text"
                        placeholder="e.g. Ship v2.0 — UI Redesign"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        placeholder="Describe the milestone, deliverables, and success criteria..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <p className="form-hint">Be specific about what you&apos;ll deliver and how the community can verify it.</p>
                </div>

                <div className="form-group">
                    <label>Token Amount</label>
                    <input
                        type="text"
                        placeholder="e.g. 1000000000"
                        value={tokenAmount}
                        onChange={(e) => setTokenAmount(e.target.value)}
                    />
                    <p className="form-hint">Number of tokens to unlock upon completion. Must not exceed escrow balance.</p>
                </div>

                <div className="form-group">
                    <label>Target Completion Date</label>
                    <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                    <p className="form-hint">When do you expect to complete this milestone?</p>
                </div>

                <div className="form-actions">
                    <button className="btn-secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSubmit}
                        disabled={!title || !description || !tokenAmount || !targetDate}
                    >
                        Submit Proposal
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Dashboard ──────────────────────────────────
type TabFilter = "all" | "active" | "completed" | "rejected";

export default function GovernanceDashboard() {
    const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
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
                            className={`gov-tab ${activeTab === tab ? "active" : ""}`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                <button
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
