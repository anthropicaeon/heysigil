import { ArrowRight, CircleDollarSign, Shield, Vote } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const cards = [
    {
        icon: Shield,
        label: "verify",
        title: "multi-channel trust",
        body: "builder identity verified across 5 independent channels. no single platform controls legitimacy. the attestation is onchain and portable.",
        color: "text-green-600",
        bg: "bg-green-50",
        href: "/verify",
        cta: "Get Verified",
    },
    {
        icon: CircleDollarSign,
        label: "fund",
        title: "capital routed to builders",
        body: "communities back projects with conviction. USDC fees route directly to verified builders. capital follows verification, not promises.",
        color: "text-blue-600",
        bg: "bg-blue-50",
        href: "/chat",
        cta: "Fund a Project",
    },
    {
        icon: Vote,
        label: "govern",
        title: "milestone accountability",
        body: "tokens stay locked. the community validates milestones to unlock them. accountability is structural — not optional.",
        color: "text-amber-600",
        bg: "bg-amber-50",
        href: "/governance",
        cta: "View Governance",
    },
];

export default function SigilTriptych() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Section Header */}
                <div className="px-6 py-4 lg:px-12 border-border border-b bg-cream/30">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Core Primitives
                    </span>
                </div>

                {/* Cards Grid */}
                <div className="flex flex-col lg:flex-row">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className={cn(
                                "flex-1 flex flex-col",
                                "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                            )}
                        >
                            {/* Card Header */}
                            <div className="px-6 py-4 lg:px-8 border-border border-b bg-secondary/20 flex items-center gap-3">
                                <div className={cn("size-10 flex items-center justify-center border border-border", card.bg)}>
                                    <card.icon className={cn("size-5", card.color)} />
                                </div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    {card.label}
                                </p>
                            </div>

                            {/* Card Body */}
                            <div className="flex-1 px-6 py-8 lg:px-8 lg:py-10">
                                <h3 className="text-foreground text-xl font-semibold mb-3 lowercase">
                                    {card.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                                    {card.body}
                                </p>
                                <Link href={card.href}>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        {card.cta}
                                        <ArrowRight className="size-3.5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
