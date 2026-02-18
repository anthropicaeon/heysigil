"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
    { id: "general", label: "General" },
    { id: "verification", label: "Verification" },
    { id: "fees", label: "Fees & Tokens" },
    { id: "technical", label: "Technical" },
];

const faqs = [
    {
        category: "general",
        question: "What is Sigil?",
        answer: "Sigil is verification infrastructure for the agentic economy. It allows builders to verify their identity across multiple independent channels (GitHub, X, Facebook, Instagram, domain) and receive an onchain attestation via EAS on Base. This attestation enables fee routing and milestone governance.",
    },
    {
        category: "general",
        question: "Why does the agentic economy need Sigil?",
        answer: "AI agents are coordinating capital and operating across platforms, but existing infrastructure depends on single-platform APIs, offers no builder accountability, and can't separate real projects from noise. Sigil provides a resilient verification layer that scales with the agentic economy.",
    },
    {
        category: "verification",
        question: "How does verification work?",
        answer: "Verification happens across 5 independent channels. For most platforms (GitHub, Facebook, Instagram), we use OAuth. For X/Twitter, we use zkTLS - a cryptographic proof of account ownership that doesn't require API access. For domains, you can verify via DNS record or file upload.",
    },
    {
        category: "verification",
        question: "What is zkTLS?",
        answer: "zkTLS (zero-knowledge TLS) is a cryptographic technique that proves you own an account without giving us access to the platform's API. For X/Twitter verification, this means we can verify your account ownership without any bot automation or API calls - nothing that X can revoke.",
    },
    {
        category: "verification",
        question: "What is an EAS attestation?",
        answer: "EAS (Ethereum Attestation Service) is an onchain attestation protocol. Your Sigil is an EAS attestation on Base - it's a permanent, machine-readable, portable proof of your verified builder identity. Unlike badges on websites, this can't be faked or revoked.",
    },
    {
        category: "verification",
        question: "Do I need all 5 channels verified?",
        answer: "No, you can start with any single channel. However, more channels increase your trust score and may unlock additional features. The system is designed so that no single channel is required - resilience by design.",
    },
    {
        category: "fees",
        question: "How do fees get routed?",
        answer: "When a community backs a project, USDC fees from protocol activity route directly to the verified builder's wallet. This happens automatically once verification is complete. A small percentage of fees also goes to $SIGIL stakers, powering the protocol flywheel.",
    },
    {
        category: "fees",
        question: "What is milestone governance?",
        answer: "While USDC fees route immediately to builders, native tokens remain locked under community governance. The community votes to validate milestones - when milestones are approved, tokens unlock. This creates accountability: builders must ship to unlock their tokens.",
    },
    {
        category: "fees",
        question: "Is there a fee to verify?",
        answer: "Verification itself is free. You only pay Base network gas fees for the onchain attestation (typically a few cents). There are no platform fees for verification.",
    },
    {
        category: "fees",
        question: "How do I claim my fees?",
        answer: 'Visit the Dashboard page and you\'ll see any claimable fees. Click "Claim Now" to receive your USDC. Note that unclaimed fees expire after a set period and return to the protocol, so claim regularly.',
    },
    {
        category: "technical",
        question: "What blockchains are supported?",
        answer: "Sigil is currently deployed on Base. All attestations and fee routing happen on Base mainnet. Future expansion to other EVM chains is planned but not confirmed.",
    },
    {
        category: "technical",
        question: "Is the protocol open source?",
        answer: "Yes. All smart contracts are verified on Basescan and the frontend code is available on GitHub. We believe in transparency and building in public.",
    },
];

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState("general");
    const [openItems, setOpenItems] = useState<string[]>([]);

    const toggleItem = (question: string) => {
        setOpenItems((prev) =>
            prev.includes(question) ? prev.filter((q) => q !== question) : [...prev, question],
        );
    };

    const filteredFaqs = faqs.filter((faq) => faq.category === activeCategory);

    return (
        <section className="min-h-screen bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
                    <div className="max-w-3xl mx-auto text-center">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            FAQ
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                            frequently asked questions
                        </h1>
                        <p className="text-muted-foreground">
                            Everything you need to know about Sigil verification and fee routing.
                        </p>
                    </div>
                </div>

                {/* Category Tabs */}
                <div className="flex border-border border-b overflow-x-auto bg-background">
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex-1 px-6 py-4 lg:px-8 text-sm font-medium transition-colors whitespace-nowrap",
                                "border-border border-r last:border-r-0",
                                activeCategory === cat.id
                                    ? "bg-primary/5 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
                            )}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* FAQ Items */}
                <div className="bg-background">
                    {filteredFaqs.map((faq, index) => (
                        <div
                            key={`${faq.category}-${index}`}
                            className="border-border border-b last:border-b-0"
                        >
                            <button
                                type="button"
                                onClick={() => toggleItem(faq.question)}
                                className="w-full px-6 py-5 lg:px-12 flex items-center justify-between text-left hover:bg-secondary/20 transition-colors"
                            >
                                <span className="font-medium text-foreground pr-4">
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        "size-5 text-muted-foreground shrink-0 transition-transform",
                                        openItems.includes(faq.question) && "rotate-180",
                                    )}
                                />
                            </button>
                            {openItems.includes(faq.question) && (
                                <div className="px-6 pb-5 lg:px-12">
                                    <p className="text-muted-foreground leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Still Have Questions */}
                <div className="border-border border-t bg-sage/50">
                    <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 px-6 py-8 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <h3 className="font-semibold text-foreground mb-2">
                                Still have questions?
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Can't find the answer you're looking for? Chat with Sigil.
                            </p>
                            <Link href="/chat">
                                <Button variant="outline">Talk to Sigil</Button>
                            </Link>
                        </div>
                        <div className="flex-1 px-6 py-8 lg:px-12">
                            <h3 className="font-semibold text-foreground mb-2">
                                Ready to get started?
                            </h3>
                            <p className="text-muted-foreground text-sm mb-4">
                                Verification is free. You only pay gas fees.
                            </p>
                            <Link href="/verify">
                                <Button>Stamp Your Sigil</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
