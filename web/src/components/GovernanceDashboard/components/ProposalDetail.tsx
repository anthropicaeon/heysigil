/**
 * ProposalDetail Component
 *
 * Full proposal view with on-chain voting interface.
 * Calls SigilEscrow.vote/voteWithComment/finalizeVote via Privy wallet.
 * Pastel aesthetic with consistent borders.
 */

"use client";

import { ArrowLeft, Check, CheckCircle, Link2, Loader2, Target, Users, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useEscrowWrite } from "@/hooks/useEscrowWrite";

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
    onVoteComplete?: () => void;
}

export function ProposalDetail({ proposal, onBack, onVoteComplete }: ProposalDetailProps) {
    const [comment, setComment] = useState("");
    const [proofUri, setProofUri] = useState("");

    const {
        vote,
        voteWithComment,
        finalizeVote,
        submitProof,
        voteCompletion,
        voteCompletionWithComment,
        finalizeCompletion,
        state,
    } = useEscrowWrite();

    const isVotingPhase = proposal.status === "Voting";
    const isCompletionPhase = proposal.status === "ProofSubmitted";
    const isApproved = proposal.status === "Approved";
    const canVote = isVotingPhase || isCompletionPhase;

    // Check if voting deadline has passed (for finalize button)
    const now = Math.floor(Date.now() / 1000);
    const votingExpired = isVotingPhase && now >= proposal.votingDeadline;
    const completionExpired = isCompletionPhase && now >= proposal.completionDeadline;

    const handleVote = async (support: boolean) => {
        const proposalId = BigInt(proposal.id);
        let hash;

        if (isCompletionPhase) {
            hash = comment
                ? await voteCompletionWithComment(proposalId, support, comment)
                : await voteCompletion(proposalId, support);
        } else {
            hash = comment
                ? await voteWithComment(proposalId, support, comment)
                : await vote(proposalId, support);
        }

        if (hash && onVoteComplete) {
            setTimeout(() => onVoteComplete(), 2000);
        }
    };

    const handleFinalize = async () => {
        const proposalId = BigInt(proposal.id);
        let hash;

        if (isVotingPhase) {
            hash = await finalizeVote(proposalId);
        } else if (isCompletionPhase) {
            hash = await finalizeCompletion(proposalId);
        }

        if (hash && onVoteComplete) {
            setTimeout(() => onVoteComplete(), 2000);
        }
    };

    const handleSubmitProof = async () => {
        if (!proofUri) return;
        const hash = await submitProof(BigInt(proposal.id), proofUri);
        if (hash && onVoteComplete) {
            setTimeout(() => onVoteComplete(), 2000);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Back button */}
            <div className="border-border border-b px-6 py-4 lg:px-12 bg-sage/10">
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
            <div className="border-border border-b">
                <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-2/3 px-6 py-6 lg:px-12 lg:py-8 border-border border-b lg:border-b-0 lg:border-r">
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
                    <div className="lg:w-1/3 px-6 py-6 lg:px-8 flex flex-col justify-center">
                        <p className="text-3xl font-bold text-foreground">
                            {formatTokens(proposal.tokenAmount)}
                        </p>
                        <p className="text-sm text-muted-foreground">tokens requested</p>
                    </div>
                </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-border border-b">
                <div className="flex-1 px-6 py-4 lg:px-12">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        <Target className="size-3" />
                        Target Date
                    </div>
                    <p className="text-foreground font-medium">
                        {new Date(proposal.targetDate * 1000).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex-1 px-6 py-4 lg:px-12">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        <Users className="size-3" />
                        Proposer
                    </div>
                    <p className="text-foreground font-medium font-mono text-sm">
                        {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
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
            <div className="border-border border-b bg-lavender/10">
                <div className="px-6 py-4 lg:px-12 border-border border-b">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                        Timeline
                    </h3>
                </div>
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <div className={cn("flex-1 px-6 py-4 lg:px-8", "bg-sage/30")}>
                        <p className="font-medium text-foreground">Proposal Created</p>
                        <p className="text-sm text-muted-foreground">
                            By {proposal.proposer.slice(0, 6)}...{proposal.proposer.slice(-4)}
                        </p>
                    </div>
                    <div
                        className={cn(
                            "flex-1 px-6 py-4 lg:px-8",
                            isVotingPhase
                                ? "bg-lavender/40"
                                : isPostVoting(proposal.status)
                                    ? "bg-sage/30"
                                    : "bg-cream/30",
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
                                    "flex-1 px-6 py-4 lg:px-8",
                                    proposal.status === "Approved"
                                        ? "bg-lavender/40"
                                        : isCompletionVoting(proposal.status)
                                            ? "bg-sage/30"
                                            : "bg-cream/30",
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
                                            ? "bg-lavender/40"
                                            : isFinalStatus(proposal.status)
                                                ? "bg-sage/30"
                                                : "bg-cream/30",
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
                <div className="border-border border-b px-6 py-6 lg:px-12 bg-sage/10">
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
                    quorum="4% of total supply"
                />
            </div>

            {/* Tx state feedback */}
            {state.txHash && (
                <div className="px-6 py-4 bg-sage/20 border-border border-b">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="size-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold text-foreground">Transaction Submitted</p>
                            <a
                                href={`https://basescan.org/tx/${state.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                            >
                                View on Basescan ↗
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {state.error && (
                <div className="px-6 py-4 bg-rose/20 border-border border-b">
                    <p className="text-sm text-foreground">{state.error}</p>
                </div>
            )}

            {/* Submit Proof (for dev when Approved) */}
            {isApproved && (
                <div className="border-border border-b px-6 py-6 lg:px-12">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
                        Submit Completion Proof
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                        Only the dev wallet can submit proof. Paste a URL to your proof
                        (GitHub PR, deployment, etc.).
                    </p>
                    <div className="flex gap-2">
                        <Input
                            placeholder="https://github.com/..."
                            value={proofUri}
                            onChange={(e) => setProofUri(e.target.value)}
                            disabled={state.isPending}
                            className="flex-1"
                        />
                        <button
                            type="button"
                            onClick={handleSubmitProof}
                            disabled={!proofUri || state.isPending}
                            className="px-4 py-2 border border-border bg-sage/20 hover:bg-sage/40 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            {state.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                "Submit"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Finalize button (when deadline passed) */}
            {(votingExpired || completionExpired) && !state.txHash && (
                <div className="border-border border-b px-6 py-4 lg:px-12 bg-lavender/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-foreground">
                                {votingExpired ? "Voting period ended" : "Completion voting ended"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Anyone can finalize this proposal to update its status.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={handleFinalize}
                            disabled={state.isPending}
                            className="px-4 py-2 border border-border bg-background hover:bg-secondary/30 text-sm font-medium transition-colors disabled:opacity-50 gap-2 inline-flex items-center"
                        >
                            {state.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                "Finalize"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Voting Actions */}
            {canVote && !votingExpired && !completionExpired && !state.txHash && (
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
                            disabled={state.isPending}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-border border-b">
                        <button
                            type="button"
                            onClick={() => handleVote(true)}
                            disabled={state.isPending}
                            className="flex-1 px-6 py-6 flex items-center justify-center gap-2 bg-sage/20 hover:bg-sage/40 transition-colors text-foreground font-medium disabled:opacity-50"
                        >
                            {state.isPending ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <Check className="size-5" />
                            )}
                            Vote Yes
                        </button>
                        <button
                            type="button"
                            onClick={() => handleVote(false)}
                            disabled={state.isPending}
                            className="flex-1 px-6 py-6 flex items-center justify-center gap-2 bg-rose/20 hover:bg-rose/40 transition-colors text-foreground font-medium disabled:opacity-50"
                        >
                            {state.isPending ? (
                                <Loader2 className="size-5 animate-spin" />
                            ) : (
                                <X className="size-5" />
                            )}
                            Vote No
                        </button>
                    </div>
                </>
            )}

            {!canVote && !isApproved && (
                <div className="px-6 py-8 lg:px-12 text-center border-border border-b">
                    <p className="text-muted-foreground">
                        Voting has ended. This proposal was {proposal.status.toLowerCase()}.
                    </p>
                </div>
            )}

            {/* Spacer to push footer down */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="border-border border-t px-6 py-4 lg:px-12 bg-sage/20">
                <p className="text-xs text-muted-foreground text-center">
                    All votes are recorded permanently onchain via Base.
                </p>
            </div>
        </div>
    );
}
