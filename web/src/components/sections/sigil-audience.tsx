import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function SigilAudience() {
    return (
        <section className="bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 text-center">
                    <p className="text-primary text-sm font-medium uppercase tracking-wider">
                        participants
                    </p>
                </div>

                {/* Split Cards */}
                <div className="flex flex-col md:flex-row">
                    {/* For Communities */}
                    <div className="flex-1 bg-sage border-border border-b md:border-b-0 md:border-r">
                        <div className="p-8 lg:p-10">
                            <span className="inline-block text-primary text-xs font-medium uppercase tracking-wider mb-4 bg-background/80 px-3 py-1 border border-border">
                                for communities
                            </span>
                            <h3 className="text-foreground text-xl lg:text-2xl font-semibold mb-4 lowercase">
                                back the builders shaping the agentic economy.
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                back builders with conviction. govern milestones with proof.
                            </p>
                            <ul className="text-muted-foreground text-sm space-y-2 mb-8">
                                <li>• back dev projects with capital — protocols, tools, infra</li>
                                <li>
                                    • 5-channel verification means you&apos;re backing verified
                                    builders
                                </li>
                                <li>• community governs milestone completion</li>
                            </ul>
                            <Link href="/chat">
                                <Button>Fund a Project</Button>
                            </Link>
                        </div>
                    </div>

                    {/* For Builders */}
                    <div className="flex-1 bg-lavender">
                        <div className="p-8 lg:p-10">
                            <span className="inline-block text-primary text-xs font-medium uppercase tracking-wider mb-4 bg-background/80 px-3 py-1 border border-border">
                                for builders
                            </span>
                            <h3 className="text-foreground text-xl lg:text-2xl font-semibold mb-4 lowercase">
                                get verified. get funded. keep shipping.
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                the sigil is proof you&apos;re real. the code is proof you shipped.
                            </p>
                            <ul className="text-muted-foreground text-sm space-y-2 mb-8">
                                <li>• verify across GitHub, X (zkTLS), FB, IG, or your domain</li>
                                <li>• USDC fees route to your wallet on verification</li>
                                <li>• native tokens unlock through community milestones</li>
                                <li>
                                    • no community management. no content calendar. no platform
                                    risk.
                                </li>
                            </ul>
                            <Link href="/verify">
                                <Button variant="outline">Stamp Your Sigil</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
