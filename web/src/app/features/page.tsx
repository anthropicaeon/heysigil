import { ArrowRight, Coins, FileCheck, Lock, MessageSquare, Shield, Users, Zap } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

const features = [
    {
        icon: Shield,
        title: "Multi-Channel Verification",
        description:
            "Verify your identity across 5 independent channels: GitHub (OAuth), X (zkTLS), Facebook (OAuth), Instagram (OAuth), and Domain (DNS/File). No single platform dependency.",
        highlight: "zkTLS for X - no API, no bot, no revocation",
        badge: "5 channels",
    },
    {
        icon: Coins,
        title: "USDC Fee Routing",
        description:
            "Protocol fees route directly to verified builders in USDC. No middlemen, no delays. Capital follows verification automatically.",
        highlight: "Instant settlement on Base",
        badge: "automatic",
    },
    {
        icon: Users,
        title: "Milestone Governance",
        description:
            "Communities validate builder milestones through onchain voting. Native tokens remain locked until milestones are approved. Structural accountability.",
        highlight: "Token unlocks tied to shipping",
        badge: "onchain",
    },
    {
        icon: FileCheck,
        title: "EAS Attestations",
        description:
            "Your Sigil is an Ethereum Attestation Service attestation on Base. Permanent, machine-readable, portable proof of verified builder identity.",
        highlight: "Onchain, not a badge on a website",
        badge: "permanent",
    },
    {
        icon: Lock,
        title: "LP Token Locking",
        description:
            "Liquidity provider tokens can be locked through the protocol. Ensures long-term alignment between builders and communities.",
        highlight: "Uniswap V4 integration",
        badge: "V4 hooks",
    },
    {
        icon: Zap,
        title: "Agentic Integration",
        description:
            "Built for AI agents and automated systems. Machine-readable attestations enable programmatic verification and capital routing.",
        highlight: "API-first design",
        badge: "machine-readable",
    },
];

const channels = [
    { name: "GitHub", method: "OAuth" },
    { name: "X / Twitter", method: "zkTLS" },
    { name: "Facebook", method: "OAuth" },
    { name: "Instagram", method: "OAuth" },
    { name: "Domain", method: "DNS / File" },
];

