import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    Code,
    Coins,
    MessageSquare,
    Rocket,
    Shield,
    Signal,
    Target,
    Users,
    Zap,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const problems = [
    {
        icon: AlertTriangle,
        title: "fragility",
        description:
            "Builder verification tied to a single platform API. When that platform changes, trust breaks.",
    },
    {
        icon: Target,
        title: "misalignment",
        description:
            "Builders collect fees without milestones. Capital flows without accountability.",
    },
    {
        icon: Signal,
        title: "noise",
        description:
            "Real dev projects compete with low-effort entries. No way to separate signal.",
    },
];

const solutions = [
    {
        icon: Shield,
        title: "5-Channel Verification",
        description: "GitHub, X (zkTLS), Facebook, Instagram, Domain. No single point of failure.",
        badge: "resilient",
    },
    {
        icon: Coins,
        title: "USDC Fee Routing",
        description:
            "Protocol fees route directly to verified builders. Capital follows verification.",
        badge: "automatic",
    },
    {
        icon: Users,
        title: "Milestone Governance",
        description:
            "Community validates milestones to unlock native tokens. Accountability is structural.",
        badge: "onchain",
    },
    {
        icon: Code,
        title: "EAS Attestations",
        description: "Onchain proof of builder legitimacy. Machine-readable. Permanent. Portable.",
        badge: "permanent",
    },
];

const steps = [
    {
        num: "01",
        title: "Connect your channels",
        desc: "Link GitHub, X, Facebook, Instagram, or your domain.",
        icon: Shield,
    },
    {
        num: "02",
        title: "Complete verification",
        desc: "OAuth or zkTLS depending on the channel.",
        icon: CheckCircle,
    },
    {
        num: "03",
        title: "Receive your sigil",
        desc: "EAS attestation created onchain on Base.",
        icon: Zap,
    },
    {
        num: "04",
        title: "Start earning",
        desc: "USDC fees route to your wallet automatically.",
        icon: Coins,
    },
];

const packageGuides = [
    {
        value: "sdk",
        label: "@heysigil/sigil-sdk",
        status: "public",
        summary:
            "Typed Sigil client for verify, launches, wallet, fees, claims, chat, dashboard, developers info, governance placeholder, and MCP token lifecycle.",
        highlights: [
            "Single createSigilClient() entrypoint with modular namespaces.",
            "Typed request/response surfaces for app integrations and tooling.",
            "MCP token create/list/revoke/rotate plus token introspection.",
        ],
        install: "npm install @heysigil/sigil-sdk",
        quickstart: `import { createSigilClient } from "@heysigil/sigil-sdk";

const sigil = createSigilClient({
  baseUrl: "https://heysigil.com",
  token: process.env.SIGIL_TOKEN,
});

const launches = await sigil.launch.list({ limit: 10 });
const dashboard = await sigil.dashboard.overview();`,
    },
    {
        value: "mcp",
        label: "@heysigil/sigil-mcp",
        status: "workspace",
        summary:
            "MCP server package built on sigil-sdk with scope-aware tool execution and both stdio + streamable HTTP transports.",
        highlights: [
            "Supports tools/list and tools/call with JSON-RPC responses.",
            "Enforces MCP token scopes before tool invocation.",
            "Includes verify, dashboard, chat, launch, developers, governance placeholder tools.",
        ],
        install: `SIGIL_API_URL=http://localhost:3001
SIGIL_MCP_TOKEN=your_token
SIGIL_MCP_TRANSPORT=stdio
sigil-mcp --transport=stdio`,
        quickstart: `# HTTP transport
SIGIL_MCP_TRANSPORT=http SIGIL_MCP_HOST=127.0.0.1 SIGIL_MCP_PORT=8788 sigil-mcp

# health check
curl http://127.0.0.1:8788/health`,
    },
    {
        value: "core",
        label: "@heysigil/sigil-core",
        status: "workspace",
        summary:
            "Shared primitives package used by Sigil workspace packages: errors, scopes, schemas, and common request/token types.",
        highlights: [
            "Canonical SIGIL_SCOPES list and SigilScope type.",
            "Shared Zod schema primitives for cross-package consistency.",
            "Keeps SDK and MCP internals DRY and contract-aligned.",
        ],
        install: "npm run --workspace @heysigil/sigil-core build",
        quickstart: `import { SIGIL_SCOPES } from "@heysigil/sigil-core";

// Example scope checks
const required = ["launch:read", "launch:write"] as const;
const isKnown = required.every((scope) => SIGIL_SCOPES.includes(scope));`,
    },
];

