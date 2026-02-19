"use client";

/**
 * Message Components
 *
 * Display chat messages with border-centric design.
 */

import { Bot } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

interface MessageProps {
    children: ReactNode;
    from: "user" | "assistant";
    source?: "user" | "assistant" | "agent";
    className?: string;
}

export function Message({ children, from, source, className }: MessageProps) {
    const resolvedSource = source ?? from;
    const isAgentFeed = resolvedSource === "agent";
    const isUserRow = !isAgentFeed && from === "user";
    const rowClass = isAgentFeed
        ? "bg-sage/10"
        : isUserRow
          ? "bg-lavender/10"
          : "bg-background";
    const label = isAgentFeed
        ? from === "assistant"
            ? "Agent"
            : "Agent Event"
        : from === "assistant"
          ? "Sigil"
          : "You";
    const subLabel = isAgentFeed ? "network feed" : from === "assistant" ? "assistant" : "user";

    if (isUserRow) {
        return (
            <PixelCard
                variant="lavender"
                active
                centerFade
                noFocus
                className={cn("bg-lavender/30", className)}
            >
                <div className="px-6 py-4 lg:px-12">
                    <div className="max-w-3xl">
                        <div className="mb-2 flex items-center gap-2">
                            <div className="flex size-5 items-center justify-center border border-border bg-background/80">
                                <span className="text-[10px] font-semibold text-foreground">Y</span>
                            </div>
                            <span className="text-sm font-medium text-foreground">{label}</span>
                            <span className="inline-flex items-center border border-border bg-background/70 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                {subLabel}
                            </span>
                        </div>
                        <div className="text-sm leading-relaxed text-foreground">{children}</div>
                    </div>
                </div>
            </PixelCard>
        );
    }

    return (
        <div className={cn("px-6 py-4 lg:px-12", rowClass, className)}>
            <div className="max-w-3xl">
                <div className="mb-2 flex items-center gap-2">
                    {isAgentFeed ? (
                        <div className="flex size-5 items-center justify-center border border-border bg-background/80">
                            <Bot className="size-3 text-primary" />
                        </div>
                    ) : from === "assistant" ? (
                        <>
                            <Image src="/logo-sage.png" alt="Sigil" width={20} height={20} />
                            <span className="text-sm font-medium text-primary">{label}</span>
                        </>
                    ) : (
                        <div className="flex size-5 items-center justify-center border border-border bg-background/80">
                            <span className="text-[10px] font-semibold text-foreground">Y</span>
                        </div>
                    )}
                    {isAgentFeed ? (
                        <span className="text-sm font-medium text-foreground">{label}</span>
                    ) : null}
                    <span className="inline-flex items-center border border-border bg-background/70 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        {subLabel}
                    </span>
                    {isAgentFeed ? (
                        <span className="inline-flex items-center border border-border bg-lavender/35 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                            live
                        </span>
                    ) : null}
                </div>
                <div className="border border-border bg-background/70 px-3 py-2.5">{children}</div>
            </div>
        </div>
    );
}

interface MessageContentProps {
    children: ReactNode;
    className?: string;
}

export function MessageContent({ children, className }: MessageContentProps) {
    return <div className={cn("text-sm leading-relaxed text-foreground", className)}>{children}</div>;
}
