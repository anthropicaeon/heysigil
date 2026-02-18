import Image from "next/image";

import { PixelCard } from "@/components/ui/pixel-card";

export default function SigilInfrastructure() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="bg-lavender/30"
                >
                    <div className="flex flex-col lg:flex-row">
                    {/* Text */}
                    <div className="flex-1 border-border border-b lg:border-b-0 lg:border-r p-8 lg:p-12">
                        <Image
                            src="/logo-lavender.png"
                            alt="Sigil"
                            width={48}
                            height={48}
                            className="mb-6"
                        />
                        <h2 className="text-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                            the verification standard
                            <br />
                            for the agentic economy.
                        </h2>
                        <p className="text-muted-foreground mb-6 leading-relaxed">
                            five-channel verification. onchain attestation. milestone governance.
                            USDC fees route to verified builders. a percentage flows to $SIGIL
                            stakers, powering the protocol flywheel.
                        </p>
                        <p className="text-primary text-sm font-medium">
                            from launch to fee claim — one conversation with @HeySigil
                        </p>
                    </div>

                    {/* Video */}
                    <div className="flex-1 p-8 lg:p-12 flex items-center justify-center bg-background/30">
                        <div className="relative video w-full overflow-hidden bg-background border border-border">
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
                </PixelCard>
            </div>
        </section>
    );
}
