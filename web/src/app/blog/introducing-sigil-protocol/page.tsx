import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function IntroducingSigilPage() {
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
                                Announcement
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                                introducing sigil - the verification layer for the agentic economy
                            </h1>
                            <p className="text-muted-foreground">
                                Today we&apos;re launching Sigil, the verification infrastructure that
                                connects builders to sustainable funding through multi-channel identity
                                verification and milestone-based governance.
                            </p>
                        </div>
                        <div className="lg:w-1/3 flex flex-col">
                            <div className="flex-1 px-6 py-6 lg:px-8 border-border border-b flex items-center gap-3">
                                <User className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Sigil Team</span>
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 border-border border-b flex items-center gap-3">
                                <Calendar className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">Feb 15, 2026</span>
                            </div>
                            <div className="flex-1 px-6 py-6 lg:px-8 flex items-center gap-3">
                                <Clock className="size-4 text-muted-foreground" />
                                <span className="text-sm text-foreground">5-7 min read</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="border-border border-b aspect-video relative bg-sage/20">
                    <Image
                        src="https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=1200&q=80"
                        alt="Introducing Sigil"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Section: Why Sigil */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-4 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-sage/20">
                            <h2 className="text-lg font-semibold text-foreground lowercase">
                                why sigil?
                            </h2>
                        </div>
                        <div className="lg:w-2/3 px-6 py-6 lg:px-12 border-border border-b">
                            <p className="text-muted-foreground mb-4">
                                The crypto ecosystem has a trust problem. Legitimate builders
                                struggle to differentiate themselves from bad actors, while
                                communities have no reliable way to verify who they&apos;re funding.
                            </p>
                            <p className="text-foreground font-medium mb-3">The current state:</p>
                        </div>
                    </div>
                </div>

                {/* Problem List */}
                <div className="border-border border-b divide-y divide-border bg-rose/20">
                    {[
                        "Project founders are anonymous by default",
                        "Funding flows to marketing, not building",
                        "Token launches lack accountability mechanisms",
                        "Communities have no recourse when projects fail",
                    ].map((item) => (
                        <div key={item} className="px-6 py-3 lg:px-12 flex items-center gap-3">
                            <div className="size-2 bg-destructive/60" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                    ))}
                </div>

                {/* Section: The Solution */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            the solution: verification infrastructure
                        </h2>
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-background">
                        <p className="text-muted-foreground">
                            Sigil creates a trust layer that connects verified identity to
                            onchain activity:
                        </p>
                    </div>
                </div>

                {/* Solution Grid */}
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-6 lg:px-8 bg-background">
                        <h3 className="font-medium text-foreground mb-2">Multi-Channel Verification</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Builders verify across 5 independent channels:
                        </p>
                        <div className="space-y-2 text-sm">
                            {[
                                { name: "GitHub", desc: "Code contributions" },
                                { name: "X (Twitter)", desc: "Social via zkTLS" },
                                { name: "Facebook", desc: "Real identity" },
                                { name: "Instagram", desc: "Creative work" },
                                { name: "Domain", desc: "Website control" },
                            ].map((channel) => (
                                <div key={channel.name} className="flex items-center gap-2 text-muted-foreground">
                                    <div className="size-2 bg-primary" />
                                    <strong className="text-foreground">{channel.name}</strong> - {channel.desc}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="px-6 py-6 lg:px-8 bg-background">
                        <h3 className="font-medium text-foreground mb-2">Onchain Attestations</h3>
                        <p className="text-sm text-muted-foreground">
                            Every verification creates a permanent, queryable attestation via EAS on Base.
                            Anyone can verify a builder&apos;s credentials without trusting us.
                        </p>
                    </div>
                </div>
                <div className="border-border border-b grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                    <div className="px-6 py-6 lg:px-8 bg-background">
                        <h3 className="font-medium text-foreground mb-2">USDC Fee Routing</h3>
                        <p className="text-sm text-muted-foreground">
                            A portion of protocol fees routes directly to verified builders.
                            No grants, no applications—just build and earn.
                        </p>
                    </div>
                    <div className="px-6 py-6 lg:px-8 bg-background">
                        <h3 className="font-medium text-foreground mb-2">Milestone Governance</h3>
                        <p className="text-sm text-muted-foreground">
                            Community token holders vote on milestone completion.
                            Funds unlock progressively as builders deliver.
                        </p>
                    </div>
                </div>

                {/* Section: How It Works */}
                <div className="bg-lavender/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            how it works
                        </h2>
                    </div>
                </div>
                <div className="border-border border-b divide-y divide-border bg-background">
                    {[
                        { num: "1", title: "Connect", desc: "Your wallet" },
                        { num: "2", title: "Verify", desc: "Across multiple channels (free, pay only gas)" },
                        { num: "3", title: "Receive", desc: "Your onchain attestation" },
                        { num: "4", title: "Earn", desc: "USDC fees as you build" },
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

                {/* Section: Why Base */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-4 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-lavender/20">
                            <h2 className="text-lg font-semibold text-foreground lowercase">
                                why base?
                            </h2>
                        </div>
                        <div className="lg:w-2/3 px-6 py-6 lg:px-12 border-border border-b">
                            <p className="text-muted-foreground">
                                We built on Base for several reasons:
                            </p>
                        </div>
                    </div>
                </div>
                <div className="border-border border-b grid sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
                    {[
                        "Low gas costs make verification accessible",
                        "EAS integration for standardized attestations",
                        "Strong builder community",
                        "Enterprise-grade infrastructure",
                    ].map((reason) => (
                        <div key={reason} className="px-6 py-4 lg:px-6 bg-lavender/10">
                            <p className="text-sm text-foreground">{reason}</p>
                        </div>
                    ))}
                </div>

                {/* Section: What's Next */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            what&apos;s next
                        </h2>
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-background">
                        <p className="text-muted-foreground">
                            Over the coming weeks we&apos;ll be:
                        </p>
                    </div>
                </div>
                <div className="border-border border-b divide-y divide-border bg-sage/10">
                    {[
                        "Onboarding launch partners",
                        "Opening governance for early participants",
                        "Publishing our audit report",
                        "Expanding verification channels",
                    ].map((item) => (
                        <div key={item} className="px-6 py-3 lg:px-12 flex items-center gap-3">
                            <div className="size-2 bg-primary" />
                            <span className="text-sm text-muted-foreground">{item}</span>
                        </div>
                    ))}
                </div>

                {/* Section: Join Us - fills remaining space */}
                <div className="flex-1 flex flex-col lg:flex-row border-border border-t">
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-cream/50">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Get Started
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-foreground lowercase mb-2">
                            join us
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Whether you&apos;re a builder looking for sustainable funding or a
                            community seeking accountability, Sigil is built for you.
                        </p>
                        <div className="flex-1" />
                        <Link href="/verify">
                            <Button size="lg">
                                Start Verification
                                <ArrowLeft className="size-4 ml-2 rotate-180" />
                            </Button>
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 bg-sage/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Navigation
                            </span>
                        </div>
                        <div className="space-y-4">
                            <Link
                                href="/blog"
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="size-4" />
                                All Posts
                            </Link>
                            <Link
                                href="/blog/verification-guide"
                                className="flex items-center gap-2 text-sm text-primary hover:underline"
                            >
                                Next: Verification Guide
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
