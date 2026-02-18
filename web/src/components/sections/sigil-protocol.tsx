import { cn } from "@/lib/utils";

const steps = [
    {
        num: "01",
        title: "community backs a project",
        body: "a community identifies a dev project worth backing and commits capital onchain. the builder doesn't need to be involved. capital is the first signal of conviction.",
    },
    {
        num: "02",
        title: "builder proves legitimacy",
        body: "the builder verifies identity across five independent channels — GitHub, X (via zkTLS), Facebook, Instagram, and their domain. verification triggers an EAS attestation on Base.",
    },
    {
        num: "03",
        title: "stamp your sigil",
        body: "the sigil is an onchain attestation — portable proof of builder legitimacy. machine-readable. permanent. the verification standard for the agentic economy.",
    },
    {
        num: "04",
        title: "capital routes + milestones govern",
        body: "USDC fees from protocol activity route directly to the verified builder. native tokens remain locked under community-governed milestone validation. accountability is the default.",
    },
];

export default function SigilProtocol() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16">
                    <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
                        <div>
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                                protocol
                            </p>
                            <h2 className="text-foreground text-2xl lg:text-3xl font-semibold lowercase">
                                how the standard works.
                            </h2>
                        </div>
                        <p className="text-muted-foreground self-end">
                            four phases. permissionless. no single platform dependency at any point
                            in the chain.
                        </p>
                    </div>
                </div>

                {/* Steps Grid */}
                <div className="flex flex-col lg:flex-row">
                    {steps.map((step) => (
                        <div
                            key={step.num}
                            className={cn(
                                "flex-1 p-6 lg:p-8",
                                "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                            )}
                        >
                            <p className="text-primary text-2xl font-bold mb-3">{step.num}</p>
                            <h3 className="text-foreground text-base font-semibold mb-3 lowercase">
                                {step.title}
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {step.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
