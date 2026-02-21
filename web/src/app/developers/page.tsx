"use client";

import {
    ArrowRight,
    CheckCircle,
    Coins,
    Copy,
    FileText,
    GitBranch,
    MessageSquare,
    Shield,
    Terminal,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

// ─── Data ───────────────────────────────────────────────

const CHANNELS = [
    { name: "GitHub", method: "OAuth" },
    { name: "X", method: "zkTLS" },
    { name: "Facebook", method: "OAuth" },
    { name: "Instagram", method: "OAuth" },
    { name: "Domain", method: "DNS" },
];

const FLOW_STEPS = [
    {
        num: "01",
        icon: Terminal,
        title: "Run one command",
        desc: "npx @heysigil/cli init — creates .sigil, commits, pushes, and triggers the scan.",
        color: "bg-lavender/30",
    },
    {
        num: "02",
        icon: GitBranch,
        title: "Scanner picks it up",
        desc: "Our scanner reads your .sigil file from GitHub and verifies your wallet address.",
        color: "bg-sage/30",
    },
    {
        num: "03",
        icon: Shield,
        title: "EAS attestation created",
        desc: "An onchain attestation is created on Base linking you to the project. Permanent.",
        color: "bg-cream/50",
    },
    {
        num: "04",
        icon: Coins,
        title: "Fees route to you",
        desc: "USDC fees from LP activity start routing to your wallet automatically. No action needed.",
        color: "bg-sage/30",
    },
];

// ─── Component ──────────────────────────────────────────

export default function DevelopersPage() {
    const [copiedInit, setCopiedInit] = useState(false);
    const [copiedManual, setCopiedManual] = useState(false);
    const [copiedScan, setCopiedScan] = useState(false);

    const copyToClipboard = async (
        text: string,
        setter: (v: boolean) => void,
    ) => {
        await navigator.clipboard.writeText(text);
        setter(true);
        window.setTimeout(() => setter(false), 1200);
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

                {/* ═══ Band 2: Hero — The One-Liner ═══ */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-lavender/30"
                >
                    <div className="px-6 py-14 lg:px-12 lg:py-20">
                        <div className="max-w-3xl">
                            <div className="flex items-center gap-2 mb-6">
                                <Terminal className="size-4 text-primary" />
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    one command
                                </p>
                            </div>

                            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-semibold text-foreground mb-6 lowercase leading-tight">
                                claim your project.
                                <br />
                                <span className="text-primary">start earning fees.</span>
                            </h1>

                            <p className="text-lg text-muted-foreground mb-10 max-w-xl leading-relaxed">
                                One command creates a <span className="font-mono text-foreground">.sigil</span> file in your repo,
                                pushes it to GitHub, and triggers verification. You get an onchain attestation
                                and USDC fees start routing to your wallet.
                            </p>

                            {/* The Hero Command */}
                            <div className="border border-border bg-foreground/[0.03] max-w-xl">
                                <div className="border-border border-b px-5 py-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 bg-green-500 animate-pulse" />
                                        <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                            terminal
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() =>
                                            void copyToClipboard(
                                                "npx @heysigil/cli init 0xYOUR_WALLET_ADDRESS",
                                                setCopiedInit,
                                            )
                                        }
                                    >
                                        <Copy className="mr-1.5 size-3" />
                                        {copiedInit ? "Copied" : "Copy"}
                                    </Button>
                                </div>
                                <pre className="px-5 py-4 text-sm lg:text-base font-mono text-foreground overflow-x-auto">
                                    <span className="text-muted-foreground">$</span>{" "}
                                    <span className="text-primary font-semibold">npx</span>{" "}
                                    @heysigil/cli init 0xYOUR_WALLET_ADDRESS
                                </pre>
                            </div>

                            <p className="text-xs text-muted-foreground mt-4">
                                Zero dependencies. Works with any GitHub repo. Run from your project root.
                            </p>
                        </div>
                    </div>
                </PixelCard>

                {/* ═══ Band 3: How It Works — 4 Steps ═══ */}
                <div className="border-border border-b">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-sage/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-sage/40 border border-border flex items-center justify-center">
                                <Zap className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    how it works
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    from terminal to funded in 60 seconds.
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        {FLOW_STEPS.map((step, index) => (
                            <div
                                key={step.num}
                                className={cn(
                                    "px-6 py-8 lg:px-6 border-border bg-background",
                                    index < 2 && "border-b",
                                    index >= 2 && "sm:border-b lg:border-b-0",
                                    index % 2 === 0 && "sm:border-r",
                                    index < 3 && "lg:border-r",
                                )}
                            >
                                <div className={cn("size-12 border border-border flex items-center justify-center mb-4", step.color)}>
                                    <step.icon className="size-5 text-primary" />
                                </div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-mono text-muted-foreground">{step.num}</span>
                                    <h3 className="font-semibold text-foreground">
                                        {step.title}
                                    </h3>
                                </div>
                                <p className="text-muted-foreground text-sm">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ Band 4: What the CLI Does ═══ */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-lavender/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-lavender/40 border border-border flex items-center justify-center">
                                <Terminal className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    under the hood
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    what the cli does.
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2">
                        {/* Left: Terminal Output */}
                        <div className="border-border border-b lg:border-b-0 lg:border-r px-6 py-8 lg:px-8">
                            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-4">
                                example session
                            </p>
                            <div className="border border-border bg-foreground/[0.03]">
                                <div className="border-border border-b px-4 py-2">
                                    <p className="text-[11px] font-mono text-muted-foreground">
                                        terminal
                                    </p>
                                </div>
                                <pre className="px-4 py-4 text-xs font-mono text-foreground whitespace-pre leading-relaxed overflow-x-auto">{`$ npx @heysigil/cli init 0x9Cb1...de5

🔍 Detected repo: github.com/you/your-project

📝 Creating .sigil with contents:

  wallet: 0x9Cb1...de5

Commit and push this file? (y/n): y
✓ Created .sigil
✓ Committed to current branch
✓ Pushed to origin

🔍 Notify Sigil to scan your repo? (y/n): y

✅ Attestation created!
   Attestation UID: 0xabc123...
   TX Hash: 0xdef456...
   Project: github:you/your-project
   Wallet: 0x9Cb1...de5

🎉 You can now claim fees at heysigil.fund/dashboard`}</pre>
                            </div>
                        </div>

                        {/* Right: What Happens */}
                        <div className="px-6 py-8 lg:px-8">
                            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-4">
                                step by step
                            </p>
                            <div className="divide-y divide-border border border-border">
                                {[
                                    {
                                        step: "1",
                                        title: "Detects your GitHub repo",
                                        desc: "Reads git remote origin to find owner/repo",
                                    },
                                    {
                                        step: "2",
                                        title: "Creates .sigil file",
                                        desc: "Writes wallet: 0xYOUR_ADDRESS to repo root",
                                    },
                                    {
                                        step: "3",
                                        title: "Commits and pushes",
                                        desc: "git add .sigil → git commit → git push",
                                    },
                                    {
                                        step: "4",
                                        title: "Triggers the scanner",
                                        desc: "POSTs to /api/attest/scan to create your EAS attestation",
                                    },
                                    {
                                        step: "5",
                                        title: "Fees start routing",
                                        desc: "setDevForPool() moves escrowed fees to your wallet",
                                    },
                                ].map((item) => (
                                    <div key={item.step} className="px-4 py-3 flex items-start gap-3">
                                        <div className="size-6 bg-lavender/30 border border-border flex items-center justify-center shrink-0 text-xs font-mono text-primary">
                                            {item.step}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══ Band 5: Manual Alternative + Scan Command ═══ */}
                <div className="border-border border-b">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-cream/40">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-cream/60 border border-border flex items-center justify-center">
                                <FileText className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    alternatives
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    don&apos;t trust the cli? do it manually.
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-2">
                        {/* Manual approach */}
                        <div className="border-border border-b lg:border-b-0 lg:border-r px-6 py-6 lg:px-8">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-mono uppercase tracking-wider text-primary">
                                    manual — 3 commands
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                        void copyToClipboard(
                                            'echo "wallet: 0xYOUR_ADDRESS" > .sigil\ngit add .sigil && git commit -m "add sigil" && git push',
                                            setCopiedManual,
                                        )
                                    }
                                >
                                    <Copy className="mr-1.5 size-3" />
                                    {copiedManual ? "Copied" : "Copy"}
                                </Button>
                            </div>
                            <div className="border border-border bg-foreground/[0.03]">
                                <pre className="px-4 py-4 text-sm font-mono text-foreground whitespace-pre leading-loose overflow-x-auto">{`echo "wallet: 0xYOUR_ADDRESS" > .sigil
git add .sigil && git commit -m "add sigil" && git push`}</pre>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Create the file manually and push. Then trigger the scan separately.
                            </p>
                        </div>

                        {/* Scan command */}
                        <div className="px-6 py-6 lg:px-8">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-mono uppercase tracking-wider text-primary">
                                    trigger scan separately
                                </p>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() =>
                                        void copyToClipboard(
                                            "npx @heysigil/cli scan owner/repo",
                                            setCopiedScan,
                                        )
                                    }
                                >
                                    <Copy className="mr-1.5 size-3" />
                                    {copiedScan ? "Copied" : "Copy"}
                                </Button>
                            </div>
                            <div className="border border-border bg-foreground/[0.03]">
                                <pre className="px-4 py-4 text-sm font-mono text-foreground whitespace-pre overflow-x-auto">{`npx @heysigil/cli scan owner/repo`}</pre>
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                If you already have a <span className="font-mono text-foreground">.sigil</span> file pushed,
                                use <span className="font-mono text-foreground">scan</span> to trigger the attestation.
                                Auto-detects repo from git remote if run from inside the project.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ Band 6: .sigil File Format ═══ */}
                <div className="border-border border-b bg-background">
                    <div className="px-6 py-5 lg:px-12 border-border border-b bg-sage/20">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-sage/40 border border-border flex items-center justify-center">
                                <FileText className="size-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    file spec
                                </p>
                                <h2 className="text-lg font-semibold text-foreground lowercase">
                                    the .sigil file.
                                </h2>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3">
                        {/* Format Examples */}
                        <div className="border-border border-b lg:border-b-0 lg:border-r px-6 py-6 lg:px-8">
                            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
                                supported formats
                            </p>
                            <div className="space-y-3">
                                {[
                                    { label: "recommended", code: "wallet: 0x1234...abcd" },
                                    { label: "compact", code: "wallet:0x1234...abcd" },
                                    { label: "bare address", code: "0x1234...abcd" },
                                ].map((fmt) => (
                                    <div key={fmt.label} className="border border-border bg-foreground/[0.03]">
                                        <div className="flex items-center gap-2 border-border border-b px-3 py-1.5">
                                            <Badge variant="outline" className="text-[10px]">{fmt.label}</Badge>
                                        </div>
                                        <pre className="px-3 py-2 text-xs font-mono text-foreground">
                                            {fmt.code}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rules */}
                        <div className="border-border border-b lg:border-b-0 lg:border-r px-6 py-6 lg:px-8">
                            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
                                rules
                            </p>
                            <div className="space-y-3">
                                {[
                                    "File must be named .sigil (exactly)",
                                    "Place in your repository root",
                                    "Wallet address must be 0x + 40 hex characters",
                                    "Lines starting with # are ignored",
                                    "Empty lines are skipped",
                                    "First valid wallet found is used",
                                ].map((rule) => (
                                    <div key={rule} className="flex items-start gap-2">
                                        <div className="size-1.5 bg-primary mt-2 shrink-0" />
                                        <span className="text-sm text-muted-foreground">{rule}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Scanner Lookup */}
                        <div className="px-6 py-6 lg:px-8">
                            <p className="text-xs font-mono uppercase tracking-wider text-primary mb-3">
                                scanner lookup order
                            </p>
                            <div className="space-y-2">
                                {[
                                    { branch: "HEAD", note: "auto-resolves default branch" },
                                    { branch: "main", note: "fallback" },
                                    { branch: "master", note: "fallback" },
                                ].map((item) => (
                                    <div key={item.branch} className="flex items-center gap-2 border border-border px-3 py-2">
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {item.branch}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">{item.note}</span>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-4">
                                The scanner fetches from{" "}
                                <span className="font-mono text-foreground text-[11px]">
                                    raw.githubusercontent.com
                                </span>{" "}
                                and tries each branch in order until it finds the file.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ═══ Band 7: CTA ═══ */}
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
                                        <Terminal className="size-5 text-primary-foreground" />
                                    </div>
                                    <span className="text-primary-foreground/80 text-xs font-medium uppercase tracking-wider">
                                        Quick Start
                                    </span>
                                </div>
                                <div className="flex-1 px-6 py-10 lg:px-12 lg:py-12">
                                    <h2 className="text-primary-foreground text-2xl lg:text-3xl font-semibold mb-4 lowercase">
                                        claim your project now.
                                    </h2>
                                    <p className="text-primary-foreground/80 mb-8 max-w-md font-mono text-sm">
                                        npx @heysigil/cli init 0xYOUR_ADDRESS
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
                                        need help?
                                    </h2>
                                    <p className="text-primary-foreground/80 mb-8 max-w-md">
                                        Questions about verification, fee routing, or the scanner?
                                        Chat with Sigil.
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
