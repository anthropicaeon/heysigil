import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SigilCTA() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="relative container border-l border-r border-primary-foreground/20 px-0 bg-primary">
                <div className="flex flex-col lg:flex-row">
                    <div className="flex-1 px-6 py-12 lg:px-12 lg:py-16 border-border border-b lg:border-b-0 lg:border-r border-primary-foreground/20">
                        <h2 className="text-primary-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                            claim your sigil.
                        </h2>
                        <p className="text-primary-foreground/80 mb-6">
                            the verification standard for the agentic economy. five channels.
                            onchain attestation. milestone governance.
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
                    <div className="flex-1 px-6 py-12 lg:px-12 lg:py-16">
                        <h2 className="text-primary-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                            talk to sigil.
                        </h2>
                        <p className="text-primary-foreground/80 mb-6">
                            have questions about verification, fee routing, or milestone governance?
                            chat with our AI assistant.
                        </p>
                        <Link href="/chat">
                            <Button
                                size="lg"
                                variant="outline"
                                className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                            >
                                Start Chat
                                <ArrowRight className="ml-2 size-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
