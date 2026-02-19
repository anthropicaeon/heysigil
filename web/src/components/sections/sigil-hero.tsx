"use client";

import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import ModelViewer from "@/components/ModelViewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import { HERO_MODEL_FRAME, HERO_MODEL_VIEWER } from "@/lib/hero-model-frame";
import { cn } from "@/lib/utils";

const ROTATING_PROMPTS = [
    "Fund my next innovation...",
    "Verify my repo...",
    "Claim my fees...",
    "Authenticate my identity...",
];

const CHANNELS = [
    { name: "GitHub", method: "OAuth", verified: true },
    { name: "X", method: "zkTLS", verified: true },
    { name: "Facebook", method: "OAuth", verified: true },
    { name: "Instagram", method: "OAuth", verified: true },
    { name: "Domain", method: "DNS", verified: true },
];

const HERO_STATS = [
    { value: "5", label: "Channels" },
    { value: "Base", label: "Network" },
    { value: "EAS", label: "Attestation" },
];

// TODO(next-todo): Remove mock presets when quick-launch API is implemented.
const QUICK_LAUNCH_MOCK_PRESETS = [
    {
        id: "agent-template",
        label: "Agent Template",
        name: "sigil: agent capsule",
        ownerSource: "agent://autonomous-bot",
    },
    {
        id: "studio-template",
        label: "Studio Template",
        name: "sigil: studio sprint",
        ownerSource: "github.com/sigil-labs/studio",
    },
];

// TODO(next-todo): Replace with backend one-time claim token response from quick-launch endpoint.
const QUICK_LAUNCH_MOCK_TOKEN_SEED = "SIGIL-QLAIM";
// TODO(next-todo): When global loader completes on "/", fade loader atmosphere first, then
// smoothly slide/hand off the same 3D model into the current hero right-column stage position.

type QuickLaunchStatus = "idle" | "launching" | "success";

