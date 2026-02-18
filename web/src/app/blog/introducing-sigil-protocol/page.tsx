import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function IntroducingSigilPage() {
    return (
        <article className="min-h-screen bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
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
                        Announcement
                    </p>
                    <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                        introducing sigil - the verification layer for the agentic economy
                    </h1>
                    <p className="text-muted-foreground max-w-3xl mb-6">
                        Today we&apos;re launching Sigil, the verification infrastructure that
                        connects builders to sustainable funding through multi-channel identity
                        verification and milestone-based governance.
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <User className="size-4" />
                            Sigil Team
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Calendar className="size-4" />
                            Feb 15, 2026
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="size-4" />
                            5-7 min read
                        </span>
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

                {/* Content */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-12 lg:px-12 lg:py-16 max-w-3xl">
                        {/* Section: Why Sigil */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                why sigil?
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                The crypto ecosystem has a trust problem. Legitimate builders
                                struggle to differentiate themselves from bad actors, while
                                communities have no reliable way to verify who they&apos;re funding.
                            </p>
                            <p className="text-foreground font-medium mb-3">The current state:</p>
                            <div className="border border-border divide-y divide-border bg-sage/10">
                                <div className="px-4 py-3 text-muted-foreground">
                                    Project founders are anonymous by default
                                </div>
                                <div className="px-4 py-3 text-muted-foreground">
                                    Funding flows to marketing, not building
                                </div>
                                <div className="px-4 py-3 text-muted-foreground">
                                    Token launches lack accountability mechanisms
                                </div>
                                <div className="px-4 py-3 text-muted-foreground">
                                    Communities have no recourse when projects fail
                                </div>
                            </div>
                        </section>

                        {/* Section: The Solution */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                the solution: verification infrastructure
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Sigil creates a trust layer that connects verified identity to
                                onchain activity:
                            </p>

                            <div className="grid gap-4">
                                <div className="border border-border p-4 bg-background">
                                    <h3 className="font-medium text-foreground mb-2">
                                        Multi-Channel Verification
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Builders verify across 5 independent channels:
                                    </p>
                                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="size-2 bg-primary" />
                                            <span>
                                                <strong>GitHub</strong> - Code contributions
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="size-2 bg-primary" />
                                            <span>
                                                <strong>X (Twitter)</strong> - Social via zkTLS
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="size-2 bg-primary" />
                                            <span>
                                                <strong>Facebook</strong> - Real identity
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="size-2 bg-primary" />
                                            <span>
                                                <strong>Instagram</strong> - Creative work
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <div className="size-2 bg-primary" />
                                            <span>
                                                <strong>Domain</strong> - Website control
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-border p-4 bg-background">
                                    <h3 className="font-medium text-foreground mb-2">
                                        Onchain Attestations
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Every verification creates a permanent, queryable
                                        attestation via EAS on Base. Anyone can verify a
                                        builder&apos;s credentials without trusting us.
                                    </p>
                                </div>

                                <div className="border border-border p-4 bg-background">
                                    <h3 className="font-medium text-foreground mb-2">
                                        USDC Fee Routing
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        A portion of protocol fees routes directly to verified
                                        builders. No grants, no applications—just build and earn.
                                    </p>
                                </div>

                                <div className="border border-border p-4 bg-background">
                                    <h3 className="font-medium text-foreground mb-2">
                                        Milestone Governance
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Community token holders vote on milestone completion. Funds
                                        unlock progressively as builders deliver.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section: How It Works */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                how it works
                            </h2>
                            <div className="border border-border divide-y divide-border">
                                <div className="flex items-center gap-4 px-4 py-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Connect</p>
                                        <p className="text-sm text-muted-foreground">Your wallet</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 px-4 py-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Verify</p>
                                        <p className="text-sm text-muted-foreground">
                                            Across multiple channels (free, pay only gas)
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 px-4 py-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Receive</p>
                                        <p className="text-sm text-muted-foreground">
                                            Your onchain attestation
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 px-4 py-4">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                        4
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Earn</p>
                                        <p className="text-sm text-muted-foreground">
                                            USDC fees as you build
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section: Why Base */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                why base?
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                We built on Base for several reasons:
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div className="border border-border px-4 py-3 bg-lavender/20">
                                    <p className="text-sm text-foreground">
                                        Low gas costs make verification accessible
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 bg-lavender/20">
                                    <p className="text-sm text-foreground">
                                        EAS integration for standardized attestations
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 bg-lavender/20">
                                    <p className="text-sm text-foreground">
                                        Strong builder community
                                    </p>
                                </div>
                                <div className="border border-border px-4 py-3 bg-lavender/20">
                                    <p className="text-sm text-foreground">
                                        Enterprise-grade infrastructure
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section: What's Next */}
                        <section className="mb-12">
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                what&apos;s next
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                Over the coming weeks we&apos;ll be:
                            </p>
                            <div className="border border-border divide-y divide-border bg-sage/10">
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <div className="size-2 bg-primary" />
                                    <span className="text-muted-foreground">
                                        Onboarding launch partners
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <div className="size-2 bg-primary" />
                                    <span className="text-muted-foreground">
                                        Opening governance for early participants
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <div className="size-2 bg-primary" />
                                    <span className="text-muted-foreground">
                                        Publishing our audit report
                                    </span>
                                </div>
                                <div className="px-4 py-3 flex items-center gap-3">
                                    <div className="size-2 bg-primary" />
                                    <span className="text-muted-foreground">
                                        Expanding verification channels
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* Section: Join Us */}
                        <section>
                            <h2 className="text-2xl font-semibold text-foreground mb-4 lowercase">
                                join us
                            </h2>
                            <p className="text-muted-foreground mb-6">
                                Whether you&apos;re a builder looking for sustainable funding or a
                                community seeking accountability, Sigil is built for you.
                            </p>
                            <Link
                                href="/verify"
                                className="inline-flex items-center gap-2 border border-primary bg-primary px-6 py-3 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                            >
                                Start Verification
                                <ArrowLeft className="size-4 rotate-180" />
                            </Link>
                        </section>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="px-6 py-6 lg:px-12 bg-sage/30 flex items-center justify-between">
                    <Link
                        href="/blog"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="size-4" />
                        All Posts
                    </Link>
                    <Link
                        href="/blog/verification-guide"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        Next: Verification Guide
                        <ArrowLeft className="size-4 rotate-180" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
