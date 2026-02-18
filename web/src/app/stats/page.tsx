import {
    ArrowDown,
    ArrowUp,
    BarChart3,
    CheckCircle,
    Coins,
    Github,
    Globe,
    Instagram,
    Shield,
    TrendingUp,
    Twitter,
    Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Mock protocol stats
const protocolStats = {
    totalVerified: 1247,
    totalFees: 892450,
    totalMilestones: 3891,
    activeProjects: 456,
    weeklyGrowth: 12.4,
    monthlyVolume: 2340000,
};

const channelBreakdown = [
    { name: "GitHub", icon: Github, count: 1089, percentage: 87 },
    { name: "X (Twitter)", icon: Twitter, count: 892, percentage: 72 },
    { name: "Domain", icon: Globe, count: 634, percentage: 51 },
    { name: "Instagram", icon: Instagram, count: 423, percentage: 34 },
    { name: "Facebook", icon: Shield, count: 312, percentage: 25 },
];

const weeklyData = [
    { day: "Mon", verifications: 42, fees: 12400 },
    { day: "Tue", verifications: 38, fees: 9800 },
    { day: "Wed", verifications: 55, fees: 15200 },
    { day: "Thu", verifications: 61, fees: 18900 },
    { day: "Fri", verifications: 48, fees: 14100 },
    { day: "Sat", verifications: 29, fees: 8200 },
    { day: "Sun", verifications: 35, fees: 10400 },
];

const recentMilestones = [
    { project: "DeFi Protocol X", milestone: "Mainnet Launch", status: "approved", time: "2h ago" },
    { project: "NFT Marketplace", milestone: "V2 Contracts", status: "approved", time: "5h ago" },
    { project: "Bridge Protocol", milestone: "Security Audit", status: "pending", time: "8h ago" },
    { project: "DAO Toolkit", milestone: "Governance Module", status: "approved", time: "12h ago" },
];

export default function StatsPage() {
    const maxVerifications = Math.max(...weeklyData.map((d) => d.verifications));

    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream">
                {/* Header */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <div className="max-w-3xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            protocol stats
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                            sigil analytics
                        </h1>
                        <p className="text-muted-foreground">
                            Real-time protocol metrics, verification trends, and fee distributions.
                            All data is sourced from onchain attestations on Base.
                        </p>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="border-border border-b grid grid-cols-2 lg:grid-cols-4 bg-background">
                    <MetricCard
                        icon={Users}
                        value={protocolStats.totalVerified.toLocaleString()}
                        label="Total Verified"
                        trend="+124"
                        trendLabel="this week"
                        className="border-b lg:border-b-0 border-r"
                    />
                    <MetricCard
                        icon={Coins}
                        value={`$${(protocolStats.totalFees / 1000).toFixed(0)}K`}
                        label="Fees Distributed"
                        trend="+$45K"
                        trendLabel="this month"
                        className="border-b lg:border-b-0 lg:border-r"
                    />
                    <MetricCard
                        icon={CheckCircle}
                        value={protocolStats.totalMilestones.toLocaleString()}
                        label="Milestones Complete"
                        trend="89%"
                        trendLabel="success rate"
                        className="border-r lg:border-r"
                    />
                    <MetricCard
                        icon={TrendingUp}
                        value={`${protocolStats.weeklyGrowth}%`}
                        label="Weekly Growth"
                        trend="↑"
                        trendLabel="trending up"
                    />
                </div>

                {/* Charts Section */}
                <div className="flex flex-col lg:flex-row bg-background">
                    {/* Weekly Verifications Chart */}
                    <div className="flex-1 border-border border-b lg:border-b-0 lg:border-r">
                        <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                            <h2 className="text-sm font-medium text-foreground">
                                Weekly Verifications
                            </h2>
                        </div>
                        <div className="px-6 py-6 lg:px-12">
                            {/* Briefing Card: Bar Chart */}
                            <div className="h-48 flex items-end gap-2">
                                {weeklyData.map((data) => (
                                    <div
                                        key={data.day}
                                        className="flex-1 flex flex-col items-center gap-2"
                                    >
                                        <div className="w-full flex flex-col items-center">
                                            <span className="text-xs text-muted-foreground mb-1">
                                                {data.verifications}
                                            </span>
                                            <div
                                                className="w-full bg-primary transition-all"
                                                style={{
                                                    height: `${(data.verifications / maxVerifications) * 120}px`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {data.day}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Channel Breakdown */}
                    <div className="lg:w-80 border-border border-b lg:border-b-0">
                        <div className="px-6 py-4 border-border border-b bg-secondary/30">
                            <h2 className="text-sm font-medium text-foreground">
                                Channel Breakdown
                            </h2>
                        </div>
                        <div className="divide-y divide-border">
                            {channelBreakdown.map((channel) => {
                                const Icon = channel.icon;
                                return (
                                    <div
                                        key={channel.name}
                                        className="px-6 py-3 flex items-center gap-3"
                                    >
                                        <div className="size-8 bg-sage/50 flex items-center justify-center">
                                            <Icon className="size-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-foreground">
                                                    {channel.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {channel.count}
                                                </span>
                                            </div>
                                            {/* Briefing Card: Progress Bar */}
                                            <div className="h-1.5 bg-secondary">
                                                <div
                                                    className="h-full bg-primary transition-all"
                                                    style={{ width: `${channel.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Fee Distribution Visualization */}
                <div className="border-border border-t bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            fee distribution
                        </h2>
                    </div>
                    <div className="px-6 py-8 lg:px-12">
                        {/* Briefing Card: Fee Flow Visualization */}
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <div className="text-center">
                                    <div className="size-16 bg-background border border-border flex items-center justify-center mb-2 mx-auto">
                                        <BarChart3 className="size-8 text-primary" />
                                    </div>
                                    <p className="text-sm font-medium text-foreground">
                                        Protocol Fees
                                    </p>
                                    <p className="text-xs text-muted-foreground">100%</p>
                                </div>
                                <div className="flex-1 h-px bg-border mx-4 relative">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sage/30 px-2 py-0.5 text-xs text-muted-foreground">
                                        distributes to
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-center">
                                        <div className="size-16 bg-primary/10 border border-primary/30 flex items-center justify-center mb-2">
                                            <Users className="size-8 text-primary" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">
                                            Builders
                                        </p>
                                        <p className="text-xs text-primary">70%</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="size-16 bg-background border border-border flex items-center justify-center mb-2">
                                            <Shield className="size-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-foreground">
                                            Treasury
                                        </p>
                                        <p className="text-xs text-muted-foreground">30%</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-4 bg-secondary flex">
                                <div className="bg-primary" style={{ width: "70%" }} />
                                <div className="bg-muted-foreground/30" style={{ width: "30%" }} />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                <span>Verified builder allocation</span>
                                <span>Protocol treasury</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Milestones */}
                <div className="border-border border-t bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            recent milestones
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        {recentMilestones.map((milestone, i) => (
                            <div
                                key={`${milestone.project}-${i}`}
                                className="px-6 py-4 lg:px-12 flex items-center gap-4"
                            >
                                {/* Briefing Card: Status Icon */}
                                <div
                                    className={cn(
                                        "size-10 flex items-center justify-center",
                                        milestone.status === "approved"
                                            ? "bg-green-100"
                                            : "bg-yellow-100",
                                    )}
                                >
                                    <CheckCircle
                                        className={cn(
                                            "size-5",
                                            milestone.status === "approved"
                                                ? "text-green-600"
                                                : "text-yellow-600",
                                        )}
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">
                                        {milestone.project}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {milestone.milestone}
                                    </p>
                                </div>
                                <Badge
                                    variant={
                                        milestone.status === "approved" ? "default" : "outline"
                                    }
                                    className={cn(
                                        milestone.status === "approved" &&
                                            "bg-green-100 text-green-700",
                                    )}
                                >
                                    {milestone.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {milestone.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

interface MetricCardProps {
    icon: typeof Users;
    value: string;
    label: string;
    trend: string;
    trendLabel: string;
    className?: string;
}

function MetricCard({ icon: Icon, value, label, trend, trendLabel, className }: MetricCardProps) {
    const isPositive = trend.startsWith("+") || trend === "↑";
    return (
        <div className={cn("px-6 py-6 lg:px-8 border-border", className)}>
            {/* Briefing Card: Metric Visualization */}
            <div className="flex items-center gap-3 mb-3">
                <div className="size-10 bg-sage/50 flex items-center justify-center">
                    <Icon className="size-5 text-primary" />
                </div>
                <div className="flex items-center gap-1 text-xs">
                    {isPositive ? (
                        <ArrowUp className="size-3 text-green-600" />
                    ) : (
                        <ArrowDown className="size-3 text-red-600" />
                    )}
                    <span className={isPositive ? "text-green-600" : "text-red-600"}>{trend}</span>
                    <span className="text-muted-foreground">{trendLabel}</span>
                </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    );
}