export default function SigilHero() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isQuickLaunchOpen, setIsQuickLaunchOpen] = useState(false);
    const [quickLaunchName, setQuickLaunchName] = useState("");
    const [quickLaunchOwnerSource, setQuickLaunchOwnerSource] = useState("");
    const [quickLaunchStatus, setQuickLaunchStatus] = useState<QuickLaunchStatus>("idle");
    const [claimToken, setClaimToken] = useState<string | null>(null);
    const [copiedToken, setCopiedToken] = useState(false);
    const [quickLaunchButtonTurns, setQuickLaunchButtonTurns] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ROTATING_PROMPTS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const resetQuickLaunch = () => {
        setQuickLaunchStatus("idle");
        setClaimToken(null);
        setCopiedToken(false);
    };

    const applyPreset = (presetId: string) => {
        const preset = QUICK_LAUNCH_MOCK_PRESETS.find((item) => item.id === presetId);
        if (!preset) return;
        setQuickLaunchName(preset.name);
        setQuickLaunchOwnerSource(preset.ownerSource);
        resetQuickLaunch();
    };

    const handleQuickLaunchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = quickLaunchName.trim();
        if (!trimmedName || quickLaunchStatus === "launching") return;

        setQuickLaunchStatus("launching");
        setClaimToken(null);
        setCopiedToken(false);

        window.setTimeout(() => {
            const suffix = Math.random().toString(36).slice(2, 10).toUpperCase();
            setClaimToken(`${QUICK_LAUNCH_MOCK_TOKEN_SEED}-${suffix}`);
            setQuickLaunchStatus("success");
        }, 1800);
    };

    const copyClaimToken = async () => {
        if (!claimToken) return;
        await navigator.clipboard.writeText(claimToken);
        setCopiedToken(true);
        window.setTimeout(() => setCopiedToken(false), 1200);
    };

    const triggerQuickLaunchButtonSpin = () => {
        setQuickLaunchButtonTurns((prev) => prev + 1);
    };

    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r px-0">
                {/* Channels Bar - Pastel */}
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

                {/* Main Hero Content */}
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="border-border border-b bg-lavender/30"
                >
                    <div className="grid lg:grid-cols-[1fr_420px]">
                        {/* Left Column - Content */}
                        <div className="flex min-h-full flex-col border-border px-6 pt-16 lg:border-r lg:px-12 lg:pt-24">
                            {/* Eyebrow with sparkle */}
                            <div className="flex items-center gap-2 mb-6">
                                <Sparkles className="size-4 text-primary" />
                                <p className="text-primary text-sm font-medium uppercase tracking-wider">
                                    verification infrastructure for base
                                </p>
                            </div>

                            {/* Chat-style prompt */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-8">
                                <div className="flex items-center gap-2 bg-sage/50 px-4 py-2 border border-border">
                                    <Image src="/icons/star-06.svg" alt="" width={20} height={20} />
                                    <span className="text-lg font-semibold text-foreground">
                                        @HeySigil
                                    </span>
                                </div>
                                <div className="h-8 overflow-hidden">
                                    <div
                                        className="transition-transform duration-500 ease-in-out"
                                        style={{ transform: `translateY(-${currentIndex * 32}px)` }}
                                    >
                                        {ROTATING_PROMPTS.map((prompt) => (
                                            <div
                                                key={`prompt-${prompt.slice(0, 10)}`}
                                                className="h-8 flex items-center text-muted-foreground text-lg"
                                            >
                                                {prompt}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Headline - Pastel */}
                            <h1 className="text-foreground text-3xl lg:text-4xl xl:text-5xl font-semibold mb-6 leading-tight lowercase">
                                the trust layer for
                                <br />
                                <span className="text-primary">the agentic economy</span>
                            </h1>

                            {/* Description */}
                            <p className="text-muted-foreground text-lg max-w-xl mb-8 leading-relaxed">
                                Verify real builders across five channels. Route capital
                                automatically. Enforce milestone accountability. No single platform
                                dependency.
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link href="/verify">
                                    <Button size="lg" className="w-full sm:w-auto gap-2">
                                        Stamp Your Sigil
                                        <ArrowRight className="size-4" />
                                    </Button>
                                </Link>
                                <Link href="/developers">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-full sm:w-auto"
                                    >
                                        Explore Protocol
                                    </Button>
                                </Link>
                            </div>

                            <div className="mt-8 -mx-6 flex flex-1 flex-col border-y border-border bg-[linear-gradient(180deg,hsl(var(--lavender)/0.2),hsl(var(--background)/0.85))] lg:-mx-12">
                                <div className="flex flex-col gap-3 border-border border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-12">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-[0.14em] text-primary">
                                            quick launch
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Launch instantly as unclaimed. Claim ownership later using a one-time token.
                                        </p>
                                    </div>
                                    <div className="w-full [perspective:900px] sm:w-auto">
                                        <motion.div
                                            animate={{ rotateX: quickLaunchButtonTurns * 360 }}
                                            transition={{ type: "spring", stiffness: 190, damping: 15, mass: 0.58 }}
                                        >
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsQuickLaunchOpen((prev) => !prev)}
                                                onMouseEnter={triggerQuickLaunchButtonSpin}
                                                onFocus={triggerQuickLaunchButtonSpin}
                                                className="w-full sm:w-auto border-primary/35 bg-lavender/85 hover:bg-lavender/92"
                                            >
                                                {isQuickLaunchOpen ? "Hide Quick Launch" : "Open Quick Launch"}
                                            </Button>
                                        </motion.div>
                                    </div>
                                </div>

                                {isQuickLaunchOpen ? (
                                    <form
                                        onSubmit={handleQuickLaunchSubmit}
                                        className="flex flex-1 flex-col bg-background/60 px-6 py-4 lg:px-12"
                                    >
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {QUICK_LAUNCH_MOCK_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.id}
                                                    type="button"
                                                    onClick={() => applyPreset(preset.id)}
                                                    className="border-border bg-sage/25 hover:bg-sage/40 border px-3 py-1.5 text-xs font-medium uppercase tracking-[0.12em] transition-colors"
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <label className="block">
                                                <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted-foreground">
                                                    Token Name
                                                </span>
                                                <input
                                                    value={quickLaunchName}
                                                    onChange={(event) => {
                                                        setQuickLaunchName(event.target.value);
                                                        resetQuickLaunch();
                                                    }}
                                                    placeholder="sigil: your project"
                                                    className="border-border bg-background/90 h-10 w-full border px-3 text-sm text-foreground outline-none focus:border-primary/60"
                                                    required
                                                />
                                            </label>

                                            <label className="block">
                                                <span className="mb-1 block text-xs uppercase tracking-[0.12em] text-muted-foreground">
                                                    Owner / Source
                                                </span>
                                                <input
                                                    value={quickLaunchOwnerSource}
                                                    onChange={(event) => {
                                                        setQuickLaunchOwnerSource(event.target.value);
                                                        resetQuickLaunch();
                                                    }}
                                                    placeholder="github.com/org/repo or agent://id"
                                                    className="border-border bg-background/90 h-10 w-full border px-3 text-sm text-foreground outline-none focus:border-primary/60"
                                                />
                                            </label>
                                        </div>

                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-xs text-muted-foreground">
                                                This mode launches immediately as <span className="font-medium text-foreground">unclaimed</span>.
                                            </p>
                                            <Button
                                                type="submit"
                                                disabled={quickLaunchStatus === "launching" || quickLaunchName.trim().length === 0}
                                                className="w-full sm:w-auto"
                                            >
                                                {quickLaunchStatus === "launching" ? "Launching..." : "Launch Unclaimed Token"}
                                            </Button>
                                        </div>

                                        {quickLaunchStatus === "success" && claimToken ? (
                                            <div className="mt-4 border-border border-t pt-4">
                                                <p className="text-xs uppercase tracking-[0.12em] text-primary">
                                                    One-Time Claim Token
                                                </p>
                                                <p className="mt-1 font-mono text-sm text-foreground break-all">
                                                    {claimToken}
                                                </p>
                                                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={() => void copyClaimToken()}
                                                        className="w-full sm:w-auto"
                                                    >
                                                        {copiedToken ? "Copied" : "Copy Token"}
                                                    </Button>
                                                    <span className="text-xs text-muted-foreground">
                                                        Save this now. It is shown once and used later to claim ownership.
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4 flex-1 bg-[linear-gradient(180deg,transparent,hsl(var(--sage)/0.08))]">
                                                <div className="text-xs text-muted-foreground">
                                                    Launching here skips verification and creates an unclaimed token.
                                                </div>
                                            </div>
                                        )}
                                    </form>
                                ) : (
                                    <div className="flex flex-1 flex-col justify-end border-border border-t bg-[linear-gradient(180deg,transparent,hsl(var(--sage)/0.08))] px-6 py-4 lg:px-12">
                                        <div className="text-xs text-muted-foreground">
                                            Open quick launch to create an unclaimed token and receive a one-time claim token.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Visual with Pixel Effect */}
                        <PixelCard
                            variant="sage"
                            className="hidden lg:flex flex-col bg-sage/30"
                            noFocus
                        >
                            {/* Sigil Visual - Full render stage */}
                            <div className="flex-1 border-border border-b relative z-10 overflow-hidden">
                                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_38%,hsl(var(--primary)/0.18),transparent_62%)]" />
                                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--sage)/0.14),transparent_40%,hsl(var(--cream)/0.12)_100%)]" />
                                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />

                                <div
                                    className="relative h-full min-h-[420px]"
                                    data-home-loader-stage="sigil-hero-stage"
                                >
                                    <div
                                        className="absolute transform-gpu origin-center"
                                        data-home-loader-target="sigil-hero-model"
                                        style={{
                                            top: `${HERO_MODEL_FRAME.centerY * 100}%`,
                                            left: `${HERO_MODEL_FRAME.centerX * 100}%`,
                                            width: `${HERO_MODEL_FRAME.widthScale * 100}%`,
                                            height: `${HERO_MODEL_FRAME.heightScale * 100}%`,
                                            transform: "translate(-50%, -50%)",
                                        }}
                                    >
                                        <ModelViewer
                                            {...HERO_MODEL_VIEWER}
                                            width="100%"
                                            height="100%"
                                            enableMouseParallax={false}
                                            enableHoverRotation={false}
                                            enableManualRotation
                                            enableManualZoom={false}
                                            fadeIn={false}
                                            autoRotate
                                            showLoader={false}
                                            showScreenshotButton={false}
                                        />
                                    </div>

                                    <div className="absolute top-5 left-5">
                                        <Badge className="bg-lavender/50 text-foreground border border-border text-[10px]">
                                            EAS on Base
                                        </Badge>
                                    </div>
                                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                        <Badge className="bg-cream/50 text-foreground border border-border text-[10px]">
                                            zkTLS
                                        </Badge>
                                        <Badge className="bg-sage/50 text-foreground border border-border text-[10px]">
                                            5 Channels
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            {/* Stats - Muted */}
                            <div className="relative z-10 flex divide-x divide-border bg-background/60 backdrop-blur-sm">
                                {HERO_STATS.map((stat) => (
                                    <div
                                        key={stat.label}
                                        className="flex min-h-[84px] flex-1 flex-col items-center justify-center gap-1 px-6 py-4 text-center"
                                    >
                                        <p className="text-2xl leading-none font-bold text-foreground">
                                            {stat.value}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground uppercase tracking-[0.14em]">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </PixelCard>
                    </div>
                </PixelCard>
            </div>
        </section>
    );
}
