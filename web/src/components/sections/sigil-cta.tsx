import { ArrowRight, MessageSquare, Shield } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";

export default function SigilCTA() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="relative container border-l border-r border-primary-foreground/20 px-0 bg-primary">
                {/* Section Header */}
                <div className="px-6 py-3 lg:px-12 border-b border-primary-foreground/20">
                    <span className="text-xs text-primary-foreground/70 uppercase tracking-wider">
                        Get Started
                    </span>
                </div>

                <div className="flex flex-col lg:flex-row">
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
        </section>
    );
}
