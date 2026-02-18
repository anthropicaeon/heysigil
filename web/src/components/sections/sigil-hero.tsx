"use client";

import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
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

export default function SigilHero() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % ROTATING_PROMPTS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

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
                        <div className="px-6 py-16 lg:px-12 lg:py-24 border-border lg:border-r">
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
                        </div>

                        {/* Right Column - Visual with Pixel Effect */}
                        <PixelCard
                            variant="sage"
                            className="hidden lg:flex flex-col bg-sage/30"
                            noFocus
                        >
                            {/* Sigil Visual - Pastel */}
                            <div className="flex-1 flex items-center justify-center p-8 border-border border-b relative z-10">
                                <div className="relative">
                                    {/* Outer frame */}
                                    <div className="size-56 bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border">
                                        {/* Middle frame */}
                                        <div className="size-40 bg-cream/30 flex items-center justify-center border border-border">
                                            {/* Inner frame with logo */}
                                            <div className="size-28 bg-background flex items-center justify-center border border-border">
                                                <Image
                                                    src="/logo-sage.png"
                                                    alt="Sigil"
                                                    width={80}
                                                    height={80}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {/* Pastel Badges */}
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lavender/50 text-foreground border border-border">
                                        EAS on Base
                                    </Badge>
                                    <Badge className="absolute top-1/2 -right-8 -translate-y-1/2 bg-cream/50 text-foreground border border-border">
                                        zkTLS
                                    </Badge>
                                    <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-sage/50 text-foreground border border-border">
                                        5 Channels
                                    </Badge>
                                </div>
                            </div>

                            {/* Stats - Muted */}
                            <div className="flex divide-x divide-border relative z-10 bg-background/60 backdrop-blur-sm">
                                {HERO_STATS.map((stat) => (
                                    <div key={stat.label} className="flex-1 px-6 py-4 text-center">
                                        <p className="text-2xl font-bold text-foreground">
                                            {stat.value}
                                        </p>
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
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
