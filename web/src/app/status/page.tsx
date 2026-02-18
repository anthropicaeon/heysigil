import {
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    Database,
    ExternalLink,
    Globe,
    Server,
    Shield,
    Zap,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// System status data
const systems = [
    {
        name: "Sigil API",
        status: "operational",
        latency: "45ms",
        uptime: "99.99%",
        icon: Server,
    },
    {
        name: "Verification Service",
        status: "operational",
        latency: "120ms",
        uptime: "99.95%",
        icon: Shield,
    },
    {
        name: "Attestation Engine",
        status: "operational",
        latency: "85ms",
        uptime: "99.99%",
        icon: CheckCircle,
    },
    {
        name: "Fee Router",
        status: "operational",
        latency: "60ms",
        uptime: "100%",
        icon: Zap,
    },
    {
        name: "Database Cluster",
        status: "operational",
        latency: "12ms",
        uptime: "99.99%",
        icon: Database,
    },
    {
        name: "CDN",
        status: "operational",
        latency: "8ms",
        uptime: "100%",
        icon: Globe,
    },
];

const contracts = [
    {
        name: "SigilFeeVault",
        address: "0x1234...5678",
        network: "Base",
        verified: true,
    },
    {
        name: "SigilFactoryV3",
        address: "0xabcd...ef01",
        network: "Base",
        verified: true,
    },
    {
        name: "SigilHook",
        address: "0x9876...5432",
        network: "Base",
        verified: true,
    },
    {
        name: "EAS Resolver",
        address: "0xfedc...ba98",
        network: "Base",
        verified: true,
    },
];

const recentIncidents = [
    {
        date: "Feb 15, 2026",
        title: "Scheduled Maintenance",
        status: "completed",
        duration: "15 min",
        description: "Database optimization and index updates",
    },
    {
        date: "Feb 10, 2026",
        title: "API Latency Spike",
        status: "resolved",
        duration: "8 min",
        description: "Increased latency due to traffic surge, auto-scaled",
    },
    {
        date: "Feb 1, 2026",
        title: "GitHub OAuth Delay",
        status: "resolved",
        duration: "23 min",
        description: "GitHub API rate limit reached, implemented caching",
    },
];

const uptimeData = [
    { day: 1, status: "up" },
    { day: 2, status: "up" },
    { day: 3, status: "up" },
    { day: 4, status: "up" },
    { day: 5, status: "degraded" },
    { day: 6, status: "up" },
    { day: 7, status: "up" },
    { day: 8, status: "up" },
    { day: 9, status: "up" },
    { day: 10, status: "up" },
    { day: 11, status: "up" },
    { day: 12, status: "up" },
    { day: 13, status: "up" },
    { day: 14, status: "up" },
    { day: 15, status: "maintenance" },
    { day: 16, status: "up" },
    { day: 17, status: "up" },
    { day: 18, status: "up" },
    { day: 19, status: "up" },
    { day: 20, status: "up" },
    { day: 21, status: "up" },
    { day: 22, status: "up" },
    { day: 23, status: "up" },
    { day: 24, status: "up" },
    { day: 25, status: "up" },
    { day: 26, status: "up" },
    { day: 27, status: "up" },
    { day: 28, status: "up" },
    { day: 29, status: "up" },
    { day: 30, status: "up" },
];

export default function StatusPage() {
    const allOperational = systems.every((s) => s.status === "operational");

    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream">
                {/* Header with Overall Status */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div className="max-w-xl">
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                                system status
                            </p>
                            <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                                sigil infrastructure
                            </h1>
                            <p className="text-muted-foreground">
                                Real-time status of Sigil services, smart contracts, and
                                infrastructure. Subscribe to updates for incident notifications.
                            </p>
                        </div>

                        {/* Overall Status Briefing Card */}
                        <div className="border border-border bg-sage/30 p-6 min-w-64">
                            <div className="flex items-center gap-3 mb-4">
                                {allOperational ? (
                                    <div className="size-12 bg-green-100 flex items-center justify-center">
                                        <CheckCircle className="size-6 text-green-600" />
                                    </div>
                                ) : (
                                    <div className="size-12 bg-yellow-100 flex items-center justify-center">
                                        <AlertCircle className="size-6 text-yellow-600" />
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-foreground">
                                        {allOperational
                                            ? "All Systems Operational"
                                            : "Partial Outage"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Last checked: just now
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="size-2 bg-green-500 animate-pulse" />
                                <span className="text-xs text-green-600">
                                    Live monitoring active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 30-Day Uptime Briefing Card */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30 flex items-center justify-between">
                        <h2 className="text-sm font-medium text-foreground">30-Day Uptime</h2>
                        <span className="text-sm text-green-600 font-medium">99.97%</span>
                    </div>
                    <div className="px-6 py-4 lg:px-12">
                        <div className="flex gap-0.5">
                            {uptimeData.map((day) => (
                                <div
                                    key={day.day}
                                    className={cn(
                                        "flex-1 h-8 transition-colors",
                                        day.status === "up" && "bg-green-500",
                                        day.status === "degraded" && "bg-yellow-500",
                                        day.status === "maintenance" && "bg-blue-500",
                                        day.status === "down" && "bg-red-500",
                                    )}
                                    title={`Day ${day.day}: ${day.status}`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-2">
                            <span>30 days ago</span>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1">
                                    <div className="size-2 bg-green-500" />
                                    <span>Operational</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="size-2 bg-yellow-500" />
                                    <span>Degraded</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="size-2 bg-blue-500" />
                                    <span>Maintenance</span>
                                </div>
                            </div>
                            <span>Today</span>
                        </div>
                    </div>
                </div>

                {/* System Status Grid */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            services
                        </h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3">
                        {systems.map((system, i) => {
                            const Icon = system.icon;
                            return (
                                <div
                                    key={system.name}
                                    className={cn(
                                        "px-6 py-5 border-border",
                                        i < 3 && "border-b lg:border-b",
                                        i >= 3 && i < 6 && "lg:border-b-0",
                                        i % 2 === 0 && "sm:border-r lg:border-r-0",
                                        i % 3 !== 2 && "lg:border-r",
                                    )}
                                >
                                    {/* Service Status Briefing Card */}
                                    <div className="flex items-start gap-4">
                                        <div
                                            className={cn(
                                                "size-10 flex items-center justify-center",
                                                system.status === "operational"
                                                    ? "bg-green-100"
                                                    : "bg-yellow-100",
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    "size-5",
                                                    system.status === "operational"
                                                        ? "text-green-600"
                                                        : "text-yellow-600",
                                                )}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-medium text-foreground">
                                                    {system.name}
                                                </h3>
                                                <div
                                                    className={cn(
                                                        "size-2",
                                                        system.status === "operational"
                                                            ? "bg-green-500"
                                                            : "bg-yellow-500",
                                                    )}
                                                />
                                            </div>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="size-3" />
                                                    {system.latency}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Activity className="size-3" />
                                                    {system.uptime}
                                                </div>
                                            </div>
                                            {/* Mini latency graph */}
                                            <div className="mt-3 flex items-end gap-0.5 h-4">
                                                {[30, 45, 35, 50, 40, 45, 42, 48].map((h, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex-1 bg-green-200"
                                                        style={{ height: `${h}%` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Smart Contracts */}
                <div className="border-border border-b bg-sage/30">
                    <div className="px-6 py-4 lg:px-12 border-border border-b">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            smart contracts
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        {contracts.map((contract) => (
                            <div
                                key={contract.name}
                                className="px-6 py-4 lg:px-12 flex items-center gap-4"
                            >
                                {/* Contract Status Briefing Card */}
                                <div className="size-10 bg-background border border-border flex items-center justify-center">
                                    <Shield className="size-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-foreground font-mono text-sm">
                                            {contract.name}
                                        </h3>
                                        {contract.verified && (
                                            <Badge
                                                variant="default"
                                                className="text-xs bg-green-100 text-green-700"
                                            >
                                                <CheckCircle className="size-3 mr-1" />
                                                Verified
                                            </Badge>
                                        )}
                                    </div>
                                    <code className="text-xs text-muted-foreground">
                                        {contract.address}
                                    </code>
                                </div>
                                <Badge variant="outline">{contract.network}</Badge>
                                <Link
                                    href={`https://basescan.org/address/${contract.address}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <ExternalLink className="size-4" />
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Incidents */}
                <div className="bg-background">
                    <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                        <h2 className="text-lg font-semibold text-foreground lowercase">
                            recent incidents
                        </h2>
                    </div>
                    <div className="divide-y divide-border">
                        {recentIncidents.map((incident, i) => (
                            <div key={`${incident.date}-${i}`} className="px-6 py-5 lg:px-12">
                                {/* Incident Briefing Card */}
                                <div className="flex items-start gap-4">
                                    <div
                                        className={cn(
                                            "size-10 flex items-center justify-center shrink-0",
                                            incident.status === "completed"
                                                ? "bg-blue-100"
                                                : "bg-green-100",
                                        )}
                                    >
                                        <CheckCircle
                                            className={cn(
                                                "size-5",
                                                incident.status === "completed"
                                                    ? "text-blue-600"
                                                    : "text-green-600",
                                            )}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-foreground">
                                                {incident.title}
                                            </h3>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "text-xs",
                                                    incident.status === "resolved" &&
                                                        "bg-green-100 text-green-700",
                                                    incident.status === "completed" &&
                                                        "bg-blue-100 text-blue-700",
                                                )}
                                            >
                                                {incident.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {incident.description}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                            <span>{incident.date}</span>
                                            <span>Duration: {incident.duration}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-border border-t">
                        <Link
                            href="/status/history"
                            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            View incident history
                            <ExternalLink className="size-4" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
