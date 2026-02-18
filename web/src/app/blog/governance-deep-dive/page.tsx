import { ArrowLeft, Calendar, CheckCircle, Clock, Lock, User, Users, Vote } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GovernanceDeepDivePage() {
    return (
        <article className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                {/* Back Navigation */}
                <div className="border-border border-b px-6 py-3 lg:px-12 bg-sage/30">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        Back to Blog
                    </Link>
                </div>

                {/* Header */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-2/3 px-6 py-10 lg:px-12 lg:py-14 border-border border-b lg:border-b-0 lg:border-r">
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                                Governance
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                                milestone governance - how community validation works
                            </h1>
                            <p className="text-muted-foreground">
                                Deep dive into Sigil&apos;s milestone governance system, where community
                                token holders validate builder progress and control fund unlocks through
                                transparent onchain voting.
                            </p>
                        </div>
                        <div className="lg:w-1/3 flex flex-col">
                            <div className="flex-1 px-6 py-6 lg:px-8 border-border border-b flex items-center gap-3">
                                <User className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Sigil Team</span>
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 border-border border-b flex items-center gap-3">
                                <Calendar className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Feb 5, 2026</span>
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 flex items-center gap-3">
                                <Clock className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">7-9 min read</span>
                            </div>
                        </div>
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

                {/* Section: The Problem */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-4 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-rose/20">
                            <h2 className="text-lg font-semibold text-foreground lowercase">
                                the problem with traditional funding
                            </h2>
                        </div>
                        <div className="lg:w-2/3 px-6 py-6 lg:px-12 border-border border-b">
                            <p className="text-muted-foreground">
                                Most crypto funding is binary: you either get funded upfront (risky)
                                or don&apos;t get funded at all (limiting). This creates problems.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Problem List */}
                <div className="border-border border-b divide-y divide-border bg-rose/10">
                    <div className="px-6 py-3 lg:px-12 flex items-start gap-3">
                        <Users className="size-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">For communities</p>
                            <p className="text-sm text-muted-foreground">No accountability after tokens launch</p>
                        </div>
                    </div>
                    <div className="px-6 py-3 lg:px-12 flex items-start gap-3">
                        <User className="size-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">For builders</p>
                            <p className="text-sm text-muted-foreground">Pressure to over-promise to secure funding</p>
                        </div>
                    </div>
                    <div className="px-6 py-3 lg:px-12 flex items-start gap-3">
                        <Vote className="size-5 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-foreground">For everyone</p>
                            <p className="text-sm text-muted-foreground">Misaligned incentives</p>
                        </div>
                    </div>
                </div>

                {/* Section: The Solution */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            sigil&apos;s approach: progressive unlocks
                        </h2>
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-background">
                        <p className="text-muted-foreground">
                            Instead of all-or-nothing funding, Sigil enables milestone-based
                            token unlocks validated by community governance.
                        </p>
                    </div>
                </div>

                {/* How It Works Steps */}
                <div className="border-border border-b divide-y divide-border bg-background">
                    {[
                        { num: "1", title: "Lock Tokens", desc: "Projects lock LP tokens or native tokens in Sigil's vault" },
                        { num: "2", title: "Define Milestones", desc: "Set clear, measurable deliverables" },
                        { num: "3", title: "Build & Deliver", desc: "Complete milestones and submit for review" },
                        { num: "4", title: "Community Vote", desc: "Token holders validate completion" },
                        { num: "5", title: "Unlock Funds", desc: "Approved milestones release locked tokens" },
                    ].map((step) => (
                        <div key={step.num} className="flex items-center gap-4 px-6 py-4 lg:px-12">
                            <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                                {step.num}
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{step.title}</p>
                                <p className="text-sm text-muted-foreground">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section: Governance Mechanics */}
                <div className="bg-lavender/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            governance mechanics
                        </h2>
                    </div>
                </div>

                {/* Proposal Types Grid */}
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-6 lg:px-8 bg-sage/10">
                        <h3 className="font-medium text-foreground mb-3">Milestone Proposals</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="size-2 bg-primary" />
                                Builder submits evidence of completion
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-2 bg-primary" />
                                Community votes to approve or reject
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-2 bg-primary" />
                                Passing unlocks associated tokens
                            </div>
                        </div>
                    </div>
                    <div className="px-6 py-6 lg:px-8 bg-lavender/10">
                        <h3 className="font-medium text-foreground mb-3">Parameter Proposals</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="size-2 bg-primary" />
                                Modify fee percentages
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-2 bg-primary" />
                                Adjust voting thresholds
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-2 bg-primary" />
                                Update protocol settings
                            </div>
                        </div>
                    </div>
                </div>

                {/* Voting Power */}
                <div className="bg-background">
                    <div className="px-6 py-2 lg:px-12 border-border border-b bg-sage/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Voting Power
                        </span>
                    </div>
                </div>
                <div className="border-border border-b grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    <div className="px-6 py-4 lg:px-6 text-center bg-background">
                        <p className="text-2xl font-bold text-primary mb-1">1-5x</p>
                        <p className="text-xs text-muted-foreground">Verification Score</p>
                    </div>
                    <div className="px-6 py-4 lg:px-6 text-center bg-background">
                        <p className="text-2xl font-bold text-primary mb-1">+</p>
                        <p className="text-xs text-muted-foreground">Token Holdings</p>
                    </div>
                    <div className="px-6 py-4 lg:px-6 text-center bg-background">
                        <p className="text-2xl font-bold text-primary mb-1">+</p>
                        <p className="text-xs text-muted-foreground">Historical Participation</p>
                    </div>
                </div>

                {/* Thresholds Table */}
                <div className="bg-background">
                    <div className="px-6 py-2 lg:px-12 border-border border-b bg-lavender/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Governance Thresholds
                        </span>
                    </div>
                </div>
                <div className="border-border border-b bg-background">
                    <div className="grid grid-cols-2 border-b border-border bg-sage/20">
                        <div className="px-6 py-2 lg:px-12 text-sm font-medium text-foreground">Parameter</div>
                        <div className="px-6 py-2 lg:px-12 text-sm font-medium text-foreground border-l border-border">Value</div>
                    </div>
                    {[
                        { param: "Quorum", value: "10% of supply" },
                        { param: "Pass threshold", value: "51% approval" },
                        { param: "Voting period", value: "7 days" },
                        { param: "Execution delay", value: "24 hours" },
                    ].map((row, i, arr) => (
                        <div key={row.param} className={`grid grid-cols-2 ${i < arr.length - 1 ? "border-b border-border" : ""}`}>
                            <div className="px-6 py-2 lg:px-12 text-sm text-muted-foreground">{row.param}</div>
                            <div className="px-6 py-2 lg:px-12 text-sm text-foreground border-l border-border">{row.value}</div>
                        </div>
                    ))}
                </div>

                {/* Section: For Builders */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            for builders: creating good milestones
                        </h2>
                    </div>
                </div>
                <div className="border-border border-b grid sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-border bg-sage/10">
                    {[
                        { letter: "S", word: "Specific", example: "Deploy mainnet contract" },
                        { letter: "M", word: "Measurable", example: "Quantifiable criteria" },
                        { letter: "A", word: "Achievable", example: "Realistic timeframe" },
                        { letter: "R", word: "Relevant", example: "Serves token holders" },
                        { letter: "T", word: "Time-bound", example: "Clear deadlines" },
                    ].map((item) => (
                        <div key={item.letter} className="px-4 py-4 flex flex-col items-center text-center">
                            <div className="size-8 bg-primary text-primary-foreground flex items-center justify-center font-bold mb-2">
                                {item.letter}
                            </div>
                            <p className="font-medium text-foreground text-sm">{item.word}</p>
                            <p className="text-xs text-muted-foreground">{item.example}</p>
                        </div>
                    ))}
                </div>

                {/* Section: Why This Matters */}
                <div className="bg-lavender/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            why this matters
                        </h2>
                    </div>
                </div>
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-4 lg:px-8 bg-lavender/10">
                        <p className="font-medium text-foreground mb-1">Accountability</p>
                        <p className="text-sm text-muted-foreground">Builders must deliver to earn</p>
                    </div>
                    <div className="px-6 py-4 lg:px-8 bg-lavender/10">
                        <p className="font-medium text-foreground mb-1">Transparency</p>
                        <p className="text-sm text-muted-foreground">Everything happens onchain</p>
                    </div>
                </div>
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-4 lg:px-8 bg-lavender/10">
                        <p className="font-medium text-foreground mb-1">Alignment</p>
                        <p className="text-sm text-muted-foreground">Success requires community approval</p>
                    </div>
                    <div className="px-6 py-4 lg:px-8 bg-lavender/10">
                        <p className="font-medium text-foreground mb-1">Sustainability</p>
                        <p className="text-sm text-muted-foreground">Progressive unlocks reduce rug risk</p>
                    </div>
                </div>

                {/* CTA - fills remaining space */}
                <div className="flex-1 flex flex-col lg:flex-row border-border border-t">
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-sage/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                For Builders
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-foreground lowercase mb-2">
                            lock tokens & create milestones
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Start building with accountability. Lock tokens and let your community validate your progress.
                        </p>
                        <div className="flex-1" />
                        <Link href="/verify">
                            <Button size="lg">
                                <Lock className="size-4 mr-2" />
                                Get Started
                            </Button>
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-lavender/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                For Communities
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-foreground lowercase mb-2">
                            participate in governance
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Vote on milestones and help shape the projects you believe in.
                        </p>
                        <div className="flex-1" />
                        <Link href="/governance">
                            <Button variant="outline" size="lg">
                                <Vote className="size-4 mr-2" />
                                View Proposals
                            </Button>
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 bg-cream/50">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Navigation
                            </span>
                        </div>
                        <div className="space-y-4">
                            <Link
                                href="/blog/verification-guide"
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="size-4" />
                                Prev: Verification Guide
                            </Link>
                            <Link
                                href="/blog/understanding-zktls"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                Next: Understanding zkTLS
                                <ArrowLeft className="size-4 rotate-180" />
                            </Link>
                        </div>
                        <div className="flex-1" />
                    </div>
                </div>
            </div>
        </article>
    );
}