export default function FeaturesPage() {
    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 flex flex-col">
                {/* Hero */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b px-6 py-12 lg:px-12 lg:py-20 bg-lavender/30"
                >
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            features
                        </p>
                        <h1 className="text-3xl lg:text-5xl font-semibold text-foreground mb-4 lowercase">
                            verification infrastructure
                            <br />
                            for the agentic economy
                        </h1>
                        <p className="text-muted-foreground text-lg mb-8">
                            Five-channel verification. Onchain attestations. Milestone governance.
                            Everything builders need to get verified and funded.
                        </p>
                        <Link href="/verify">
                            <Button size="lg">
                                Start Verification
                                <ArrowRight className="ml-2 size-4" />
                            </Button>
                        </Link>
                    </div>
                </PixelCard>

                {/* Channels Row */}
                <div className="flex flex-col sm:flex-row border-border border-b bg-background">
                    {channels.map((channel) => (
                        <div
                            key={channel.name}
                            className={cn(
                                "flex-1 px-6 py-4 lg:px-8 text-center",
                                "border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0",
                            )}
                        >
                            <p className="text-foreground text-sm font-medium">{channel.name}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                                {channel.method}
                            </Badge>
                        </div>
                    ))}
                </div>

                {/* Features Grid - 2x3 with borders */}
                <div className="bg-background">
                    {/* Row 1 */}
                    <div className="flex flex-col lg:flex-row border-border border-b">
                        {features.slice(0, 3).map((feature) => (
                            <div
                                key={feature.title}
                                className={cn(
                                    "flex-1 px-6 py-8 lg:px-8 lg:py-10",
                                    "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="size-12 bg-lavender/20 flex items-center justify-center shrink-0 border border-border">
                                        <feature.icon className="size-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-base font-semibold text-foreground">
                                                {feature.title}
                                            </h3>
                                            <Badge variant="secondary" className="text-xs">
                                                {feature.badge}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm mb-3">
                                            {feature.description}
                                        </p>
                                        <p className="text-primary text-sm font-medium">
                                            {feature.highlight}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Row 2 */}
                    <div className="flex flex-col lg:flex-row border-border border-b">
                        {features.slice(3, 6).map((feature) => (
                            <div
                                key={feature.title}
                                className={cn(
                                    "flex-1 px-6 py-8 lg:px-8 lg:py-10",
                                    "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="size-12 bg-sage/20 flex items-center justify-center shrink-0 border border-border">
                                        <feature.icon className="size-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-base font-semibold text-foreground">
                                                {feature.title}
                                            </h3>
                                            <Badge variant="secondary" className="text-xs">
                                                {feature.badge}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm mb-3">
                                            {feature.description}
                                        </p>
                                        <p className="text-primary text-sm font-medium">
                                            {feature.highlight}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How It Works */}
                <div className="border-border border-b px-6 py-8 lg:px-12 lg:py-10 bg-sage/20">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-lg font-semibold text-foreground mb-4 lowercase text-center">
                            how verification works
                        </h2>
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-0">
                            {[
                                { step: "01", text: "Choose channel" },
                                { step: "02", text: "Complete verification" },
                                { step: "03", text: "Receive attestation" },
                                { step: "04", text: "Start earning" },
                            ].map((item, index) => (
                                <div
                                    key={item.step}
                                    className="flex-1 flex items-center gap-3 sm:flex-col sm:text-center"
                                >
                                    <div className="size-10 bg-cream/50 border border-border flex items-center justify-center font-bold text-sm shrink-0 text-foreground">
                                        {item.step}
                                    </div>
                                    <p className="text-sm text-foreground">{item.text}</p>
                                    {index < 3 && (
                                        <ArrowRight className="hidden sm:block size-4 text-muted-foreground mx-auto mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CTA - Matching Homepage */}
                <div className="flex-1 relative container border-primary-foreground/20 px-0 bg-primary flex flex-col">
                    {/* Section Header */}
                    <div className="px-6 py-3 lg:px-12 border-b border-primary-foreground/20">
                        <span className="text-xs text-primary-foreground/70 uppercase tracking-wider">
                            Get Started
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row">
                        {/* Claim Your Sigil */}
                        <PixelCard
                            variant="primary"
                            className="flex-1 border-border border-b lg:border-b-0 lg:border-r border-primary-foreground/20"
                            noFocus
                        >
                            <div className="flex flex-col h-full">
                                {/* Card Header */}
                                <div className="px-6 py-4 lg:px-8 border-b border-primary-foreground/20 flex items-center gap-3">
                                    <div className="size-10 bg-background/20 flex items-center justify-center">
                                        <Shield className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">
                                        Verification
                                    </span>
                                </div>

                                {/* Card Content */}
                                <div className="flex-1 px-6 py-10 lg:px-12 lg:py-12">
                                    <h2 className="text-primary-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                        claim your sigil.
                                    </h2>
                                    <p className="text-primary-foreground/80 mb-8 max-w-md">
                                        the verification standard for the agentic economy. five channels.
                                        onchain attestation. milestone governance.
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
                            </div>
                        </PixelCard>

                        {/* Talk to Sigil */}
                        <PixelCard
                            variant="primary"
                            className="flex-1"
                            noFocus
                        >
                            <div className="flex flex-col h-full">
                                {/* Card Header */}
                                <div className="px-6 py-4 lg:px-8 border-b border-primary-foreground/20 flex items-center gap-3">
                                    <div className="size-10 bg-background/20 flex items-center justify-center">
                                        <MessageSquare className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">
                                        AI Assistant
                                    </span>
                                </div>

                                {/* Card Content */}
                                <div className="flex-1 px-6 py-10 lg:px-12 lg:py-12">
                                    <h2 className="text-primary-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                        talk to sigil.
                                    </h2>
                                    <p className="text-primary-foreground/80 mb-8 max-w-md">
                                        have questions about verification, fee routing, or milestone governance?
                                        chat with our AI assistant.
                                    </p>
                                    <Link href="/chat">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 gap-2"
                                        >
                                            Start Chat
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </PixelCard>
                    </div>
                </div>
            </div>
        </section>
    );
}
