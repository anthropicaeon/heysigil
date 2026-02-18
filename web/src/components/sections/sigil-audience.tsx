import { ArrowRight, CheckCircle, Code, Users } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";

const communityFeatures = [
    "back dev projects with capital — protocols, tools, infra",
    "5-channel verification means you're backing verified builders",
    "community governs milestone completion",
    "transparent fee routing via smart contracts",
];

const builderFeatures = [
    "verify across GitHub, X (zkTLS), FB, IG, or your domain",
    "USDC fees route to your wallet on verification",
    "native tokens unlock through community milestones",
    "no community management. no content calendar. no platform risk.",
];

export default function SigilAudience() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0 bg-cream">
                {/* Header */}
                <div className="border-border border-b px-6 py-4 lg:px-12 bg-cream/50">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Participants
                    </span>
                </div>

                {/* Split Cards */}
                <div className="flex flex-col md:flex-row">
                    {/* For Communities */}
                    <PixelCard
                        variant="sage"
                        className="flex-1 border-border border-b md:border-b-0 md:border-r bg-sage"
                        noFocus
                    >
                        <div className="flex flex-col h-full">
                            {/* Card Header */}
                            <div className="px-6 py-4 lg:px-8 border-border border-b flex items-center gap-3 bg-sage/50">
                                <div className="size-10 bg-background border border-border flex items-center justify-center">
                                    <Users className="size-5 text-green-600" />
                                </div>
                                <span className="text-primary text-xs font-medium uppercase tracking-wider">
                                    for communities
                                </span>
                            </div>

                            {/* Card Content */}
                            <div className="flex-1 p-6 lg:p-8">
                                <h3 className="text-foreground text-xl lg:text-2xl font-semibold mb-4 lowercase">
                                    back the builders shaping the agentic economy.
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    back builders with conviction. govern milestones with proof.
                                </p>

                                {/* Features List */}
                                <div className="space-y-3 mb-8">
                                    {communityFeatures.map((feature) => (
                                        <div key={feature} className="flex items-start gap-2">
                                            <CheckCircle className="size-4 text-green-600 mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link href="/chat">
                                    <Button className="gap-2">
                                        Fund a Project
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </PixelCard>

                    {/* For Builders */}
                    <PixelCard
                        variant="lavender"
                        className="flex-1 bg-lavender"
                        noFocus
                    >
                        <div className="flex flex-col h-full">
                            {/* Card Header */}
                            <div className="px-6 py-4 lg:px-8 border-border border-b flex items-center gap-3 bg-lavender/50">
                                <div className="size-10 bg-background border border-border flex items-center justify-center">
                                    <Code className="size-5 text-primary" />
                                </div>
                                <span className="text-primary text-xs font-medium uppercase tracking-wider">
                                    for builders
                                </span>
                            </div>

                            {/* Card Content */}
                            <div className="flex-1 p-6 lg:p-8">
                                <h3 className="text-foreground text-xl lg:text-2xl font-semibold mb-4 lowercase">
                                    get verified. get funded. keep shipping.
                                </h3>
                                <p className="text-muted-foreground mb-6">
                                    the sigil is proof you&apos;re real. the code is proof you shipped.
                                </p>

                                {/* Features List */}
                                <div className="space-y-3 mb-8">
                                    {builderFeatures.map((feature) => (
                                        <div key={feature} className="flex items-start gap-2">
                                            <CheckCircle className="size-4 text-primary mt-0.5 shrink-0" />
                                            <span className="text-muted-foreground text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link href="/verify">
                                    <Button variant="outline" className="gap-2">
                                        Stamp Your Sigil
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
