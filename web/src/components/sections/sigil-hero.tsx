"use client";

import { ArrowRight } from "lucide-react";
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
    { name: "GitHub", method: "OAuth" },
    { name: "X", method: "zkTLS" },
    { name: "Facebook", method: "OAuth" },
    { name: "Instagram", method: "OAuth" },
    { name: "Domain", method: "DNS" },
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
                {/* Channels Bar */}
                <div className="flex flex-col sm:flex-row bg-background border-border border-b">
                    {CHANNELS.map((channel) => (
                        <div
                            key={channel.name}
                            className={cn(
                                "flex-1 px-4 py-3 lg:px-6 lg:py-4 flex items-center justify-center gap-2",
                                "border-border border-b sm:border-b-0 sm:border-r sm:last:border-r-0",
                            )}
                        >
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
                    <div className="grid lg:grid-cols-[1fr_400px]">
                        {/* Left Column - Content */}
                        <div className="px-6 py-16 lg:px-12 lg:py-24 border-border lg:border-r">
                            {/* Eyebrow */}
                            <p className="text-primary text-sm font-medium uppercase tracking-wider mb-6">
                                verification infrastructure for base
                            </p>

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

                            {/* Headline */}
                            <h1 className="text-foreground text-3xl lg:text-4xl xl:text-5xl font-semibold mb-6 leading-tight lowercase">
                                the trust layer for
                                <br />
                                the agentic economy
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
                                    <Button size="lg" className="w-full sm:w-auto">
                                        Stamp Your Sigil
                                        <ArrowRight className="ml-2 size-4" />
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
                            {/* Sigil Visual */}
                            <div className="flex-1 flex items-center justify-center p-8 border-border border-b relative z-10">
                                <div className="relative">
                                    <div className="size-48 bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border">
                                        <div className="size-32 bg-primary/10 flex items-center justify-center border border-border">
                                            <Image
                                                src="/logo-sage.png"
                                                alt="Sigil"
                                                width={80}
                                                height={80}
                                            />
                                        </div>
                                    </div>
                                    {/* Badges */}
                                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background text-foreground border border-border shadow-sm">
                                        EAS on Base
                                    </Badge>
                                    <Badge className="absolute top-1/2 -right-6 -translate-y-1/2 bg-background text-foreground border border-border shadow-sm">
                                        zkTLS
                                    </Badge>
                                    <Badge className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-background text-foreground border border-border shadow-sm">
                                        5 Channels
                                    </Badge>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 relative z-10 bg-background/60 backdrop-blur-sm">
                                <div className="px-6 py-4 border-border border-r text-center">
                                    <p className="text-2xl font-bold text-primary">5</p>
                                    <p className="text-xs text-muted-foreground uppercase">
                                        Channels
                                    </p>
                                </div>
                                <div className="px-6 py-4 text-center">
                                    <p className="text-2xl font-bold text-primary">Base</p>
                                    <p className="text-xs text-muted-foreground uppercase">
                                        Network
                                    </p>
                                </div>
                            </div>
                        </PixelCard>
                    </div>
                </PixelCard>
            </div>
        </section>
    );
}
