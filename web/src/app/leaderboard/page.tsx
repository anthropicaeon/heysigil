import {
    ArrowUpRight,
    CheckCircle,
    Github,
    Globe,
    Instagram,
    Shield,
    Trophy,
    Twitter,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock leaderboard data
const topBuilders = [
    {
        rank: 1,
        name: "vitalik.eth",
        avatar: "V",
        score: 5,
        channels: ["github", "x", "domain"],
        feesEarned: "$12,450",
        milestones: 8,
        projects: 3,
        trend: "+2",
    },
    {
        rank: 2,
        name: "satoshi.base",
        avatar: "S",
        score: 5,
        channels: ["github", "x", "facebook", "domain"],
        feesEarned: "$9,230",
        milestones: 6,
        projects: 2,
        trend: "+1",
    },
    {
        rank: 3,
        name: "builder.eth",
        avatar: "B",
        score: 4,
        channels: ["github", "x", "instagram"],
        feesEarned: "$7,890",
        milestones: 5,
        projects: 2,
        trend: "0",
    },
    {
        rank: 4,
        name: "devrel.base",
        avatar: "D",
        score: 4,
        channels: ["github", "x"],
        feesEarned: "$5,120",
        milestones: 4,
        projects: 1,
        trend: "+3",
    },
    {
        rank: 5,
        name: "cryptodev.eth",
        avatar: "C",
        score: 3,
        channels: ["github", "domain"],
        feesEarned: "$3,450",
        milestones: 3,
        projects: 1,
        trend: "-1",
    },
];

const channelIcons: Record<string, typeof Github> = {
    github: Github,
    x: Twitter,
    instagram: Instagram,
    facebook: Shield,
    domain: Globe,
};

const stats = [
    { label: "Total Verified", value: "1,247", trend: "+124 this week" },
    { label: "Fees Distributed", value: "$892K", trend: "+$45K this month" },
    { label: "Milestones Completed", value: "3,891", trend: "89% success rate" },
    { label: "Active Projects", value: "456", trend: "+32 this week" },
];

export default function LeaderboardPage() {
    return (
        <section className="min-h-screen bg-sage/30 relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <div className="max-w-3xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            leaderboard
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                            top verified builders
                        </h1>
                        <p className="text-muted-foreground">
                            Rankings based on verification score, fees earned, and milestones
                            completed. Higher verification scores unlock greater governance weight.
                        </p>
                    </div>
                </div>

                {/* Stats Briefing Cards */}
                <div className="border-border border-b grid grid-cols-2 lg:grid-cols-4">
                    {stats.map((stat, i) => (
                        <div
                            key={stat.label}
                            className={cn(
                                "px-6 py-10 lg:px-8 bg-background",
                                "border-border",
                                i < 2 && "border-b lg:border-b-0",
                                i % 2 === 0 && "border-r",
                                i < 3 && "lg:border-r",
                            )}
                        >
                            {/* Mini Briefing Card */}
                            <div className="mb-3">
                                <StatBriefingCard type={i} />
                            </div>
                            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-xs text-primary mt-1">{stat.trend}</p>
                        </div>
                    ))}
                </div>

                {/* Leaderboard Table Header */}
                <div className="border-border border-b px-6 py-3 lg:px-12 bg-secondary/30">
                    <div className="flex items-center text-xs text-muted-foreground uppercase tracking-wider">
                        <div className="w-16">Rank</div>
                        <div className="flex-1">Builder</div>
                        <div className="w-24 text-center hidden sm:block">Score</div>
                        <div className="w-32 text-center hidden md:block">Channels</div>
                        <div className="w-28 text-right hidden lg:block">Fees Earned</div>
                        <div className="w-24 text-center hidden lg:block">Milestones</div>
                        <div className="w-20 text-right">Trend</div>
                    </div>
                </div>

                {/* Leaderboard Entries */}
                <div className="bg-background divide-y divide-border">
                    {topBuilders.map((builder) => (
                        <div
                            key={builder.name}
                            className={cn(
                                "flex items-center px-6 py-4 lg:px-12 hover:bg-secondary/20 transition-colors",
                                builder.rank === 1 && "bg-primary/5",
                            )}
                        >
                            {/* Rank */}
                            <div className="w-16">
                                {builder.rank <= 3 ? (
                                    <div
                                        className={cn(
                                            "size-8 flex items-center justify-center",
                                            builder.rank === 1 && "bg-yellow-100 text-yellow-700",
                                            builder.rank === 2 && "bg-gray-100 text-gray-600",
                                            builder.rank === 3 && "bg-orange-100 text-orange-700",
                                        )}
                                    >
                                        <Trophy className="size-4" />
                                    </div>
                                ) : (
                                    <span className="text-lg font-medium text-muted-foreground">
                                        {builder.rank}
                                    </span>
                                )}
                            </div>

                            {/* Builder Info */}
                            <div className="flex-1 flex items-center gap-3">
                                <div className="size-10 bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {builder.avatar}
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">{builder.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {builder.projects} project{builder.projects > 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>

                            {/* Score */}
                            <div className="w-24 text-center hidden sm:block">
                                <ScoreBriefingCard score={builder.score} />
                            </div>

                            {/* Channels */}
                            <div className="w-32 hidden md:flex justify-center gap-1">
                                {builder.channels.map((channel) => {
                                    const Icon = channelIcons[channel];
                                    return (
                                        <div
                                            key={channel}
                                            className="size-6 bg-sage/50 flex items-center justify-center"
                                            title={channel}
                                        >
                                            <Icon className="size-3 text-primary" />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Fees */}
                            <div className="w-28 text-right hidden lg:block">
                                <span className="font-medium text-foreground">
                                    {builder.feesEarned}
                                </span>
                            </div>

                            {/* Milestones */}
                            <div className="w-24 text-center hidden lg:block">
                                <MilestoneBriefingCard completed={builder.milestones} />
                            </div>

                            {/* Trend */}
                            <div className="w-20 text-right">
                                <Badge
                                    variant={
                                        builder.trend.startsWith("+")
                                            ? "default"
                                            : builder.trend === "0"
                                              ? "outline"
                                              : "secondary"
                                    }
                                    className={cn(
                                        "text-xs",
                                        builder.trend.startsWith("+") &&
                                            "bg-green-100 text-green-700",
                                        builder.trend.startsWith("-") && "bg-red-100 text-red-700",
                                    )}
                                >
                                    {builder.trend === "0" ? "—" : builder.trend}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>

                {/* View All Link */}
                <div className="border-border border-t px-6 py-4 lg:px-12 bg-background">
                    <Link
                        href="/explorer"
                        className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                        View all verified builders
                        <ArrowUpRight className="size-4" />
                    </Link>
                </div>

                {/* How Ranking Works */}
                <div className="border-border border-t bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            how ranking works
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
                        <div className="px-6 py-6 lg:px-12">
                            <div className="mb-4">
                                <RankingFactorCard type="score" />
                            </div>
                            <h3 className="font-medium text-foreground mb-2">Verification Score</h3>
                            <p className="text-sm text-muted-foreground">
                                1-5 based on verified channels. More channels = higher score and
                                governance weight.
                            </p>
                        </div>
                        <div className="px-6 py-6 lg:px-12">
                            <div className="mb-4">
                                <RankingFactorCard type="fees" />
                            </div>
                            <h3 className="font-medium text-foreground mb-2">Fees Earned</h3>
                            <p className="text-sm text-muted-foreground">
                                USDC fees routed from protocol activity. Higher scores get larger
                                allocations.
                            </p>
                        </div>
                        <div className="px-6 py-6 lg:px-12">
                            <div className="mb-4">
                                <RankingFactorCard type="milestones" />
                            </div>
                            <h3 className="font-medium text-foreground mb-2">
                                Milestones Completed
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Community-validated deliverables. More completions = higher builder
                                reputation.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// Briefing Card Components - Mini interactive UI previews

function StatBriefingCard({ type }: { type: number }) {
    if (type === 0) {
        // Verified users visualization
        return (
            <div className="h-20 flex items-end gap-0.5">
                {[40, 55, 45, 70, 60, 85, 75, 95].map((h, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-primary/20 transition-all"
                        style={{ height: `${h}%` }}
                    >
                        <div
                            className="w-full bg-primary transition-all"
                            style={{ height: `${h > 70 ? 100 : 60}%` }}
                        />
                    </div>
                ))}
            </div>
        );
    }
    if (type === 1) {
        // Fees distributed
        return (
            <div className="h-20 flex items-center gap-2">
                <div className="flex-1 h-2 bg-secondary">
                    <div className="h-full bg-primary" style={{ width: "78%" }} />
                </div>
                <span className="text-xs text-primary font-medium">78%</span>
            </div>
        );
    }
    if (type === 2) {
        // Milestones
        return (
            <div className="h-20 flex items-center gap-1">
                {[1, 1, 1, 1, 1, 0, 0, 0].map((done, i) => (
                    <div
                        key={i}
                        className={cn(
                            "size-5 flex items-center justify-center border",
                            done ? "bg-primary border-primary" : "bg-secondary/50 border-border",
                        )}
                    >
                        {done ? <CheckCircle className="size-3 text-primary-foreground" /> : null}
                    </div>
                ))}
            </div>
        );
    }
    // Active projects
    return (
        <div className="h-20 grid grid-cols-4 gap-1">
            {[1, 1, 1, 0, 1, 1, 0, 0, 1, 0, 0, 0].map((active, i) => (
                <div
                    key={i}
                    className={cn("aspect-square", active ? "bg-primary/30" : "bg-secondary/30")}
                />
            ))}
        </div>
    );
}

function ScoreBriefingCard({ score }: { score: number }) {
    return (
        <div className="flex items-center justify-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <div
                    key={n}
                    className={cn("size-4", n <= score ? "bg-primary" : "bg-secondary/50")}
                >
                    {n <= score && <Shield className="size-4 p-0.5 text-primary-foreground" />}
                </div>
            ))}
        </div>
    );
}

function MilestoneBriefingCard({ completed }: { completed: number }) {
    const total = 10;
    const percentage = (completed / total) * 100;
    return (
        <div className="flex flex-col items-center gap-1">
            <div className="w-full h-1.5 bg-secondary">
                <div className="h-full bg-primary" style={{ width: `${percentage}%` }} />
            </div>
            <span className="text-xs text-muted-foreground">
                {completed}/{total}
            </span>
        </div>
    );
}

function RankingFactorCard({ type }: { type: "score" | "fees" | "milestones" }) {
    if (type === "score") {
        return (
            <div className="h-20 border border-border bg-background p-2 flex items-center justify-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                    <div
                        key={n}
                        className={cn(
                            "size-6 flex items-center justify-center transition-all",
                            n <= 4 ? "bg-primary" : "bg-secondary/30",
                        )}
                    >
                        {n <= 4 && <CheckCircle className="size-4 text-primary-foreground" />}
                    </div>
                ))}
            </div>
        );
    }
    if (type === "fees") {
        return (
            <div className="h-20 border border-border bg-background p-2 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Week 1</span>
                    <div className="flex-1 h-1.5 bg-secondary">
                        <div className="h-full bg-primary" style={{ width: "45%" }} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Week 2</span>
                    <div className="flex-1 h-1.5 bg-secondary">
                        <div className="h-full bg-primary" style={{ width: "72%" }} />
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Week 3</span>
                    <div className="flex-1 h-1.5 bg-secondary">
                        <div className="h-full bg-primary" style={{ width: "91%" }} />
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="h-20 border border-border bg-background p-2 flex items-center gap-2">
            <div className="flex-1 flex flex-col gap-1">
                {[1, 2, 3].map((n) => (
                    <div key={n} className="flex items-center gap-1">
                        <div className="size-3 bg-primary flex items-center justify-center">
                            <CheckCircle className="size-2 text-primary-foreground" />
                        </div>
                        <div className="flex-1 h-1 bg-primary/30" />
                    </div>
                ))}
            </div>
            <div className="text-lg font-bold text-primary">3/3</div>
        </div>
    );
}
