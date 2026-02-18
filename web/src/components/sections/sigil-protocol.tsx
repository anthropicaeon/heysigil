import { ArrowRight, CheckCircle, Coins, FileCheck, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const steps = [
    {
        num: "01",
        icon: Users,
        title: "community backs a project",
        body: "a community identifies a dev project worth backing and commits capital onchain. the builder doesn't need to be involved. capital is the first signal of conviction.",
        color: "text-blue-600",
        bg: "bg-blue-50",
    },
    {
        num: "02",
        icon: FileCheck,
        title: "builder proves legitimacy",
        body: "the builder verifies identity across five independent channels — GitHub, X (via zkTLS), Facebook, Instagram, and their domain. verification triggers an EAS attestation on Base.",
        color: "text-green-600",
        bg: "bg-green-50",
    },
    {
        num: "03",
        icon: CheckCircle,
        title: "stamp your sigil",
        body: "the sigil is an onchain attestation — portable proof of builder legitimacy. machine-readable. permanent. the verification standard for the agentic economy.",
        color: "text-primary",
        bg: "bg-primary/10",
    },
    {
        num: "04",
        icon: Coins,
        title: "capital routes + milestones govern",
        body: "USDC fees from protocol activity route directly to the verified builder. native tokens remain locked under community-governed milestone validation. accountability is the default.",
        color: "text-amber-600",
        bg: "bg-amber-50",
    },
];

export default function SigilProtocol() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Header - Two Column */}
                <div className="border-border border-b bg-sage/20">
                    <div className="flex flex-col lg:flex-row">
                        <div className="lg:w-1/2 px-6 py-10 lg:px-12 lg:py-12 border-border border-b lg:border-b-0 lg:border-r">
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                                protocol
                            </p>
                            <h2 className="text-foreground text-2xl lg:text-3xl font-semibold lowercase">
                                how the standard works.
                            </h2>
                        </div>
                        <div className="lg:w-1/2 px-6 py-8 lg:px-12 lg:py-12 flex items-center">
                            <p className="text-muted-foreground">
                                four phases. permissionless. no single platform dependency at any point
                                in the chain.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Visual Flow Bar */}
                <div className="flex items-center divide-x divide-border border-border border-b bg-lavender/10">
                    {steps.map((step, index) => (
                        <div key={step.num} className="flex-1 flex items-center justify-center py-3 gap-2">
                            <div className={cn("size-6 flex items-center justify-center text-xs font-bold", step.bg, step.color)}>
                                {step.num}
                            </div>
                            {index < steps.length - 1 && (
                                <ArrowRight className="size-4 text-muted-foreground/50 hidden sm:block" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Steps Grid - Enhanced */}
                <div className="flex flex-col lg:flex-row">
                    {steps.map((step) => (
                        <div
                            key={step.num}
                            className={cn(
                                "flex-1 flex flex-col",
                                "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                            )}
                        >
                            {/* Step Header */}
                            <div className="px-6 py-4 lg:px-8 border-border border-b flex items-center gap-3">
                                <div className={cn("size-10 flex items-center justify-center border border-border", step.bg)}>
                                    <step.icon className={cn("size-5", step.color)} />
                                </div>
                                <span className={cn("text-2xl font-bold", step.color)}>{step.num}</span>
                            </div>

                            {/* Step Content */}
                            <div className="flex-1 p-6 lg:p-8">
                                <h3 className="text-foreground text-base font-semibold mb-3 lowercase">
                                    {step.title}
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {step.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