export default function DevelopersPage() {
    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream flex flex-col">
                {/* Hero with PixelCard */}
                <PixelCard
                    variant="sage"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-sage/30"
                >
                    <div className="px-6 py-16 lg:px-12 lg:py-24">
                        <div className="max-w-3xl mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-sage/50 border border-border mb-6">
                                <Rocket className="size-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground uppercase tracking-wider">
                                    for builders
                                </span>
                            </div>
                            <h1 className="text-4xl lg:text-5xl font-semibold text-foreground mb-6 lowercase leading-tight">
                                get verified. get funded.
                                <br />
                                keep shipping.
                            </h1>
                            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                                The sigil is proof you&apos;re real. The code is proof you shipped. No
                                community management. No content calendar. No platform risk.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/verify">
                                    <Button size="lg" className="w-full sm:w-auto gap-2">
                                        Stamp Your Sigil
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                                <Link href="/chat">
                                    <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                                        <MessageSquare className="size-4" />
                                        Talk to Sigil
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </PixelCard>

                {/* Problem Section */}
                <div className="border-border border-b">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-rose/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-rose/40 border border-border flex items-center justify-center">
                                <AlertTriangle className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    the problem
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    current infrastructure is broken.
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border bg-background">
                        {problems.map((problem) => (
                            <div
                                key={problem.title}
                                className="flex-1 px-6 py-8 lg:px-8"
                            >
                                <div className="size-12 flex items-center justify-center mb-4 border border-border bg-cream/30">
                                    <problem.icon className="size-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2 lowercase">
                                    {problem.title}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                    {problem.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Solution Section */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-sage/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-sage/40 border border-border flex items-center justify-center">
                                <Zap className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    the sigil standard
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    infrastructure that scales.
                                </h2>
                            </div>
                        </div>
                    </div>
                    {/* Solutions Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        {solutions.map((solution, index) => (
                            <div
                                key={solution.title}
                                className={cn(
                                    "px-6 py-8 lg:px-8 lg:py-10 border-border",
                                    index < 2 && "border-b",
                                    index % 2 === 0 && "lg:border-r",
                                )}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="size-12 bg-lavender/20 flex items-center justify-center shrink-0 border border-border">
                                        <solution.icon className="size-6 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-base font-semibold text-foreground">
                                                {solution.title}
                                            </h3>
                                            <Badge variant="secondary" className="text-xs">
                                                {solution.badge}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm">
                                            {solution.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* How it Works */}
                <div className="border-border border-b">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-lavender/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-lavender/40 border border-border flex items-center justify-center">
                                <ArrowRight className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    how it works
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    from zero to funded in 4 steps.
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border bg-background">
                        {steps.map((step) => (
                            <div
                                key={step.num}
                                className="flex-1 px-6 py-6 lg:px-8"
                            >
                                <div className="flex sm:flex-col items-start gap-4 sm:text-center sm:items-center">
                                    <div className="size-12 bg-cream/50 border border-border flex items-center justify-center font-bold text-sm shrink-0 text-foreground">
                                        {step.num}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground mb-1">
                                            {step.title}
                                        </h3>
                                        <p className="text-muted-foreground text-sm">{step.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="border-border border-b bg-background">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-cream/40">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-cream/60 border border-border flex items-center justify-center">
                                <Code className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    package guide
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    sdk, mcp, and core integration map.
                                </h2>
                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="sdk" className="w-full">
                        <div className="border-border border-b px-6 py-3 lg:px-12 bg-background/80">
                            <TabsList className="h-auto w-full justify-start rounded-none border-0 bg-transparent p-0">
                                {packageGuides.map((guide, index) => (
                                    <TabsTrigger
                                        key={guide.value}
                                        value={guide.value}
                                        className={cn(
                                            "h-10 rounded-none border border-border px-4 py-2 text-xs font-mono uppercase tracking-wider data-[state=active]:border-border data-[state=active]:bg-lavender/40",
                                            index > 0 && "-ml-px",
                                        )}
                                    >
                                        {guide.value}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </div>

                        {packageGuides.map((guide) => (
                            <TabsContent key={guide.value} value={guide.value} className="mt-0">
                                <div className="grid lg:grid-cols-[1.15fr_1fr]">
                                    <div className="border-border border-b lg:border-b-0 lg:border-r px-6 py-6 lg:px-8 lg:py-8">
                                        <div className="flex flex-wrap items-center gap-2 mb-4">
                                            <Badge variant="outline" className="font-mono text-[11px]">
                                                {guide.label}
                                            </Badge>
                                            <Badge variant="secondary" className="text-[10px] uppercase">
                                                {guide.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-5">
                                            {guide.summary}
                                        </p>
                                        <div className="space-y-2">
                                            {guide.highlights.map((item) => (
                                                <div key={item} className="flex items-start gap-2">
                                                    <div className="size-1.5 bg-primary mt-2 shrink-0" />
                                                    <span className="text-sm text-muted-foreground">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="px-6 py-6 lg:px-8 lg:py-8 bg-foreground/[0.02] space-y-4">
                                        <div className="border border-border bg-background/80">
                                            <div className="border-border border-b px-4 py-2.5">
                                                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                                    install / run
                                                </p>
                                            </div>
                                            <pre className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                                                {guide.install}
                                            </pre>
                                        </div>
                                        <div className="border border-border bg-background/80">
                                            <div className="border-border border-b px-4 py-2.5">
                                                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                                    quick start
                                                </p>
                                            </div>
                                            <pre className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                                                {guide.quickstart}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>

                {/* CTA - Matching Homepage */}
                <div className="flex-1 relative container border-primary-foreground/20 px-0 bg-primary flex flex-col">
                    {/* Section Header */}
                    <div className="px-6 py-3 lg:px-12 border-b border-primary-foreground/20">
                        <span className="text-xs text-primary-foreground/70 uppercase tracking-wider">
                            Get Started
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col lg:flex-row">
                        {/* Claim Your Sigil */}
                        <PixelCard
                            variant="primary"
                            className="flex-1 border-border border-b lg:border-b-0 lg:border-r border-primary-foreground/20"
                            noFocus
                        >
                            <div className="flex flex-col h-full">
                                {/* Card Header */}
                                <div className="px-6 py-4 lg:px-8 border-b border-primary-foreground/20 flex items-center gap-3">
                                    <div className="size-10 bg-background/20 flex items-center justify-center">
                                        <Shield className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">
                                        Verification
                                    </span>
                                </div>

                                {/* Card Content */}
                                <div className="flex-1 px-6 py-10 lg:px-12 lg:py-12">
                                    <h2 className="text-primary-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                        claim your sigil.
                                    </h2>
                                    <p className="text-primary-foreground/80 mb-8 max-w-md">
                                        the verification standard for the agentic economy. five channels.
                                        onchain attestation. milestone governance.
                                    </p>
                                    <Link href="/verify">
                                        <Button
                                            size="lg"
                                            variant="secondary"
                                            className="bg-background text-foreground hover:bg-background/90 gap-2"
                                        >
                                            Stamp Your Sigil
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </PixelCard>

                        {/* Talk to Sigil */}
                        <PixelCard
                            variant="primary"
                            className="flex-1"
                            noFocus
                        >
                            <div className="flex flex-col h-full">
                                {/* Card Header */}
                                <div className="px-6 py-4 lg:px-8 border-b border-primary-foreground/20 flex items-center gap-3">
                                    <div className="size-10 bg-background/20 flex items-center justify-center">
                                        <MessageSquare className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">
                                        AI Assistant
                                    </span>
                                </div>

                                {/* Card Content */}
                                <div className="flex-1 px-6 py-10 lg:px-12 lg:py-12">
                                    <h2 className="text-primary-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                        talk to sigil.
                                    </h2>
                                    <p className="text-primary-foreground/80 mb-8 max-w-md">
                                        have questions about verification, fee routing, or milestone governance?
                                        chat with our AI assistant.
                                    </p>
                                    <Link href="/chat">
                                        <Button
                                            size="lg"
                                            variant="outline"
                                            className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 gap-2"
                                        >
                                            Start Chat
                                            <ArrowRight className="size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </PixelCard>
                    </div>
                </div>
            </div>
        </section>
    );
}
