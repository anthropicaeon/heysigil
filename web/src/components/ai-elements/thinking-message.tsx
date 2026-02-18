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
        <div className={cn("px-6 py-4 lg:px-12 bg-background", className)}>
            <div className="max-w-2xl">
                {/* Header - matches Message component */}
                <div className="flex items-center gap-2 mb-2">
                    <Image src="/logo-sage.png" alt="Sigil" width={20} height={20} />
                    <span className="text-sm font-medium text-primary">Sigil</span>
                    <Loader2Icon className="size-3.5 text-muted-foreground animate-spin ml-1" />
                </div>

                {/* Content */}
                <div className="text-sm leading-relaxed text-foreground">
                    {/* Status message with dots */}
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
                        <span className="lowercase">{statusMessage}</span>
                        <ThinkingDots />
                    </div>

                    {/* Skeleton lines */}
                    <div className="space-y-2">
                        <div className="h-3.5 bg-border/40 animate-pulse w-full max-w-md" />
                        <div className="h-3.5 bg-border/40 animate-pulse w-4/5 max-w-sm" />
                        <div className="h-3.5 bg-border/40 animate-pulse w-3/5 max-w-xs" />
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
