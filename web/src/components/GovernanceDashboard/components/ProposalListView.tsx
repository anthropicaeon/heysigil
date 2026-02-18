/**
 * ProposalListView
 *
 * Renders proposal list with section header.
 * Pastel aesthetic with memorable empty state.
 */

import { ArrowRight, FileCheck, Lightbulb, Rocket, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";

import type { Proposal, TabFilter } from "../types";
import { ProposalCard } from "./ProposalCard";

interface ProposalListViewProps {
    proposals: Proposal[];
    activeTab: TabFilter;
    onSelectProposal: (proposal: Proposal) => void;
}

export function ProposalListView({
    proposals,
    activeTab,
    onSelectProposal,
}: ProposalListViewProps) {
    if (proposals.length > 0) {
        return (
            <div className="flex-1 flex flex-col bg-background">
                {/* Section Header */}
                <div className="px-6 py-4 lg:px-12 border-border border-b bg-cream/30">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            {activeTab === "all"
                                ? "All Proposals"
                                : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Proposals`}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {proposals.length} {proposals.length === 1 ? "proposal" : "proposals"}
                        </span>
                    </div>
                </div>
                {/* Proposal List */}
                <div className="flex-1 flex flex-col divide-y divide-border border-border border-b">
                    {proposals.map((p) => (
                        <ProposalCard key={p.id} proposal={p} onClick={() => onSelectProposal(p)} />
                    ))}
                </div>
            </div>
        );
    }

    // Empty State - Pastel Design
    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Section Header */}
            <div className="px-6 py-4 lg:px-12 border-border border-b bg-cream/30">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Proposals
                </span>
            </div>

            {/* Hero Empty State */}
            <PixelCard
                variant="sage"
                active
                centerFade
                noFocus
                className="flex-1 flex flex-col border-border border-b"
            >
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:px-12 text-center">
                    {/* Large Icon */}
                    <div className="size-20 bg-sage/40 border border-border flex items-center justify-center mb-6">
                        <FileCheck className="size-10 text-muted-foreground/60" />
                    </div>

                    <h3 className="text-2xl font-semibold text-foreground mb-3 lowercase">
                        no proposals yet
                    </h3>
                    <p className="text-muted-foreground max-w-md mb-8">
                        {activeTab === "all"
                            ? "Governance launches when the first milestone proposal is created. Be the pioneer and set the direction for this project."
                            : `No ${activeTab} proposals found. Check other tabs or create a new proposal.`}
                    </p>

                    {activeTab === "all" && (
                        <Button size="lg" className="gap-2">
                            Create First Proposal
                            <ArrowRight className="size-4" />
                        </Button>
                    )}
                </div>
            </PixelCard>

            {/* Getting Started Cards */}
            {activeTab === "all" && (
                <div className="bg-lavender/10">
                    <div className="px-6 py-3 lg:px-8 border-border border-b">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Getting Started
                        </span>
                    </div>
                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border border-border border-b">
                        {/* Step 1 */}
                        <div className="flex-1 px-6 py-5 lg:px-8">
                            <div className="flex items-start gap-3">
                                <div className="size-10 bg-sage/30 border border-border flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-foreground">1</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                                        <Lightbulb className="size-4 text-muted-foreground" />
                                        Define Your Milestone
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        What will you build? Set a clear, measurable goal with a target date.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="flex-1 px-6 py-5 lg:px-8">
                            <div className="flex items-start gap-3">
                                <div className="size-10 bg-sage/30 border border-border flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-foreground">2</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                                        <Users className="size-4 text-muted-foreground" />
                                        Community Votes
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Token holders vote on your proposal. 4% quorum required to pass.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="flex-1 px-6 py-5 lg:px-8">
                            <div className="flex items-start gap-3">
                                <div className="size-10 bg-sage/30 border border-border flex items-center justify-center shrink-0">
                                    <span className="text-sm font-bold text-foreground">3</span>
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                                        <Rocket className="size-4 text-muted-foreground" />
                                        Deliver & Earn
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Complete your milestone, submit proof, and receive your tokens.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
