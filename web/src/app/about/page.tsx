import { ArrowRight, Github, Shield, Target, Twitter, Zap } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const values = [
    {
        icon: Shield,
        title: "Permissionless",
        description:
            "Anyone can verify. No gatekeepers, no approval processes. If you can prove your identity across channels, you get your Sigil.",
    },
    {
        icon: Target,
        title: "Resilient",
        description:
            "Five independent channels means no single point of failure. Platform APIs change, but your verification persists.",
    },
    {
        icon: Zap,
        title: "Accountable",
        description:
            "Milestone governance ensures builders ship. Capital flows to verification, tokens unlock to execution.",
    },
];

const timeline = [
    {
        phase: "Phase 1",
        title: "Foundation",
        status: "complete",
        items: ["Core contracts deployed", "EAS integration", "GitHub OAuth"],
    },
    {
        phase: "Phase 2",
        title: "Expansion",
        status: "active",
        items: ["zkTLS for X", "Fee routing", "Governance MVP"],
    },
    {
        phase: "Phase 3",
        title: "Scale",
        status: "upcoming",
        items: ["Multi-chain", "API access", "Enterprise features"],
    },
];

export default function AboutPage() {
    return (
        <section className="min-h-screen bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Hero */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-20">
                    <div className="max-w-3xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            about sigil
                        </p>
                        <h1 className="text-3xl lg:text-5xl font-semibold text-foreground mb-6 lowercase leading-tight">
                            verification infrastructure
                            <br />
                            for the agentic economy
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            We build the trust layer that enables capital to find real builders and
                            hold them accountable. No platform dependency. No gatekeepers.
                        </p>
                    </div>
                </div>

                {/* Mission */}
                <div className="bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <h2 className="text-xl font-semibold text-foreground lowercase">
                                our mission
                            </h2>
                        </div>
                        <div className="lg:w-2/3 px-6 py-8 lg:px-12 border-border border-b">
                            <div className="max-w-2xl space-y-4">
                                <p className="text-muted-foreground">
                                    The agentic economy is scaling. AI agents are coordinating
                                    capital, managing communities, and operating across platforms.
                                    But the infrastructure underneath still depends on
                                    single-platform APIs, offers no builder accountability, and
                                    can&apos;t separate real projects from noise.
                                </p>
                                <p className="text-muted-foreground">
                                    Sigil exists to fix this. We&apos;re building verification
                                    infrastructure that can prove builder legitimacy across multiple
                                    independent channels, route capital to verified builders, and
                                    enforce milestone-based accountability through community
                                    governance.
                                </p>
                                <p className="text-foreground font-medium">
                                    The result: a trust layer that scales with the agentic economy,
                                    not against it.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Values */}
                <div className="border-border border-b bg-sage/50">
                    <div className="px-6 py-6 lg:px-12 border-border border-b">
                        <h2 className="text-xl font-semibold text-foreground lowercase">
                            our values
                        </h2>
                    </div>
                    <div className="flex flex-col lg:flex-row">
                        {values.map((value) => (
                            <div
                                key={value.title}
                                className={cn(
                                    "flex-1 px-6 py-8 lg:px-8",
                                    "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                                )}
                            >
                                <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                    <value.icon className="size-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">
                                    {value.title}
                                </h3>
                                <p className="text-muted-foreground text-sm">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Roadmap */}
                <div className="bg-background">
                    <div className="px-6 py-6 lg:px-12 border-border border-b">
                        <h2 className="text-xl font-semibold text-foreground lowercase">roadmap</h2>
                    </div>
                    <div className="flex flex-col lg:flex-row">
                        {timeline.map((phase) => (
                            <div
                                key={phase.phase}
                                className={cn(
                                    "flex-1 px-6 py-6 lg:px-8",
                                    "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                                    phase.status === "active" && "bg-primary/5",
                                )}
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <span
                                        className={cn(
                                            "text-xs font-medium uppercase tracking-wider",
                                            phase.status === "complete" && "text-green-600",
                                            phase.status === "active" && "text-primary",
                                            phase.status === "upcoming" && "text-muted-foreground",
                                        )}
                                    >
                                        {phase.phase}
                                    </span>
                                    {phase.status === "active" && (
                                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                                            Current
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-3">
                                    {phase.title}
                                </h3>
                                <ul className="space-y-2">
                                    {phase.items.map((item) => (
                                        <li
                                            key={item}
                                            className="text-sm text-muted-foreground flex items-center gap-2"
                                        >
                                            <span
                                                className={cn(
                                                    "size-1.5 rounded-full",
                                                    phase.status === "complete" && "bg-green-500",
                                                    phase.status === "active" && "bg-primary",
                                                    phase.status === "upcoming" &&
                                                        "bg-muted-foreground",
                                                )}
                                            />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Team */}
                <div className="border-border border-t bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/3 px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <h2 className="text-xl font-semibold text-foreground lowercase mb-4">
                                the team
                            </h2>
                            <div className="flex gap-3">
                                <Link
                                    href="https://github.com/heysigil"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Github className="size-4" />
                                        GitHub
                                    </Button>
                                </Link>
                                <Link
                                    href="https://twitter.com/HeySigil"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Twitter className="size-4" />
                                        Twitter
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <div className="lg:w-2/3 px-6 py-8 lg:px-12 border-border border-b">
                            <p className="text-muted-foreground">
                                Sigil is built by a small team of engineers and designers who
                                believe that verification infrastructure should be open, resilient,
                                and accountable. We&apos;re based across timezones and work in
                                public. All our code is open source and our contracts are verified
                                on Basescan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-primary">
                    <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 px-6 py-10 lg:px-12 border-border border-b lg:border-b-0 lg:border-r border-primary-foreground/20">
                            <h2 className="text-2xl font-semibold text-primary-foreground mb-3 lowercase">
                                join the movement
                            </h2>
                            <p className="text-primary-foreground/80 mb-6">
                                Whether you&apos;re a builder looking to get verified or a community
                                looking to back real projects, Sigil is here for you.
                            </p>
                            <Link href="/verify">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="bg-background text-foreground hover:bg-background/90"
                                >
                                    Get Started
                                    <ArrowRight className="ml-2 size-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="flex-1 px-6 py-10 lg:px-12">
                            <h2 className="text-2xl font-semibold text-primary-foreground mb-3 lowercase">
                                have questions?
                            </h2>
                            <p className="text-primary-foreground/80 mb-6">
                                Chat with Sigil or reach out directly. We&apos;re always happy to
                                help.
                            </p>
                            <Link href="/contact">
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                                >
                                    Contact Us
                                    <ArrowRight className="ml-2 size-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
