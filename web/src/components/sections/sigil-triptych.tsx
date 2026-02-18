import { cn } from "@/lib/utils";

const cards = [
    {
        label: "verify",
        title: "multi-channel trust",
        body: "builder identity verified across 5 independent channels. no single platform controls legitimacy. the attestation is onchain and portable.",
    },
    {
        label: "fund",
        title: "capital routed to builders",
        body: "communities back projects with conviction. USDC fees route directly to verified builders. capital follows verification, not promises.",
    },
    {
        label: "govern",
        title: "milestone accountability",
        body: "tokens stay locked. the community validates milestones to unlock them. accountability is structural — not optional.",
    },
];

export default function SigilTriptych() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                <div className="flex flex-col lg:flex-row">
                    {cards.map((card) => (
                        <div
                            key={card.label}
                            className={cn(
                                "flex-1 px-6 py-10 lg:px-8 lg:py-12",
                                "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                                "hover:bg-secondary/30 transition-colors",
                            )}
                        >
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-3">
                                {card.label}
                            </p>
                            <h3 className="text-foreground text-xl font-semibold mb-3 lowercase">
                                {card.title}
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {card.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
