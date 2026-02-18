/**
 * GovernanceHeader
 *
 * Memorable header with PixelCard hero, dramatic stats,
 * briefing cards, and visual governance flow.
 */

import {
    ArrowRight,
    Check,
    CheckCircle,
    Clock,
    FileCheck,
    Hourglass,
    Landmark,
    Vote,
} from "lucide-react";

import { PixelCard } from "@/components/ui/pixel-card";

import type { Proposal } from "../types";
import { formatTokens } from "../utils";

interface GovernanceHeaderProps {
    proposals: Proposal[];
    escrowBalance: string;
}

export function GovernanceHeader({ proposals, escrowBalance }: GovernanceHeaderProps) {
    const activeVotes = proposals.filter((p) => p.status === "Voting").length;
    const completed = proposals.filter((p) =>
        ["Completed", "Overridden"].includes(p.status),
    ).length;
    const pending = proposals.filter((p) =>
        ["Approved", "ProofSubmitted"].includes(p.status),
    ).length;

    const stats = [
        {
            label: "In Escrow",
            value: formatTokens(escrowBalance),
            subtext: "USDC locked",
            icon: Hourglass,
            accent: "text-amber-600",
        },
        {
            label: "Active Votes",
            value: activeVotes.toString(),
            subtext: "awaiting votes",
            icon: Vote,
            accent: "text-primary",
        },
        {
            label: "In Progress",
            value: pending.toString(),
            subtext: "being built",
            icon: Clock,
            accent: "text-blue-600",
        },
        {
            label: "Completed",
            value: completed.toString(),
            subtext: "milestones done",
            icon: CheckCircle,
            accent: "text-green-600",
        },
    ];

    const flowSteps = [
        { label: "Propose", icon: FileCheck, color: "bg-lavender/50" },
        { label: "Vote", icon: Vote, color: "bg-primary/10" },
        { label: "Build", icon: Clock, color: "bg-blue-50" },
        { label: "Verify", icon: Check, color: "bg-green-50" },
    ];

    return (
        <div className="border-border border-b">
            {/* Hero Section with PixelCard */}
            <PixelCard
                variant="lavender"
                active
                centerFade
                noFocus
                className="bg-lavender/20"
            >
                <div className="flex flex-col lg:flex-row">
                    {/* Icon Feature Cell */}
                    <div className="lg:w-32 px-6 py-8 lg:px-0 lg:py-0 flex items-center justify-center border-border border-b lg:border-b-0 lg:border-r">
                        <div className="size-20 bg-lavender/40 border-2 border-border flex items-center justify-center">
                            <Landmark className="size-10 text-primary" />
                        </div>
                    </div>

                    {/* Title Section with Accent Border */}
                    <div className="flex-1 px-6 py-8 lg:px-10 lg:py-10 border-l-4 border-l-primary">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-2">
                            governance
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground lowercase mb-3">
                            milestone proposals
                        </h1>
                        <p className="text-muted-foreground max-w-xl">
                            Propose milestones, vote on unlocks, and shape the future of this project.
                            Developers earn tokens by delivering on their promises.
                        </p>
                    </div>
                </div>
            </PixelCard>

            {/* Stats Row - Full Width Bordered Cells */}
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-border border-b bg-background">
                {stats.map((stat) => (
                    <div
                        key={stat.label}
                        className="flex-1 px-6 py-6 lg:px-8 text-center"
                    >
                        <div className={`text-4xl font-bold mb-1 ${stat.accent}`}>
                            {stat.value}
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground uppercase tracking-wider">
                            <stat.icon className="size-3.5" />
                            {stat.label}
                        </div>
                        <p className="text-xs text-muted-foreground/70 mt-1">{stat.subtext}</p>
                    </div>
                ))}
            </div>

            {/* Visual Flow - Governance Process */}
            <div className="bg-sage/10 border-border border-b">
                <div className="px-6 py-3 lg:px-8 border-border border-b">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        How it works
                    </span>
                </div>
                <div className="flex items-stretch divide-x divide-border">
                    {flowSteps.map((step, index) => (
                        <div
                            key={step.label}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 lg:py-5 ${step.color}`}
                        >
                            <div className="flex items-center gap-2">
                                <div className="size-8 border border-border bg-background flex items-center justify-center">
                                    <step.icon className="size-4 text-foreground" />
                                </div>
                                <span className="text-sm font-medium text-foreground hidden sm:inline">
                                    {step.label}
                                </span>
                            </div>
                            {index < flowSteps.length - 1 && (
                                <ArrowRight className="size-4 text-muted-foreground/50 hidden lg:block ml-2" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Briefing Cards */}
            <div className="bg-cream/30">
                <div className="px-6 py-3 lg:px-8 border-border border-b">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Governance Briefing
                    </span>
                </div>
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border">
                    {/* Quorum Card */}
                    <div className="flex-1 px-6 py-5 lg:px-8">
                        <div className="flex items-start gap-3">
                            <div className="size-10 bg-lavender/30 border border-border flex items-center justify-center shrink-0">
                                <Vote className="size-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-1">
                                    Quorum Required
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    4% of total supply (4B tokens) must vote for proposals to pass.
                                    Your vote matters.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Voting Period Card */}
                    <div className="flex-1 px-6 py-5 lg:px-8">
                        <div className="flex items-start gap-3">
                            <div className="size-10 bg-sage/30 border border-border flex items-center justify-center shrink-0">
                                <Clock className="size-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-1">
                                    5-Day Voting Period
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    All proposals have a 5-day voting window. After approval,
                                    builders have until their target date.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Escrow Card */}
                    <div className="flex-1 px-6 py-5 lg:px-8">
                        <div className="flex items-start gap-3">
                            <div className="size-10 bg-amber-50 border border-border flex items-center justify-center shrink-0">
                                <Hourglass className="size-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-1">
                                    Token Escrow
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Requested tokens are held in escrow until milestone completion
                                    is verified by the community.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
