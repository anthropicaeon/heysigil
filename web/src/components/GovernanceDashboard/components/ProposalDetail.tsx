/**
 * ProposalDetail Component
 *
 * Full proposal view with voting interface.
 */

"use client";

import { useState } from "react";
import Image from "next/image";
import type { Proposal } from "../types";
import { statusClass, statusLabel, formatTokens } from "../utils";
import { VoteBar } from "./VoteBar";
import { Countdown } from "./Countdown";

interface ProposalDetailProps {
    proposal: Proposal;
    onBack: () => void;
}

export function ProposalDetail({ proposal, onBack }: ProposalDetailProps) {
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
                {"\u2190"} Back to proposals
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
                        <Image src="/icons/coins-stacked-02.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} />
                        <strong>{formatTokens(proposal.tokenAmount)}</strong> tokens requested
                    </div>
                    <div className="proposal-meta-item">
                        <Image src="/icons/target-04.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} />
                        Target: <strong>{new Date(proposal.targetDate * 1000).toLocaleDateString()}</strong>
                    </div>
                    <div className="proposal-meta-item">
                        <Image src="/icons/users-01.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} />
                        Proposed by: <strong>{proposal.proposer}</strong>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="proposal-timeline">
                <div className="timeline-item done">
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
                            "Approved by community \u2713"
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
                                    : "Proof submitted \u2713"}
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
                                        "Verified \u2713 — tokens released"
                                    ) : proposal.status === "Overridden" ? (
                                        "Protocol override \u2713 — tokens released"
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
                    <h4>
                        <Image src="/icons/link-03.svg" alt="" width={16} height={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.6 }} />
                        Completion Proof
                    </h4>
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
                        <button className="vote-btn vote-btn-yes" onClick={() => handleVote(true)} type="button">
                            {"\u2713"} Vote Yes
                        </button>
                        <button className="vote-btn vote-btn-no" onClick={() => handleVote(false)} type="button">
                            {"\u2717"} Vote No
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
                    <p style={{ fontWeight: 600, color: "var(--success)" }}>{"\u2713"} Your vote has been recorded</p>
                </div>
            )}
        </div>
    );
}
