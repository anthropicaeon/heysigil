"use client";

import {
    AlertTriangle,
    ArrowRight,
    CheckCircle,
    Code,
    Coins,
    Copy,
    FileText,
    GitBranch,
    MessageSquare,
    Rocket,
    Search,
    Share2,
    Shield,
    Signal,
    Target,
    Users,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PixelCard } from "@/components/ui/pixel-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// ─── Data ───────────────────────────────────────────────

const CHANNELS = [
    { name: "GitHub", method: "OAuth", verified: true },
    { name: "X", method: "zkTLS", verified: true },
    { name: "Facebook", method: "OAuth", verified: true },
    { name: "Instagram", method: "OAuth", verified: true },
    { name: "Domain", method: "DNS", verified: true },
];

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

const scannerSteps = [
    {
        num: "01",
        title: "Add a .sigil file",
        desc: "Create a .sigil file in your repo root with your wallet address.",
        icon: FileText,
    },
    {
        num: "02",
        title: "Trigger the scanner",
        desc: "POST /api/attest/scan with your owner/repo. We fetch and verify the file.",
        icon: Search,
    },
    {
        num: "03",
        title: "Fees route to you",
        desc: "Your wallet gets an EAS attestation and USDC fees start routing automatically.",
        icon: Coins,
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

// ─── Component ──────────────────────────────────────────

type QuickLaunchStatus = "idle" | "launching" | "success";

export default function DevelopersPage() {
    const [quickLaunchStatus, setQuickLaunchStatus] = useState<QuickLaunchStatus>("idle");
    const [claimToken, setClaimToken] = useState<string | null>(null);
    const [quickLaunchRepoUrl, setQuickLaunchRepoUrl] = useState("");
    const [quickLaunchName, setQuickLaunchName] = useState("");
    const [quickLaunchSymbol, setQuickLaunchSymbol] = useState("");
    const [quickLaunchDescription, setQuickLaunchDescription] = useState("");
    const [copiedToken, setCopiedToken] = useState(false);
    const [copiedShareUrl, setCopiedShareUrl] = useState(false);
    const [quickLaunchError, setQuickLaunchError] = useState<string | null>(null);
    const [isQuickLaunchOpen, setIsQuickLaunchOpen] = useState(false);
    const [copiedFileContent, setCopiedFileContent] = useState(false);

    const handleQuickLaunch = async ({ requireRepoInput = false }: { requireRepoInput?: boolean } = {}) => {
        const repoUrl = quickLaunchRepoUrl.trim();
        if (requireRepoInput && !repoUrl) {
            setQuickLaunchError("Repo URL is required for guided quick launch.");
            return;
        }

        if (quickLaunchStatus === "launching") return;
        setQuickLaunchStatus("launching");
        setClaimToken(null);
        setCopiedToken(false);
        setCopiedShareUrl(false);
        setQuickLaunchError(null);

        try {
            const response = await apiClient.launch.quick(
                requireRepoInput
                    ? {
                        repoUrl,
                        name: quickLaunchName.trim() || undefined,
                        symbol: quickLaunchSymbol.trim() || undefined,
                        description: quickLaunchDescription.trim() || undefined,
                    }
                    : undefined,
            );
            setClaimToken(response.claimToken);
            setQuickLaunchStatus("success");
        } catch (error) {
            setQuickLaunchStatus("idle");
            if (error instanceof ApiError && error.status === 429) {
                setQuickLaunchError(
                    "Quick launch is limited to one deployment per IP. Use your saved one-time claim secret.",
                );
                return;
            }
            setQuickLaunchError(error instanceof Error ? error.message : "Quick launch failed");
        }
    };

    const copyClaimToken = async () => {
        if (!claimToken) return;
        await navigator.clipboard.writeText(claimToken);
        setCopiedToken(true);
        window.setTimeout(() => setCopiedToken(false), 1200);
    };

    const shareClaimToken = async () => {
        if (!claimToken) return;
        const shareUrl = `${window.location.origin}/connect/${encodeURIComponent(claimToken)}`;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Sigil Quick Launch Claim Link",
                    text: "Redeem this quick-launch secret after signing in with Privy.",
                    url: shareUrl,
                });
                return;
            } catch {
                // fallback
            }
        }
        await navigator.clipboard.writeText(shareUrl);
        setCopiedShareUrl(true);
        window.setTimeout(() => setCopiedShareUrl(false), 1400);
    };

    const copySigilFileContent = async () => {
        await navigator.clipboard.writeText("wallet: 0xYOUR_WALLET_ADDRESS");
        setCopiedFileContent(true);
        window.setTimeout(() => setCopiedFileContent(false), 1200);
    };

    return (
        <section className="min-h-screen bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0 bg-cream flex flex-col">

                {/* ═══ Band 1: Channels Bar ═══ */}
                <div className="flex flex-col sm:flex-row bg-sage/10 border-border border-b">
                    <div className="hidden sm:flex items-center px-4 lg:px-6 border-border border-r bg-sage/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            Channels
                        </span>
                    </div>
                    {CHANNELS.map((channel) => (
                        <div
                            key={channel.name}
                            className={cn(
                                "flex-1 px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-center gap-2",
                                "border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0",
                                "hover:bg-sage/20 transition-colors",
                            )}
                        >
                            <CheckCircle className="size-3.5 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                                {channel.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                                {channel.method}
                            </Badge>
                        </div>
                    ))}
                </div>

                {/* ═══ Band 2: Quick Launch Hero ═══ */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-lavender/30"
                >
                    <div className="px-6 py-12 lg:px-12 lg:py-16">
                        <div className="flex items-center gap-2 mb-6">
                            <Rocket className="size-4 text-primary" />
                            <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                quick launch
                            </p>
                        </div>

                        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-semibold text-foreground mb-4 lowercase leading-tight">
                            launch a token in 60 seconds.
                        </h1>
                        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
                            Deploy an unclaimed token on Base with one click. Claim ownership
                            later with a one-time secret. No wallet connection required to launch.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 mb-6">
                            <Button
                                type="button"
                                size="lg"
                                onClick={() => void handleQuickLaunch()}
                                disabled={quickLaunchStatus === "launching"}
                                className="w-full sm:w-auto gap-2"
                            >
                                <Zap className="size-4" />
                                {quickLaunchStatus === "launching"
                                    ? "Launching..."
                                    : "1 Click Launch"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={() => setIsQuickLaunchOpen((prev) => !prev)}
                                className="w-full sm:w-auto border-primary/35 bg-lavender/85 hover:bg-lavender/92"
                            >
                                {isQuickLaunchOpen ? "Hide Options" : "Guided Launch"}
                            </Button>
                        </div>

                        {/* Quick Launch Form (expandable) */}
                        {isQuickLaunchOpen && (
                            <div className="border border-border bg-background/80">
                                <div className="border-border border-b px-6 py-3">
                                    <p className="text-xs uppercase tracking-[0.12em] text-primary">
                                        guided quick launch
                                    </p>
                                </div>
                                <div className="px-6 py-5">
                                    <div className="grid gap-2 sm:grid-cols-2 mb-3">
                                        <Input
                                            value={quickLaunchRepoUrl}
                                            onChange={(e) => setQuickLaunchRepoUrl(e.target.value)}
                                            placeholder="https://github.com/owner/repo"
                                            className="sm:col-span-2"
                                        />
                                        <Input
                                            value={quickLaunchName}
                                            onChange={(e) => setQuickLaunchName(e.target.value)}
                                            placeholder="Token name (optional)"
                                        />
                                        <Input
                                            value={quickLaunchSymbol}
                                            onChange={(e) => setQuickLaunchSymbol(e.target.value)}
                                            placeholder="Token symbol (optional)"
                                        />
                                        <Input
                                            value={quickLaunchDescription}
                                            onChange={(e) => setQuickLaunchDescription(e.target.value)}
                                            placeholder="Description (optional)"
                                            className="sm:col-span-2"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Guided quick launch uses your repo metadata and still launches{" "}
                                        <span className="font-medium text-foreground">unclaimed</span>.
                                    </p>
                                    <Button
                                        type="button"
                                        onClick={() => void handleQuickLaunch({ requireRepoInput: true })}
                                        disabled={quickLaunchStatus === "launching"}
                                    >
                                        {quickLaunchStatus === "launching" ? "Launching..." : "Launch with Repo"}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {quickLaunchError && (
                            <div className="mt-4 border border-border bg-rose/20 px-6 py-3">
                                <p className="text-xs text-red-700">{quickLaunchError}</p>
                            </div>
                        )}

                        {/* Success - Claim Token */}
                        {quickLaunchStatus === "success" && claimToken && (
                            <div className="mt-4 border border-border bg-sage/20">
                                <div className="border-border border-b px-6 py-3">
                                    <p className="text-xs uppercase tracking-[0.12em] text-primary">
                                        one-time claim token
                                    </p>
                                </div>
                                <div className="px-6 py-5">
                                    <p className="font-mono text-sm text-foreground break-all mb-4">
                                        {claimToken}
                                    </p>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void copyClaimToken()}
                                        >
                                            <Copy className="mr-2 size-3.5" />
                                            {copiedToken ? "Copied" : "Copy Token"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => void shareClaimToken()}
                                        >
                                            <Share2 className="mr-2 size-3.5" />
                                            {copiedShareUrl ? "Link Copied" : "Share Link"}
                                        </Button>
                                        <span className="text-xs text-muted-foreground">
                                            Save this now. It is shown once and used to claim ownership.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </PixelCard>

                {/* ═══ Band 3: Scanner Guide ═══ */}
                <div className="border-border border-b">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-sage/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-sage/40 border border-border flex items-center justify-center">
                                <GitBranch className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    .sigil scanner
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    claim ownership with a single file.
                                </h2>
                            </div>
                        </div>
                    </div>

                    {/* Scanner Steps */}
                    <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border bg-background">
                        {scannerSteps.map((step) => (
                            <div
                                key={step.num}
                                className="flex-1 px-6 py-6 lg:px-8"
                            >
                                <div className="flex sm:flex-col items-start gap-4 sm:text-center sm:items-center">
                                    <div className="size-12 bg-sage/30 border border-border flex items-center justify-center font-bold text-sm shrink-0 text-foreground">
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

                    {/* File Format + API */}
                    <div className="grid lg:grid-cols-2 border-border border-t">
                        {/* .sigil file format */}
                        <div className="border-border border-b lg:border-b-0 lg:border-r px-6 py-6 lg:px-8">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-mono uppercase tracking-wider text-primary">
                                    .sigil file format
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => void copySigilFileContent()}
                                >
                                    <Copy className="mr-1.5 size-3" />
                                    {copiedFileContent ? "Copied" : "Copy"}
                                </Button>
                            </div>
                            <div className="border border-border bg-foreground/[0.03]">
                                <div className="border-border border-b px-4 py-2">
                                    <p className="text-[11px] font-mono text-muted-foreground">
                                        your-repo/.sigil
                                    </p>
                                </div>
                                <pre className="px-4 py-3 text-sm font-mono text-foreground">
                                    wallet: 0xYOUR_WALLET_ADDRESS</pre>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Place this file in your repository root. The scanner reads the wallet address
                                and creates an onchain attestation linking you to the project.
                            </p>
                        </div>

                        {/* API Endpoint */}
                        <div className="px-6 py-6 lg:px-8">
                            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
                                scanner api
                            </p>
                            <div className="border border-border bg-foreground/[0.03]">
                                <div className="border-border border-b px-4 py-2 flex items-center gap-2">
                                    <Badge variant="outline" className="text-[10px] font-mono">
                                        POST
                                    </Badge>
                                    <p className="text-[11px] font-mono text-muted-foreground">
                                        /api/attest/scan
                                    </p>
                                </div>
                                <pre className="px-4 py-3 text-sm font-mono text-foreground whitespace-pre">{`{
  "repo": "owner/repo"
}`}</pre>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                The scanner fetches your <span className="font-mono text-foreground">.sigil</span> file,
                                verifies the wallet address format, creates an EAS attestation, and triggers
                                fee routing to your wallet automatically.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ Band 4: Problem Section ═══ */}
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

                {/* ═══ Band 5: Solution Section ═══ */}
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

                {/* ═══ Band 6: How it Works ═══ */}
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

                {/* ═══ Band 7: Package Guide ═══ */}
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

                {/* ═══ Band 8: CTA ═══ */}
                <div className="flex-1 relative container border-primary-foreground/20 px-0 bg-primary flex flex-col">
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
                                <div className="px-6 py-4 lg:px-8 border-b border-primary-foreground/20 flex items-center gap-3">
                                    <div className="size-10 bg-background/20 flex items-center justify-center">
                                        <Shield className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">
                                        Verification
                                    </span>
                                </div>
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
                                <div className="px-6 py-4 lg:px-8 border-b border-primary-foreground/20 flex items-center gap-3">
                                    <div className="size-10 bg-background/20 flex items-center justify-center">
                                        <MessageSquare className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">
                                        AI Assistant
                                    </span>
                                </div>
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
