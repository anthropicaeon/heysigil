import { Check } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

export default function PricingPage() {
    return (
        <section className="min-h-screen bg-lavender relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Hero */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
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
                </div>

                {/* Pricing Cards */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {tiers.map((tier) => (
                            <Card
                                key={tier.name}
                                className={`${
                                    tier.highlighted
                                        ? "border-primary ring-2 ring-primary ring-offset-2"
                                        : ""
                                }`}
                            >
                                <CardHeader>
                                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                                    <div className="mt-2">
                                        <span className="text-3xl font-bold text-foreground">
                                            {tier.price}
                                        </span>
                                        {tier.price !== "Custom" && (
                                            <span className="text-muted-foreground"> + gas</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        {tier.description}
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3 mb-6">
                                        {tier.features.map((feature) => (
                                            <li
                                                key={feature}
                                                className="flex items-center gap-2 text-sm"
                                            >
                                                <Check className="size-4 text-primary shrink-0" />
                                                <span className="text-muted-foreground">
                                                    {feature}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    <Link href={tier.href}>
                                        <Button
                                            className="w-full"
                                            variant={tier.highlighted ? "default" : "outline"}
                                        >
                                            {tier.cta}
                                        </Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div className="px-6 py-12 lg:px-12 lg:py-16 bg-sage">
                    <div className="max-w-3xl mx-auto">
                        <h2 className="text-2xl font-semibold text-foreground mb-8 text-center lowercase">
                            pricing questions
                        </h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-medium text-foreground mb-2">
                                    Why is verification free?
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    We believe verification infrastructure should be accessible to
                                    all builders. The protocol sustains itself through a small fee
                                    on capital flows, not by charging for verification.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground mb-2">
                                    What are the gas fees?
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    Gas fees on Base are typically a few cents. You&apos;ll pay gas
                                    when creating your EAS attestation and when claiming fees. We
                                    don&apos;t charge any additional fees on top of network costs.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-medium text-foreground mb-2">
                                    What does Enterprise include?
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    Enterprise plans are for platforms that want to integrate Sigil
                                    verification into their own products. This includes custom
                                    verification channels, API access, white-label options, and
                                    dedicated support. Contact us for pricing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
