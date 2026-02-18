/**
 * ProposalDetail Component
 *
 * Memorable proposal view with PixelCard hero, dramatic stats,
 * visual timeline, and engaging voting interface.
 */

"use client";

import {
    ArrowLeft,
    Calendar,
    Check,
    CheckCircle,
    Clock,
    Coins,
    ExternalLink,
    FileCheck,
    Link2,
    MessageSquare,
    Shield,
    Target,
    ThumbsDown,
    ThumbsUp,
    Users,
    Vote,
    X,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { PixelCard } from "@/components/ui/pixel-card";
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
        setVoted(true);
    };

    const isVotingPhase = proposal.status === "Voting";
    const isCompletionPhase = proposal.status === "ProofSubmitted";
    const canVote = isVotingPhase || isCompletionPhase;

    // Timeline steps
    const timelineSteps = [
        {
            label: "Created",
            sublabel: `By ${proposal.proposer.slice(0, 6)}...`,
            icon: FileCheck,
            status: "complete" as const,
        },
        {
            label: "Community Vote",
            sublabel: isVotingPhase
                ? "In progress"
                : proposal.status === "Rejected"
                  ? "Rejected"
                  : proposal.status === "Expired"
                    ? "Expired"
                    : "Approved",
            icon: Vote,
            status: isVotingPhase
                ? "active"
                : isPostVoting(proposal.status)
                  ? "complete"
                  : proposal.status === "Rejected" || proposal.status === "Expired"
                    ? "failed"
                    : ("pending" as const),
        },
        ...(isPostVoting(proposal.status)
            ? [
                  {
                      label: "Development",
                      sublabel:
                          proposal.status === "Approved"
                              ? "Building..."
                              : "Proof submitted",
                      icon: Clock,
                      status:
                          proposal.status === "Approved"
                              ? "active"
                              : isCompletionVoting(proposal.status)
                                ? "complete"
                                : ("pending" as const),
                  },
              ]
            : []),
        ...(isCompletionVoting(proposal.status)
            ? [
                  {
                      label: "Verification",
                      sublabel: isCompletionPhase
                          ? "Voting..."
                          : proposal.status === "Completed"
                            ? "Verified"
                            : proposal.status === "Overridden"
                              ? "Override"
                              : "Disputed",
                      icon: CheckCircle,
                      status: isCompletionPhase
                          ? "active"
                          : isFinalStatus(proposal.status)
                            ? "complete"
                            : ("failed" as const),
                  },
              ]
            : []),
    ];

    const getStepStyle = (status: string) => {
        switch (status) {
            case "complete":
                return "bg-sage/40 border-l-4 border-l-green-500";
            case "active":
                return "bg-lavender/50 border-l-4 border-l-primary";
            case "failed":
                return "bg-red-50 border-l-4 border-l-red-400";
            default:
                return "bg-secondary/50 border-l-4 border-l-border";
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Navigation Bar */}
            <div className="border-border border-b bg-cream/50">
                <div className="flex items-center justify-between px-6 py-3 lg:px-12">
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to proposals
                    </button>
                    <Badge variant={statusVariant(proposal.status)} className="text-xs">
                        {statusLabel(proposal.status)}
                    </Badge>
                </div>
            </div>

            {/* Hero Header with PixelCard */}
            <PixelCard
                variant="lavender"
                active
                centerFade
                noFocus
                className="border-border border-b bg-lavender/20"
            >
                <div className="flex flex-col lg:flex-row">
                    {/* Proposal ID Cell */}
                    <div className="lg:w-28 flex items-center justify-center px-6 py-6 lg:px-0 border-border border-b lg:border-b-0 lg:border-r">
                        <div className="size-16 bg-lavender/40 border-2 border-border flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground uppercase">Prop</span>
                            <span className="text-2xl font-bold text-primary">#{proposal.id}</span>
                        </div>
                    </div>

                    {/* Title Section */}
                    <div className="flex-1 px-6 py-6 lg:px-10 lg:py-8 border-l-4 border-l-primary">
                        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground mb-2">
                            {proposal.title}
                        </h1>
                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                            <Users className="size-4" />
                            Proposed by
                            <span className="font-mono text-foreground">{proposal.proposer}</span>
                        </p>
                    </div>
                </div>
            </PixelCard>

            {/* Stats Row */}
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-border border-b bg-background">
                <div className="flex-1 px-6 py-5 lg:px-8 text-center">
                    <div className="text-3xl font-bold text-primary mb-1">
                        {formatTokens(proposal.tokenAmount)}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                        <Coins className="size-3.5" />
                        Tokens Requested
                    </div>
                </div>
                <div className="flex-1 px-6 py-5 lg:px-8 text-center">
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {new Date(proposal.targetDate * 1000).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                        <Target className="size-3.5" />
                        Target Date
                    </div>
                </div>
                <div className="flex-1 px-6 py-5 lg:px-8 text-center">
                    {isVotingPhase || isCompletionPhase ? (
                        <>
                            <div className="text-3xl font-bold text-amber-600 mb-1">
                                <Countdown
                                    deadline={
                                        isVotingPhase
                                            ? proposal.votingDeadline
                                            : proposal.completionDeadline
                                    }
                                />
                            </div>
                            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                                <Clock className="size-3.5" />
                                Time Remaining
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-3xl font-bold text-muted-foreground mb-1">—</div>
                            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                                <Clock className="size-3.5" />
                                Voting Ended
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Visual Timeline */}
            <div className="border-border border-b">
                <div className="px-6 py-3 lg:px-12 border-border border-b bg-sage/10">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Proposal Timeline
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border">
                    {timelineSteps.map((step, index) => (
                        <div
                            key={step.label}
                            className={cn("flex-1 px-6 py-4 lg:px-8", getStepStyle(step.status))}
                        >
                            <div className="flex items-start gap-3">
                                <div
                                    className={cn(
                                        "size-10 border flex items-center justify-center shrink-0",
                                        step.status === "complete"
                                            ? "bg-green-100 border-green-300"
                                            : step.status === "active"
                                              ? "bg-primary/20 border-primary"
                                              : step.status === "failed"
                                                ? "bg-red-100 border-red-300"
                                                : "bg-secondary border-border",
                                    )}
                                >
                                    <step.icon
                                        className={cn(
                                            "size-5",
                                            step.status === "complete"
                                                ? "text-green-600"
                                                : step.status === "active"
                                                  ? "text-primary"
                                                  : step.status === "failed"
                                                    ? "text-red-500"
                                                    : "text-muted-foreground",
                                        )}
                                    />
                                </div>
                                <div>
                                    <p className="font-medium text-foreground text-sm">
                                        {index + 1}. {step.label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{step.sublabel}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Description */}
            <div className="border-border border-b">
                <div className="px-6 py-3 lg:px-12 border-border border-b bg-cream/30">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Proposal Description
                    </span>
                </div>
                <div className="px-6 py-6 lg:px-12">
                    <p className="text-muted-foreground leading-relaxed">{proposal.description}</p>
                </div>
            </div>

            {/* Proof Section */}
            {proposal.proofUri && (
                <div className="border-border border-b bg-sage/10">
                    <div className="px-6 py-3 lg:px-12 border-border border-b">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Link2 className="size-3" />
                            Completion Proof
                        </span>
                    </div>
                    <div className="px-6 py-5 lg:px-12">
                        <a
                            href={proposal.proofUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                            <ExternalLink className="size-4" />
                            View submitted proof
                        </a>
                        <p className="text-xs text-muted-foreground mt-2 font-mono break-all">
                            {proposal.proofUri}
                        </p>
                    </div>
                </div>
            )}

            {/* Voting Section */}
            <div className="border-border border-b">
                <div className="px-6 py-3 lg:px-12 border-border border-b bg-lavender/10">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Vote className="size-3" />
                        {isCompletionPhase ? "Completion Vote" : "Community Vote"}
                    </span>
                </div>
                <div className="px-6 py-6 lg:px-12">
                    <VoteBar
                        yesVotes={isCompletionPhase ? proposal.completionYes : proposal.yesVotes}
                        noVotes={isCompletionPhase ? proposal.completionNo : proposal.noVotes}
                        quorum="4B tokens (4%)"
                        size="large"
                    />
                </div>
            </div>

            {/* Voting Actions */}
            {canVote && !voted && (
                <>
                    {/* Comment Section */}
                    <div className="border-border border-b">
                        <div className="px-6 py-3 lg:px-12 border-border border-b bg-cream/30">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <MessageSquare className="size-3" />
                                Your Vote
                            </span>
                        </div>
                        <div className="px-6 py-5 lg:px-12">
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
                                className="resize-none"
                            />
                        </div>
                    </div>

                    {/* Vote Buttons */}
                    <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-border border-b">
                        <button
                            type="button"
                            onClick={() => handleVote(true)}
                            className="flex-1 flex flex-col sm:flex-row transition-colors"
                        >
                            {/* Icon Cell */}
                            <div className="px-6 py-6 sm:px-8 flex items-center justify-center border-border border-b sm:border-b-0 sm:border-r bg-green-100">
                                <div className="size-12 bg-green-200 border border-green-400 flex items-center justify-center">
                                    <ThumbsUp className="size-6 text-green-700" />
                                </div>
                            </div>
                            {/* Content Cell */}
                            <div className="flex-1 px-6 py-6 sm:px-8 flex flex-col justify-center bg-green-50 hover:bg-green-100 transition-colors">
                                <span className="text-green-800 font-semibold text-lg lowercase">vote yes</span>
                                <span className="text-green-600/80 text-sm">Approve this milestone and release tokens</span>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleVote(false)}
                            className="flex-1 flex flex-col sm:flex-row transition-colors"
                        >
                            {/* Icon Cell */}
                            <div className="px-6 py-6 sm:px-8 flex items-center justify-center border-border border-b sm:border-b-0 sm:border-r bg-red-100">
                                <div className="size-12 bg-red-200 border border-red-400 flex items-center justify-center">
                                    <ThumbsDown className="size-6 text-red-700" />
                                </div>
                            </div>
                            {/* Content Cell */}
                            <div className="flex-1 px-6 py-6 sm:px-8 flex flex-col justify-center bg-red-50 hover:bg-red-100 transition-colors">
                                <span className="text-red-800 font-semibold text-lg lowercase">vote no</span>
                                <span className="text-red-600/80 text-sm">Reject this milestone proposal</span>
                            </div>
                        </button>
                    </div>
                </>
            )}

            {/* Vote Confirmation */}
            {voted && (
                <PixelCard
                    variant="sage"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b"
                >
                    <div className="px-6 py-10 lg:px-12 text-center">
                        <div className="size-16 bg-green-100 border-2 border-green-300 flex items-center justify-center mx-auto mb-4">
                            <Check className="size-8 text-green-600" />
                        </div>
                        <p className="text-xl font-semibold text-green-700 mb-2">
                            Your vote has been recorded
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Thank you for participating in governance.
                        </p>
                    </div>
                </PixelCard>
            )}

            {/* Voting Ended State */}
            {!canVote && !voted && (
                <div className="border-border border-b bg-secondary/30">
                    <div className="px-6 py-8 lg:px-12 text-center">
                        <div className="size-14 bg-secondary border border-border flex items-center justify-center mx-auto mb-4">
                            <Clock className="size-7 text-muted-foreground" />
                        </div>
                        <p className="text-lg font-medium text-foreground mb-1">Voting has ended</p>
                        <p className="text-sm text-muted-foreground">
                            This proposal was {proposal.status.toLowerCase()}.
                        </p>
                    </div>
                </div>
            )}

            {/* Info Card */}
            <div className="bg-cream/30">
                <div className="px-6 py-3 lg:px-12 border-border border-b">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Governance Info
                    </span>
                </div>
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border border-border border-b">
                    <div className="flex-1 px-6 py-4 lg:px-8">
                        <div className="flex items-start gap-3">
                            <div className="size-9 bg-lavender/30 border border-border flex items-center justify-center shrink-0">
                                <Shield className="size-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Onchain Voting</p>
                                <p className="text-xs text-muted-foreground">
                                    All votes are permanently recorded on Base.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 px-6 py-4 lg:px-8">
                        <div className="flex items-start gap-3">
                            <div className="size-9 bg-sage/30 border border-border flex items-center justify-center shrink-0">
                                <Calendar className="size-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">5-Day Window</p>
                                <p className="text-xs text-muted-foreground">
                                    Voting closes automatically after 5 days.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 px-6 py-4 lg:px-8">
                        <div className="flex items-start gap-3">
                            <div className="size-9 bg-amber-50 border border-border flex items-center justify-center shrink-0">
                                <Coins className="size-4 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-foreground">Token Escrow</p>
                                <p className="text-xs text-muted-foreground">
                                    Funds release after verified completion.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer */}
            <div className="border-border border-t px-6 py-4 lg:px-12 bg-sage/20">
                <p className="text-xs text-muted-foreground text-center">
                    All governance actions are recorded permanently onchain via Base.
                </p>
            </div>
        </div>
    );
}
