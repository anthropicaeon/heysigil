import { MessageSquare, Play } from "lucide-react";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { PixelCard } from "@/components/ui/pixel-card";

const features = [
    "five-channel verification",
    "onchain attestation (EAS)",
    "milestone governance",
    "USDC fee routing",
];

export default function SigilInfrastructure() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Section Header */}
                <div className="px-6 py-4 lg:px-12 border-border border-b bg-lavender/20">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Infrastructure
                    </span>
                </div>

                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="bg-lavender/30"
                >
                    <div className="flex flex-col lg:flex-row">
                        {/* Text Section */}
                        <div className="lg:w-1/2 border-border border-b lg:border-b-0 lg:border-r">
                            {/* Logo Header */}
                            <div className="px-6 py-4 lg:px-12 border-border border-b flex items-center gap-3">
                                <Image
                                    src="/logo-lavender.png"
                                    alt="Sigil"
                                    width={40}
                                    height={40}
                                />
                                <div>
                                    <p className="text-foreground font-semibold">Sigil Protocol</p>
                                    <p className="text-xs text-muted-foreground">Verification Infrastructure</p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 lg:p-10">
                                <h2 className="text-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                    the verification standard
                                    <br />
                                    <span className="text-primary">for the agentic economy.</span>
                                </h2>
                                <p className="text-muted-foreground mb-6 leading-relaxed">
                                    A percentage of all fees flows to $SIGIL stakers, powering the protocol flywheel.
                                    From launch to fee claim — one conversation.
                                </p>

                                {/* Features Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-2 px-3 py-2 bg-background/50 border border-border">
                                            <div className="size-2 bg-primary rounded-full" />
                                            <span className="text-sm text-foreground">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 text-primary">
                                    <MessageSquare className="size-4" />
                                    <span className="text-sm font-medium">
                                        @HeySigil — your verification assistant
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Video Section - Enhanced */}
                        <div className="lg:w-1/2 flex flex-col">
                            {/* Video Header */}
                            <div className="px-6 py-4 lg:px-8 border-border border-b flex items-center justify-between bg-background/30">
                                <div className="flex items-center gap-2">
                                    <Play className="size-4 text-primary" />
                                    <span className="text-sm text-foreground font-medium">Demo</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    Live Preview
                                </Badge>
                            </div>

                            {/* Video Container */}
                            <div className="flex-1 p-6 lg:p-8 flex items-center justify-center bg-background/20">
                                <div className="relative w-full overflow-hidden bg-background border-2 border-border">
                                    <video
                                        className="w-full h-full object-cover"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                    >
                                        <source src="/demo/sigil-demo.mp4" type="video/mp4" />
                                        <p>Your browser does not support the video tag.</p>
                                    </video>
                                </div>
                            </div>
                        </div>
                    </div>
                </PixelCard>
            </div>
        </section>
    );
}
