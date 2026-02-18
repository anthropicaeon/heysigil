import { AlertTriangle, Signal, Target } from "lucide-react";

import { cn } from "@/lib/utils";

const problems = [
    {
        icon: AlertTriangle,
        title: "fragility",
        subtitle: "platform dependency",
        body: "builder verification tied to one platform's API. when that platform changes policy, the entire trust layer breaks. infrastructure for the agentic economy can't have a single point of failure.",
    },
    {
        icon: Target,
        title: "misalignment",
        subtitle: "zero accountability",
        body: "builders collect fees with no obligation to ship. no milestones. no governance. capital without accountability creates misaligned incentives at scale.",
    },
    {
        icon: Signal,
        title: "noise",
        subtitle: "no signal differentiation",
        body: "real dev projects and low-effort entries move through the same channels with no distinction. communities have no reliable way to identify verified builders.",
    },
];

export default function SigilContext() {
    return (
        <section className="bg-rose relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-8 lg:px-12 lg:py-10">
                    <div className="max-w-3xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            why this matters
                        </p>
                        <h2 className="text-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                            the agentic economy is scaling.
                            <br />
                            the infrastructure isn&apos;t.
                        </h2>
                        <p className="text-muted-foreground">
                            AI agents are coordinating capital, managing communities, and operating
                            across platforms at scale. but the infrastructure underneath still
                            depends on single-platform APIs, offers no builder accountability, and
                            can&apos;t separate real projects from noise.
                        </p>
                    </div>
                </div>

                {/* Problems Grid */}
                <div className="flex flex-col lg:flex-row bg-background">
                    {problems.map((problem) => (
                        <div
                            key={problem.title}
                            className={cn(
                                "flex-1 px-6 py-8 lg:px-8 lg:py-10",
                                "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                            )}
                        >
                            <div className="size-12 bg-primary/10 flex items-center justify-center mb-4 border border-border">
                                <problem.icon className="text-primary size-6" />
                            </div>
                            <h3 className="text-foreground text-lg font-semibold mb-1 lowercase">
                                {problem.title}
                            </h3>
                            <p className="text-primary text-sm font-medium mb-3">
                                {problem.subtitle}
                            </p>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                {problem.body}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
