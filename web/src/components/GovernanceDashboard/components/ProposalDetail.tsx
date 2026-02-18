/**
 * ProposalDetail Component
 *
 * Full proposal view with voting interface.
 * Updated with pastel design system.
 */

"use client";

import { ArrowLeft, Check, Link2, Target, Users, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { Proposal } from "../types";
import {
    formatTokens,
    isCompletionVoting,
    isFinalStatus,
    isPostVoting,
    statusLabel,
    statusVariant,
} from "../utils";
import { Countdown } from "./Countdown";
import { VoteBar } from "./VoteBar";

interface ProposalDetailProps {
    proposal: Proposal;
    onBack: () => void;
}

export function ProposalDetail({ proposal, onBack }: ProposalDetailProps) {
    const [comment, setComment] = useState("");
    const [voted, setVoted] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleVote = (support: boolean) => {
        // TODO: Call contract voteWithComment or voteCompletionWithComment
        // Vote will be: support ? "YES" : "NO", with comment
        setVoted(true);
    };

    const isVotingPhase = proposal.status === "Voting";
    const isCompletionPhase = proposal.status === "ProofSubmitted";
    const canVote = isVotingPhase || isCompletionPhase;

    return (
        <div className="bg-background">
            {/* Back button */}
            <div className="border-border border-b px-6 py-4 lg:px-12">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="size-4" />
                    Back to proposals
                </button>
            </div>

            {/* Proposal Header */}
            <div className="border-border border-b px-6 py-6 lg:px-12 lg:py-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xs text-muted-foreground font-mono">
                                Proposal #{proposal.id}
                            </span>
                            <Badge variant={statusVariant(proposal.status)}>
                                {statusLabel(proposal.status)}
                            </Badge>
                        </div>
                        <h1 className="text-2xl font-semibold text-foreground">{proposal.title}</h1>
                    </div>
                    <div className="text-left lg:text-right">
                        <p className="text-3xl font-bold text-foreground">
                            {formatTokens(proposal.tokenAmount)}
                        </p>
                        <p className="text-sm text-muted-foreground">tokens requested</p>
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-col sm:flex-row border-border border-b">
                <div className="flex-1 px-6 py-4 lg:px-12 border-border border-b sm:border-b-0 sm:border-r">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        <Target className="size-3" />
                        Target Date
                    </div>
                    <p className="text-foreground font-medium">
                        {new Date(proposal.targetDate * 1000).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex-1 px-6 py-4 lg:px-12 border-border border-b sm:border-b-0 sm:border-r">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        <Users className="size-3" />
                        Proposer
                    </div>
                    <p className="text-foreground font-medium font-mono text-sm">
                        {proposal.proposer}
                    </p>
                </div>
                <div className="flex-1 px-6 py-4 lg:px-12">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Deadline
                    </div>
                    {isVotingPhase || isCompletionPhase ? (
                        <Countdown
                            deadline={
                                isVotingPhase
                                    ? proposal.votingDeadline
                                    : proposal.completionDeadline
                            }
                        />
                    ) : (
                        <p className="text-foreground font-medium">Ended</p>
                    )}
                </div>
            </div>

            {/* Timeline */}
            <div className="border-border border-b">
                <div className="px-6 py-4 lg:px-12 border-border border-b">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        Timeline
                    </h3>
                </div>
                <div className="flex flex-col sm:flex-row">
                    <div
                        className={cn(
                            "flex-1 px-6 py-4 lg:px-8 border-border border-b sm:border-b-0 sm:border-r",
                            "bg-sage/30 border-l-4 border-l-green-500",
                        )}
                    >
                        <p className="font-medium text-foreground">Proposal Created</p>
                        <p className="text-sm text-muted-foreground">By {proposal.proposer}</p>
                    </div>
                    <div
                        className={cn(
                            "flex-1 px-6 py-4 lg:px-8 border-border border-b sm:border-b-0 sm:border-r",
                            isVotingPhase
                                ? "bg-lavender/50 border-l-4 border-l-primary"
                                : isPostVoting(proposal.status)
                                  ? "bg-sage/30 border-l-4 border-l-green-500"
                                  : "bg-secondary",
                        )}
                    >
                        <p className="font-medium text-foreground">Community Vote</p>
                        <p className="text-sm text-muted-foreground">
                            {isVotingPhase
                                ? "In progress"
                                : proposal.status === "Rejected"
                                  ? "Rejected"
                                  : proposal.status === "Expired"
                                    ? "Expired"
                                    : "Approved ✓"}
                        </p>
                    </div>
                    {isPostVoting(proposal.status) && (
                        <>
                            <div
                                className={cn(
                                    "flex-1 px-6 py-4 lg:px-8 border-border border-b sm:border-b-0 sm:border-r",
                                    proposal.status === "Approved"
                                        ? "bg-lavender/50 border-l-4 border-l-primary"
                                        : isCompletionVoting(proposal.status)
                                          ? "bg-sage/30 border-l-4 border-l-green-500"
                                          : "bg-secondary",
                                )}
                            >
                                <p className="font-medium text-foreground">Development</p>
                                <p className="text-sm text-muted-foreground">
                                    {proposal.status === "Approved"
                                        ? "In progress"
                                        : "Proof submitted ✓"}
                                </p>
                            </div>
                            {isCompletionVoting(proposal.status) && (
                                <div
                                    className={cn(
                                        "flex-1 px-6 py-4 lg:px-8",
                                        isCompletionPhase
                                            ? "bg-lavender/50 border-l-4 border-l-primary"
                                            : isFinalStatus(proposal.status)
                                              ? "bg-sage/30 border-l-4 border-l-green-500"
                                              : "bg-secondary",
                                    )}
                                >
                                    <p className="font-medium text-foreground">Completion Vote</p>
                                    <p className="text-sm text-muted-foreground">
                                        {isCompletionPhase
                                            ? "In progress"
                                            : proposal.status === "Completed"
                                              ? "Verified ✓"
                                              : proposal.status === "Overridden"
                                                ? "Override ✓"
                                                : "Disputed"}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Description */}
            <div className="border-border border-b px-6 py-6 lg:px-12">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                    Description
                </h3>
                <p className="text-muted-foreground leading-relaxed">{proposal.description}</p>
            </div>

            {/* Proof Section */}
            {proposal.proofUri && (
                <div className="border-border border-b px-6 py-6 lg:px-12">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Link2 className="size-4" />
                        Completion Proof
                    </h3>
                    <a
                        href={proposal.proofUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                    >
                        {proposal.proofUri}
                    </a>
                </div>
            )}

            {/* Vote Results */}
            <div className="border-border border-b px-6 py-6 lg:px-12">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
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
                    <div className="border-border border-b px-6 py-6 lg:px-12">
                        <label
                            htmlFor="vote-comment"
                            className="text-sm font-medium text-foreground block mb-2"
                        >
                            Add a comment (optional)
                        </label>
                        <Textarea
                            id="vote-comment"
                            placeholder="Share your reasoning for voting..."
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row">
                        <button
                            type="button"
                            onClick={() => handleVote(true)}
                            className="flex-1 px-6 py-6 flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 transition-colors border-border border-b sm:border-b-0 sm:border-r text-green-700 font-medium"
                        >
                            <Check className="size-5" />
                            Vote Yes
                        </button>
                        <button
                            type="button"
                            onClick={() => handleVote(false)}
                            className="flex-1 px-6 py-6 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 transition-colors text-red-700 font-medium"
                        >
                            <X className="size-5" />
                            Vote No
                        </button>
                    </div>
                </>
            )}

            {voted && (
                <div className="px-6 py-8 lg:px-12 text-center bg-sage/30">
                    <p className="font-semibold text-green-700">✓ Your vote has been recorded</p>
                </div>
            )}

            {!canVote && !voted && (
                <div className="px-6 py-8 lg:px-12 text-center">
                    <p className="text-muted-foreground">
                        Voting has ended. This proposal was {proposal.status.toLowerCase()}.
                    </p>
                </div>
            )}
        </div>
    );
}
