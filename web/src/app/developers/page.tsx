import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    Code,
    Coins,
    MessageSquare,
    Rocket,
    Shield,
    Signal,
    Target,
    Users,
    Zap,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

const problems = [
    {
        icon: AlertTriangle,
        title: "fragility",
        description:
            "Builder verification tied to a single platform API. When that platform changes, trust breaks.",
        color: "text-red-500",
        bg: "bg-red-50",
    },
    {
        icon: Target,
        title: "misalignment",
        description:
            "Builders collect fees without milestones. Capital flows without accountability.",
        color: "text-orange-500",
        bg: "bg-orange-50",
    },
    {
        icon: Signal,
        title: "noise",
        description:
            "Real dev projects compete with low-effort entries. No way to separate signal.",
        color: "text-yellow-600",
        bg: "bg-yellow-50",
    },
];

const solutions = [
    {
        icon: Shield,
        title: "5-Channel Verification",
        description: "GitHub, X (zkTLS), Facebook, Instagram, Domain. No single point of failure.",
        badge: "resilient",
        color: "text-green-600",
    },
    {
        icon: Coins,
        title: "USDC Fee Routing",
        description:
            "Protocol fees route directly to verified builders. Capital follows verification.",
        badge: "automatic",
        color: "text-blue-600",
    },
    {
        icon: Users,
        title: "Milestone Governance",
        description:
            "Community validates milestones to unlock native tokens. Accountability is structural.",
        badge: "onchain",
        color: "text-purple-600",
    },
    {
        icon: Code,
        title: "EAS Attestations",
        description: "Onchain proof of builder legitimacy. Machine-readable. Permanent. Portable.",
        badge: "permanent",
        color: "text-primary",
    },
];

const steps = [
    {
        num: "01",
        title: "Connect your channels",
        desc: "Link GitHub, X, Facebook, Instagram, or your domain.",
        icon: Shield,
    },
    {
        num: "02",
        title: "Complete verification",
        desc: "OAuth or zkTLS depending on the channel.",
        icon: CheckCircle,
    },
    {
        num: "03",
        title: "Receive your sigil",
        desc: "EAS attestation created onchain on Base.",
        icon: Zap,
    },
    {
        num: "04",
        title: "Start earning",
        desc: "USDC fees route to your wallet automatically.",
        icon: Coins,
    },
];

export default function DevelopersPage() {
    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream flex flex-col">
                {/* Hero with PixelCard */}
                <PixelCard
                    variant="sage"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-sage/30"
                >
                    <div className="px-6 py-16 lg:px-12 lg:py-24">
                        <div className="max-w-3xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 mb-6">
                                <Rocket className="size-4 text-primary" />
                                <span className="text-sm font-medium text-primary uppercase tracking-wider">
                                    for builders
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-semibold text-foreground mb-6 lowercase leading-tight">
                                get verified. get funded.
                                <br />
                                keep shipping.
                            </h1>
                            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                                The sigil is proof you&apos;re real. The code is proof you shipped. No
                                community management. No content calendar. No platform risk.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/verify">
                                    <Button size="lg" className="w-full sm:w-auto gap-2">
                                        Stamp Your Sigil
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                                <Link href="/chat">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                                        <MessageSquare className="size-4" />
                                        Talk to Sigil
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </PixelCard>

                {/* Problem Section */}
                <div className="border-border border-b">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-rose/30">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-rose/50 border border-border flex items-center justify-center">
                                <AlertTriangle className="size-5 text-red-500" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    the problem
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    current infrastructure is broken.
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border bg-background">
                        {problems.map((problem) => (
                            <div
                                key={problem.title}
                                className="flex-1 px-6 py-8 lg:px-8"
                            >
                                <div className={cn("size-12 flex items-center justify-center mb-4 border border-border", problem.bg)}>
                                    <problem.icon className={cn("size-6", problem.color)} />
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
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-sage/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-sage/40 border border-border flex items-center justify-center">
                                <Zap className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    the sigil standard
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    infrastructure that scales.
                                </h2>
                            </div>
                        </div>
                    </div>
                    {/* Solutions Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {solutions.map((solution, index) => (
                            <div
                                key={solution.title}
                                className={cn(
                                    "px-6 py-8 lg:px-8 lg:py-10 border-border",
                                    index < 2 && "border-b",
                                    index % 2 === 0 && "lg:border-r",
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="size-12 bg-primary/10 flex items-center justify-center shrink-0 border border-border">
                                        <solution.icon className={cn("size-6", solution.color)} />
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
                <div className="border-border border-b">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-lavender/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-lavender/40 border border-border flex items-center justify-center">
                                <ArrowRight className="size-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    how it works
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    from zero to funded in 4 steps.
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border bg-background">
                        {steps.map((step) => (
                            <div
                                key={step.num}
                                className="flex-1 px-6 py-6 lg:px-8"
                            >
                                <div className="flex sm:flex-col items-start gap-4 sm:text-center sm:items-center">
                                    <div className="size-12 bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0 border border-primary">
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

                {/* CTA - fills remaining space */}
                <div className="flex-1 bg-primary flex flex-col">
                    <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-primary-foreground/20">
                        <div className="flex-1 px-6 py-10 lg:px-12 flex flex-col">
                            <div className="size-12 bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center mb-4">
                                <Shield className="size-6 text-primary-foreground" />
                            </div>
                            <h2 className="text-2xl font-semibold text-primary-foreground mb-3 lowercase">
                                ready to get verified?
                            </h2>
                            <p className="text-primary-foreground/80 mb-6 flex-1">
                                Join the builders already using Sigil to verify their identity and
                                route capital.
                            </p>
                            <Link href="/verify">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    className="bg-background text-foreground hover:bg-background/90 gap-2"
                                >
                                    Stamp Your Sigil
                                    <ArrowRight className="size-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="flex-1 px-6 py-10 lg:px-12 flex flex-col">
                            <div className="size-12 bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center mb-4">
                                <MessageSquare className="size-6 text-primary-foreground" />
                            </div>
                            <h2 className="text-2xl font-semibold text-primary-foreground mb-3 lowercase">
                                have questions?
                            </h2>
                            <p className="text-primary-foreground/80 mb-6 flex-1">
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
