/**
 * ProposalCard Component
 *
 * Card displaying proposal summary in list view.
 * Updated with pastel design system.
 */

import { ChevronRight, Coins, Target, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { Proposal } from "../types";
import { formatTokens, isCompletionVoting, statusLabel, statusVariant } from "../utils";
import { Countdown } from "./Countdown";
import { VoteBar } from "./VoteBar";

interface ProposalCardProps {
    proposal: Proposal;
    onClick: () => void;
}

export function ProposalCard({ proposal, onClick }: ProposalCardProps) {
    const showCompletionVotes = isCompletionVoting(proposal.status);

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-full text-left px-6 py-5 lg:px-12 border-border border-b last:border-b-0 hover:bg-secondary/30 transition-colors"
        >
            <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground font-mono">#{proposal.id}</span>
                    <h3 className="font-medium text-foreground">{proposal.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant={statusVariant(proposal.status)}>
                        {statusLabel(proposal.status)}
                    </Badge>
                    <ChevronRight className="size-5 text-muted-foreground" />
                </div>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-3">
                <span className="inline-flex items-center gap-1">
                    <Coins className="size-3.5 opacity-60" />
                    <strong className="text-foreground">
                        {formatTokens(proposal.tokenAmount)}
                    </strong>{" "}
                    tokens
                </span>
                <span className="inline-flex items-center gap-1">
                    <Target className="size-3.5 opacity-60" />
                    Target:{" "}
                    <strong className="text-foreground">
                        {new Date(proposal.targetDate * 1000).toLocaleDateString()}
                    </strong>
                </span>
                <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5 opacity-60" />
                    {proposal.proposer}
                </span>
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

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {proposal.description}
            </p>

            <VoteBar
                yesVotes={showCompletionVotes ? proposal.completionYes : proposal.yesVotes}
                noVotes={showCompletionVotes ? proposal.completionNo : proposal.noVotes}
            />
        </button>
    );
}
