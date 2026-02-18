import { ArrowLeft, Calendar, CheckCircle, Clock, Lock, User, Users, Vote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function GovernanceDeepDivePage() {
    return (
        <article className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream">
                {/* Back Navigation */}
                <div className="border-border border-b px-6 py-4 lg:px-12 bg-sage/30">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Blog
                    </Link>
                </div>

                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                        Governance
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                        milestone governance - how community validation works
                    </h1>
                    <p className="text-muted-foreground max-w-3xl mb-6">
                        Deep dive into Sigil&apos;s milestone governance system, where community
                        token holders validate builder progress and control fund unlocks through
                        transparent onchain voting.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <User className="size-4" />
                            Sigil Team
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            Feb 5, 2026
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="size-4" />
                            7-9 min read
                        </span>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="border-border border-b aspect-video relative bg-sage/20">
                    <Image
                        src="https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80"
                        alt="Governance Deep Dive"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Content */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-12 lg:px-12 lg:py-16 max-w-3xl">
                        {/* Section: The Problem */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                the problem with traditional funding
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Most crypto funding is binary: you either get funded upfront (risky)
                                or don&apos;t get funded at all (limiting). This creates:
                            </p>
                            <div className="border border-border divide-y divide-border">
                                <div className="px-4 py-3 flex items-start gap-3">
                                    <Users className="size-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">
                                            For communities
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            No accountability after tokens launch
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-3 flex items-start gap-3">
                                    <User className="size-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">For builders</p>
                                        <p className="text-sm text-muted-foreground">
                                            Pressure to over-promise to secure funding
                                        </p>
                                    </div>
                                </div>
                                <div className="px-4 py-3 flex items-start gap-3">
                                    <Vote className="size-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">For everyone</p>
                                        <p className="text-sm text-muted-foreground">
                                            Misaligned incentives
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Progressive Unlocks */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                sigil&apos;s approach: progressive unlocks
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Instead of all-or-nothing funding, Sigil enables milestone-based
                                token unlocks validated by community governance.
                            </p>

                            <h3 className="text-lg font-medium text-foreground mb-4">
                                How It Works
                            </h3>
                            <div className="border border-border divide-y divide-border">
                                <div className="flex items-center gap-4 px-4 py-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Lock Tokens</p>
                                        <p className="text-sm text-muted-foreground">
                                            Projects lock LP tokens or native tokens in Sigil&apos;s
                                            vault
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 px-4 py-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Define Milestones
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Set clear, measurable deliverables
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 px-4 py-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Build & Deliver
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Complete milestones and submit for review
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 px-4 py-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        4
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            Community Vote
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Token holders validate completion
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 px-4 py-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        5
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Unlock Funds</p>
                                        <p className="text-sm text-muted-foreground">
                                            Approved milestones release locked tokens
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Governance Mechanics */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-6 lowercase">
                                governance mechanics
                            </h2>

                            <div className="grid gap-4 mb-6">
                                <div className="border border-border p-4 bg-sage/10">
                                    <h3 className="font-medium text-foreground mb-3">
                                        Milestone Proposals
                                    </h3>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p className="flex items-center gap-2">
                                            <div className="size-1.5 bg-primary" />
                                            Builder submits evidence of completion
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <div className="size-1.5 bg-primary" />
                                            Community votes to approve or reject
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <div className="size-1.5 bg-primary" />
                                            Passing unlocks associated tokens
                                        </p>
                                    </div>
                                </div>
                                <div className="border border-border p-4 bg-lavender/10">
                                    <h3 className="font-medium text-foreground mb-3">
                                        Parameter Proposals
                                    </h3>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p className="flex items-center gap-2">
                                            <div className="size-1.5 bg-primary" />
                                            Modify fee percentages
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <div className="size-1.5 bg-primary" />
                                            Adjust voting thresholds
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <div className="size-1.5 bg-primary" />
                                            Update protocol settings
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <h3 className="text-lg font-medium text-foreground mb-3">
                                Voting Power
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Your voting power is determined by:
                            </p>
                            <div className="grid sm:grid-cols-3 gap-3 mb-6">
                                <div className="border border-border px-4 py-3 text-center bg-background">
                                    <p className="text-2xl font-bold text-primary mb-1">1-5x</p>
                                    <p className="text-xs text-muted-foreground">
                                        Verification Score
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 text-center bg-background">
                                    <p className="text-2xl font-bold text-primary mb-1">+</p>
                                    <p className="text-xs text-muted-foreground">Token Holdings</p>
                                </div>
                                <div className="border border-border px-4 py-3 text-center bg-background">
                                    <p className="text-2xl font-bold text-primary mb-1">+</p>
                                    <p className="text-xs text-muted-foreground">
                                        Historical Participation
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-lg font-medium text-foreground mb-3">Thresholds</h3>
                            <div className="border border-border">
                                <div className="grid grid-cols-2 border-b border-border bg-sage/20">
                                    <div className="px-4 py-2 text-sm font-medium text-foreground">
                                        Parameter
                                    </div>
                                    <div className="px-4 py-2 text-sm font-medium text-foreground border-l border-border">
                                        Value
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-border">
                                    <div className="px-4 py-2 text-sm text-muted-foreground">
                                        Quorum
                                    </div>
                                    <div className="px-4 py-2 text-sm text-foreground border-l border-border">
                                        10% of supply
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-border">
                                    <div className="px-4 py-2 text-sm text-muted-foreground">
                                        Pass threshold
                                    </div>
                                    <div className="px-4 py-2 text-sm text-foreground border-l border-border">
                                        51% approval
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 border-b border-border">
                                    <div className="px-4 py-2 text-sm text-muted-foreground">
                                        Voting period
                                    </div>
                                    <div className="px-4 py-2 text-sm text-foreground border-l border-border">
                                        7 days
                                    </div>
                                </div>
                                <div className="grid grid-cols-2">
                                    <div className="px-4 py-2 text-sm text-muted-foreground">
                                        Execution delay
                                    </div>
                                    <div className="px-4 py-2 text-sm text-foreground border-l border-border">
                                        24 hours
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: For Builders */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                for builders
                            </h2>

                            <div className="border border-border p-4 mb-4 bg-sage/10">
                                <h3 className="font-medium text-foreground mb-3">
                                    Creating Good Milestones (SMART)
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">
                                            <strong>Specific</strong> - &quot;Deploy mainnet
                                            contract&quot;
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">
                                            <strong>Measurable</strong> - Quantifiable criteria
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">
                                            <strong>Achievable</strong> - Realistic timeframe
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">
                                            <strong>Relevant</strong> - Serves token holders
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="size-4 text-primary shrink-0 mt-0.5" />
                                        <span className="text-muted-foreground">
                                            <strong>Time-bound</strong> - Clear deadlines
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Why This Matters */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                why this matters
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Milestone governance creates:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="border border-border px-4 py-3 bg-lavender/10">
                                    <p className="font-medium text-foreground mb-1">
                                        Accountability
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Builders must deliver to earn
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 bg-lavender/10">
                                    <p className="font-medium text-foreground mb-1">Transparency</p>
                                    <p className="text-sm text-muted-foreground">
                                        Everything happens onchain
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 bg-lavender/10">
                                    <p className="font-medium text-foreground mb-1">Alignment</p>
                                    <p className="text-sm text-muted-foreground">
                                        Success requires community approval
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 bg-lavender/10">
                                    <p className="font-medium text-foreground mb-1">
                                        Sustainability
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Progressive unlocks reduce rug risk
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* CTAs */}
                        <section>
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                getting started
                            </h2>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    href="/verify"
                                    className="inline-flex items-center justify-center gap-2 border border-primary bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                                >
                                    <Lock className="size-4" />
                                    Lock Tokens & Create Milestones
                                </Link>
                                <Link
                                    href="/governance"
                                    className="inline-flex items-center justify-center gap-2 border border-border bg-background px-6 py-3 text-foreground font-medium hover:bg-secondary/50 transition-colors"
                                >
                                    <Vote className="size-4" />
                                    Participate in Governance
                                </Link>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="px-6 py-6 lg:px-12 bg-sage/30 flex items-center justify-between">
                    <Link
                        href="/blog/verification-guide"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Prev: Verification Guide
                    </Link>
                    <Link
                        href="/blog/understanding-zktls"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        Next: Understanding zkTLS
                        <ArrowLeft className="size-4 rotate-180" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
