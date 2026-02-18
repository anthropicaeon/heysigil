import {
    AlertTriangle,
    ArrowRight,
    Code,
    Coins,
    Shield,
    Signal,
    Target,
    Users,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const problems = [
    {
        icon: AlertTriangle,
        title: "fragility",
        description:
            "Builder verification tied to a single platform API. When that platform changes, trust breaks.",
    },
    {
        icon: Target,
        title: "misalignment",
        description:
            "Builders collect fees without milestones. Capital flows without accountability.",
    },
    {
        icon: Signal,
        title: "noise",
        description:
            "Real dev projects compete with low-effort entries. No way to separate signal.",
    },
];

const solutions = [
    {
        icon: Shield,
        title: "5-Channel Verification",
        description: "GitHub, X (zkTLS), Facebook, Instagram, Domain. No single point of failure.",
        badge: "resilient",
    },
    {
        icon: Coins,
        title: "USDC Fee Routing",
        description:
            "Protocol fees route directly to verified builders. Capital follows verification.",
        badge: "automatic",
    },
    {
        icon: Users,
        title: "Milestone Governance",
        description:
            "Community validates milestones to unlock native tokens. Accountability is structural.",
        badge: "onchain",
    },
    {
        icon: Code,
        title: "EAS Attestations",
        description: "Onchain proof of builder legitimacy. Machine-readable. Permanent. Portable.",
        badge: "permanent",
    },
];

const steps = [
    {
        num: "01",
        title: "Connect your channels",
        desc: "Link GitHub, X, Facebook, Instagram, or your domain.",
    },
    { num: "02", title: "Complete verification", desc: "OAuth or zkTLS depending on the channel." },
    { num: "03", title: "Receive your sigil", desc: "EAS attestation created onchain on Base." },
    { num: "04", title: "Start earning", desc: "USDC fees route to your wallet automatically." },
];

export default function DevelopersPage() {
    return (
        <section className="min-h-screen bg-sage relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Hero */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-20">
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            for builders
                        </p>
                        <h1 className="text-4xl lg:text-5xl font-semibold text-foreground mb-6 lowercase leading-tight">
                            get verified. get funded.
                            <br />
                            keep shipping.
                        </h1>
                        <p className="text-lg text-muted-foreground mb-8">
                            The sigil is proof you&apos;re real. The code is proof you shipped. No
                            community management. No content calendar. No platform risk.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link href="/verify">
                                <Button size="lg" className="w-full sm:w-auto">
                                    Stamp Your Sigil
                                    <ArrowRight className="ml-2 size-4" />
                                </Button>
                            </Link>
                            <Link href="/chat">
                                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                                    Talk to Sigil
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Problem Section */}
                <div className="border-border border-b bg-rose">
                    <div className="px-6 py-6 lg:px-12 border-border border-b">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-2">
                            the problem
                        </p>
                        <h2 className="text-xl font-semibold text-foreground lowercase">
                            current infrastructure is broken.
                        </h2>
                    </div>
                    <div className="flex flex-col lg:flex-row bg-background">
                        {problems.map((problem) => (
                            <div
                                key={problem.title}
                                className={cn(
                                    "flex-1 px-6 py-8 lg:px-8",
                                    "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                                )}
                            >
                                <div className="size-12 bg-primary/10 flex items-center justify-center mb-4 border border-border">
                                    <problem.icon className="size-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2 lowercase">
                                    {problem.title}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {problem.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Solution Section */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-6 lg:px-12 border-border border-b">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-2">
                            the sigil standard
                        </p>
                        <h2 className="text-xl font-semibold text-foreground lowercase">
                            infrastructure that scales.
                        </h2>
                    </div>
                    {/* Row 1 */}
                    <div className="flex flex-col lg:flex-row border-border border-b">
                        {solutions.slice(0, 2).map((solution) => (
                            <div
                                key={solution.title}
                                className={cn(
                                    "flex-1 px-6 py-8 lg:px-8 lg:py-10",
                                    "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="size-12 bg-primary/10 flex items-center justify-center shrink-0 border border-border">
                                        <solution.icon className="size-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-base font-semibold text-foreground">
                                                {solution.title}
                                            </h3>
                                            <Badge variant="secondary" className="text-xs">
                                                {solution.badge}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm">
                                            {solution.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Row 2 */}
                    <div className="flex flex-col lg:flex-row">
                        {solutions.slice(2, 4).map((solution) => (
                            <div
                                key={solution.title}
                                className={cn(
                                    "flex-1 px-6 py-8 lg:px-8 lg:py-10",
                                    "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="size-12 bg-primary/10 flex items-center justify-center shrink-0 border border-border">
                                        <solution.icon className="size-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-base font-semibold text-foreground">
                                                {solution.title}
                                            </h3>
                                            <Badge variant="secondary" className="text-xs">
                                                {solution.badge}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm">
                                            {solution.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How it Works */}
                <div className="border-border border-b bg-lavender">
                    <div className="px-6 py-6 lg:px-12 border-border border-b">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-2">
                            how it works
                        </p>
                        <h2 className="text-xl font-semibold text-foreground lowercase">
                            from zero to funded in 4 steps.
                        </h2>
                    </div>
                    <div className="flex flex-col sm:flex-row bg-background">
                        {steps.map((step) => (
                            <div
                                key={step.num}
                                className={cn(
                                    "flex-1 px-6 py-6 lg:px-8",
                                    "border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0",
                                )}
                            >
                                <div className="flex sm:flex-col items-start gap-4 sm:text-center sm:items-center">
                                    <div className="size-10 bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 border border-primary">
                                        {step.num}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">
                                            {step.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">{step.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-primary">
                    <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 px-6 py-10 lg:px-12 border-border border-b lg:border-b-0 lg:border-r border-primary-foreground/20">
                            <h2 className="text-2xl font-semibold text-primary-foreground mb-3 lowercase">
                                ready to get verified?
                            </h2>
                            <p className="text-primary-foreground/80 mb-6">
                                Join the builders already using Sigil to verify their identity and
                                route capital.
                            </p>
                            <Link href="/verify">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="bg-background text-foreground hover:bg-background/90"
                                >
                                    Stamp Your Sigil
                                    <ArrowRight className="ml-2 size-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="flex-1 px-6 py-10 lg:px-12">
                            <h2 className="text-2xl font-semibold text-primary-foreground mb-3 lowercase">
                                have questions?
                            </h2>
                            <p className="text-primary-foreground/80 mb-6">
                                Chat with Sigil or browse the FAQ to learn more.
                            </p>
                            <div className="flex gap-3">
                                <Link href="/chat">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                                    >
                                        Talk to Sigil
                                    </Button>
                                </Link>
                                <Link href="/faq">
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                                    >
                                        View FAQ
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
