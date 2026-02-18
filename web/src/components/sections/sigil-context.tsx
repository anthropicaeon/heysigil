import { AlertTriangle, Signal, Target } from "lucide-react";

import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

const problems = [
    {
        icon: AlertTriangle,
        num: "01",
        title: "fragility",
        subtitle: "platform dependency",
        body: "builder verification tied to one platform's API. when that platform changes policy, the entire trust layer breaks. infrastructure for the agentic economy can't have a single point of failure.",
        accent: "border-l-red-500",
        iconColor: "text-red-500",
        bg: "bg-red-50",
    },
    {
        icon: Target,
        num: "02",
        title: "misalignment",
        subtitle: "zero accountability",
        body: "builders collect fees with no obligation to ship. no milestones. no governance. capital without accountability creates misaligned incentives at scale.",
        accent: "border-l-amber-500",
        iconColor: "text-amber-500",
        bg: "bg-amber-50",
    },
    {
        icon: Signal,
        num: "03",
        title: "noise",
        subtitle: "no signal differentiation",
        body: "real dev projects and low-effort entries move through the same channels with no distinction. communities have no reliable way to identify verified builders.",
        accent: "border-l-blue-500",
        iconColor: "text-blue-500",
        bg: "bg-blue-50",
    },
];

export default function SigilContext() {
    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r border-b px-0">
                {/* Header with PixelCard */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-rose/30"
                >
                    <div className="px-6 py-10 lg:px-12 lg:py-12">
                        <div className="max-w-3xl">
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                                why this matters
                            </p>
                            <h2 className="text-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                the agentic economy is scaling.
                                <br />
                                <span className="text-primary">the infrastructure isn&apos;t.</span>
                            </h2>
                            <p className="text-muted-foreground leading-relaxed">
                                AI agents are coordinating capital, managing communities, and operating
                                across platforms at scale. but the infrastructure underneath still
                                depends on single-platform APIs, offers no builder accountability, and
                                can&apos;t separate real projects from noise.
                            </p>
                        </div>
                    </div>
                </PixelCard>

                {/* Problems Grid - Enhanced */}
                <div className="flex flex-col lg:flex-row bg-background">
                    {problems.map((problem) => (
                        <div
                            key={problem.title}
                            className={cn(
                                "flex-1 flex flex-col",
                                "border-border border-b lg:border-b-0 lg:border-r lg:last:border-r-0",
                            )}
                        >
                            {/* Problem Number Header */}
                            <div className={cn(
                                "px-6 py-3 lg:px-8 border-border border-b flex items-center justify-between",
                                "border-l-4",
                                problem.accent,
                            )}>
                                <span className={cn("text-2xl font-bold", problem.iconColor)}>
                                    {problem.num}
                                </span>
                                <div className={cn("size-8 flex items-center justify-center", problem.bg)}>
                                    <problem.icon className={cn("size-4", problem.iconColor)} />
                                </div>
                            </div>

                            {/* Problem Content */}
                            <div className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
                                <h3 className="text-foreground text-lg font-semibold mb-1 lowercase">
                                    {problem.title}
                                </h3>
                                <p className={cn("text-sm font-medium mb-4", problem.iconColor)}>
                                    {problem.subtitle}
                                </p>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {problem.body}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
