import { Rocket, Shield } from "lucide-react";
import Link from "next/link";

import { LaunchesList } from "@/components/Launches/LaunchesList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";

export default function LaunchesPage() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-lavender/20"
                >
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-28 px-6 py-8 lg:px-0 lg:py-0 flex items-center justify-center border-border border-b lg:border-b-0 lg:border-r">
                            <div className="size-16 bg-lavender/60 border border-border flex items-center justify-center">
                                <Rocket className="size-8 text-primary" />
                            </div>
                        </div>

                        <div className="flex-1 px-6 py-8 lg:px-10 lg:py-10">
                            <div className="flex items-center gap-3 mb-2">
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    launch registry
                                </p>
                                <Badge variant="outline" className="text-xs">
                                    public
                                </Badge>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground lowercase mb-2">
                                sigil token launches
                            </h1>
                            <p className="text-muted-foreground">
                                Public list of tokens launched onchain through Sigil. Browse by
                                platform, search by project, and jump directly to explorer, market,
                                and governance views.
                            </p>
                        </div>

                        <div className="hidden lg:flex lg:w-48 items-center justify-center px-6 border-border border-l">
                            <Link href="/verify">
                                <Button variant="outline" className="gap-2">
                                    <Shield className="size-4" />
                                    Verify
                                </Button>
                            </Link>
                        </div>
                    </div>
                </PixelCard>

                <LaunchesList />
            </div>
        </section>
    );
}
