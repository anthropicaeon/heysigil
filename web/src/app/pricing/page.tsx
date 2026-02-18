import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";

const tiers = [
    {
        name: "Builder",
        price: "Free",
        description: "Everything you need to get verified and start earning.",
        features: [
            "5-channel verification",
            "EAS attestation on Base",
            "USDC fee routing",
            "Dashboard access",
            "Governance participation",
        ],
        cta: "Stamp Your Sigil",
        href: "/verify",
        highlighted: true,
    },
    {
        name: "Project",
        price: "Free",
        description: "Launch your token with built-in accountability.",
        features: [
            "Everything in Builder",
            "Token deployment",
            "LP position locking",
            "Milestone validation",
            "Community governance tools",
        ],
        cta: "Launch Project",
        href: "/chat",
        highlighted: false,
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "For platforms and protocols with custom needs.",
        features: [
            "Everything in Project",
            "Custom verification channels",
            "White-label integration",
            "API access",
            "Priority support",
        ],
        cta: "Contact Us",
        href: "/contact",
        highlighted: false,
    },
];

const faqs = [
    {
        question: "Why is verification free?",
        answer: "We believe verification infrastructure should be accessible to all builders. The protocol sustains itself through a small fee on capital flows, not by charging for verification.",
    },
    {
        question: "What are the gas fees?",
        answer: "Gas fees on Base are typically a few cents. You'll pay gas when creating your EAS attestation and when claiming fees. We don't charge any additional fees on top of network costs.",
    },
    {
        question: "What does Enterprise include?",
        answer: "Enterprise plans are for platforms that want to integrate Sigil verification into their own products. This includes custom verification channels, API access, white-label options, and dedicated support. Contact us for pricing.",
    },
];

export default function PricingPage() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                {/* Hero */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-lavender/30"
                >
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            pricing
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                            simple, transparent pricing
                        </h1>
                        <p className="text-muted-foreground">
                            Verification is free for everyone. You only pay network gas fees.
                        </p>
                    </div>
                </PixelCard>

                {/* Pricing Section Header */}
                <div className="bg-sage/20">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            choose your tier
                        </h2>
                    </div>
                </div>

                {/* Pricing Cards - Border Grid */}
                <div className="border-border border-b flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border bg-background">
                    {tiers.map((tier) => (
                        <div
                            key={tier.name}
                            className={`flex-1 flex flex-col px-6 py-8 lg:px-8 ${
                                tier.highlighted ? "bg-primary/5" : ""
                            }`}
                        >
                            {/* Tier Header */}
                            <div className="mb-6">
                                <h3 className="text-xl font-semibold text-foreground mb-2">
                                    {tier.name}
                                </h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-foreground">
                                        {tier.price}
                                    </span>
                                    {tier.price !== "Custom" && (
                                        <span className="text-muted-foreground text-sm">+ gas</span>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    {tier.description}
                                </p>
                            </div>

                            {/* Features */}
                            <div className="divide-y divide-border border border-border mb-6">
                                {tier.features.map((feature) => (
                                    <div
                                        key={feature}
                                        className="flex items-center gap-2 px-3 py-2.5 text-sm"
                                    >
                                        <Check className="size-4 text-primary shrink-0" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA */}
                            <div className="flex-1" />
                            <Link href={tier.href}>
                                <Button
                                    className="w-full"
                                    variant={tier.highlighted ? "default" : "outline"}
                                >
                                    {tier.cta}
                                    <ArrowRight className="size-4 ml-2" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>

                {/* FAQ Section Header */}
                <div className="bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            pricing questions
                        </h2>
                    </div>
                </div>

                {/* FAQ Items */}
                <div className="border-border border-b divide-y divide-border bg-background">
                    {faqs.map((faq) => (
                        <div key={faq.question} className="px-6 py-5 lg:px-12">
                            <h3 className="font-medium text-foreground mb-2">{faq.question}</h3>
                            <p className="text-muted-foreground text-sm">{faq.answer}</p>
                        </div>
                    ))}
                </div>

                {/* CTA - fills remaining space */}
                <div className="flex-1 flex flex-col lg:flex-row border-border border-t">
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r bg-lavender/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Get Started
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-foreground lowercase mb-2">
                            ready to verify?
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Start verifying your identity across all 5 channels. It&apos;s free—you only pay gas.
                        </p>
                        <div className="flex-1" />
                        <Link href="/verify">
                            <Button size="lg">
                                Stamp Your Sigil
                                <ArrowRight className="size-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col px-6 py-8 lg:px-12 bg-sage/20">
                        <div className="px-0 py-2 mb-4 border-border border-b">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Enterprise
                            </span>
                        </div>
                        <h2 className="text-lg font-semibold text-foreground lowercase mb-2">
                            need custom solutions?
                        </h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Contact us for white-label integration, custom channels, and dedicated support.
                        </p>
                        <div className="flex-1" />
                        <Link href="/contact">
                            <Button variant="outline" size="lg">
                                Contact Us
                                <ArrowRight className="size-4 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
