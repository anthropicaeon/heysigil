/**
 * ProposalCard Component
 *
 * Card displaying proposal summary in list view.
 */

import Image from "next/image";
import type { Proposal } from "../types";
import { statusClass, statusLabel, formatTokens, isCompletionVoting } from "../utils";
import { VoteBar } from "./VoteBar";
import { Countdown } from "./Countdown";

interface ProposalCardProps {
    proposal: Proposal;
    onClick: () => void;
}

export function ProposalCard({ proposal, onClick }: ProposalCardProps) {
    const showCompletionVotes = isCompletionVoting(proposal.status);

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
                    <Image src="/icons/coins-stacked-02.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} />
                    <strong>{formatTokens(proposal.tokenAmount)}</strong> tokens
                </div>
                <div className="proposal-meta-item">
                    <Image src="/icons/target-04.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} />
                    Target: <strong>{new Date(proposal.targetDate * 1000).toLocaleDateString()}</strong>
                </div>
                <div className="proposal-meta-item">
                    <Image src="/icons/users-01.svg" alt="" width={14} height={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4, opacity: 0.5 }} />
                    {proposal.proposer}
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
                yesVotes={showCompletionVotes ? proposal.completionYes : proposal.yesVotes}
                noVotes={showCompletionVotes ? proposal.completionNo : proposal.noVotes}
            />
        </div>
    );
}
