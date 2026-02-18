import { PixelCard } from "@/components/ui/pixel-card";

export default function BlogHero() {
    return (
        <section className="bg-background overflow-hidden px-2.5 lg:px-0">
            <div className="container p-0">
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border flex flex-col gap-8 overflow-hidden border-r border-b border-l px-6 py-12 md:px-16 md:py-20 md:pt-32 bg-lavender/30"
                >
                    <div className="max-w-xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            blog
                        </p>
                        <h1 className="text-foreground mb-2.5 text-3xl tracking-tight md:text-5xl lowercase">
                            protocol updates
                        </h1>
                        <p className="text-muted-foreground text-base">
                            Builder guides, protocol announcements, governance proposals, and
                            insights on building the verification layer for the agentic economy.
                        </p>
                    </div>
                </PixelCard>
            </div>
        </section>
    );
}
