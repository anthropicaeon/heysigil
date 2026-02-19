"use client";

/**
 * Thinking Message Component
 *
 * Shows AI typing/processing indicator in the conversation.
 * Matches the Message component styling for visual consistency.
 */

import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

interface ThinkingMessageProps {
    status: "submitted" | "streaming";
    className?: string;
}

const STATUS_MESSAGES = {
    submitted: ["connecting", "preparing"],
    streaming: ["thinking", "processing", "generating"],
} as const;

export function ThinkingMessage({ status, className }: ThinkingMessageProps) {
    const [messageIndex, setMessageIndex] = useState(0);
    const messages = STATUS_MESSAGES[status];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [messages.length]);

    const statusMessage = messages[messageIndex];

    return (
        <div className={cn("bg-background px-6 py-4 lg:px-12", className)}>
            <div className="max-w-3xl">
                <div className="mb-2 flex items-center gap-2">
                    <Image src="/logo-sage.png" alt="Sigil" width={20} height={20} />
                    <span className="text-sm font-medium text-primary">Sigil</span>
                    <span className="inline-flex items-center border border-border bg-background/70 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        assistant
                    </span>
                    <Loader2Icon className="size-3.5 text-muted-foreground animate-spin ml-1" />
                </div>
                <div className="border border-border bg-background/70 px-3 py-2.5 text-sm leading-relaxed text-foreground">
                    <div className="mb-3 flex items-center gap-1.5 text-muted-foreground">
                        <span className="lowercase">{statusMessage}</span>
                        <ThinkingDots />
                    </div>
                    <div className="space-y-2">
                        <div className="h-3.5 w-full max-w-md animate-pulse bg-border/45" />
                        <div className="h-3.5 w-4/5 max-w-sm animate-pulse bg-border/45" />
                        <div className="h-3.5 w-3/5 max-w-xs animate-pulse bg-border/45" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ThinkingDots() {
    return (
        <span className="inline-flex gap-0.5">
            <span
                className="size-1 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "0ms", animationDuration: "1s" }}
            />
            <span
                className="size-1 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "200ms", animationDuration: "1s" }}
            />
            <span
                className="size-1 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "400ms", animationDuration: "1s" }}
            />
        </span>
    );
}
