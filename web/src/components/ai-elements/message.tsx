"use client";

/**
 * Message Components
 *
 * Display chat messages with border-centric design.
 */

import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MessageProps {
    children: ReactNode;
    from: "user" | "assistant";
    className?: string;
}

export function Message({ children, from, className }: MessageProps) {
    return (
        <div
            className={cn(
                "px-6 py-4 lg:px-12",
                from === "user" ? "bg-primary/5" : "bg-background",
                className,
            )}
        >
            <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                    {from === "assistant" ? (
                        <>
                            <Image src="/logo-sage.png" alt="Sigil" width={20} height={20} />
                            <span className="text-sm font-medium text-primary">Sigil</span>
                        </>
                    ) : (
                        <span className="text-sm font-medium text-foreground">You</span>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}

interface MessageContentProps {
    children: ReactNode;
    className?: string;
}

export function MessageContent({ children, className }: MessageContentProps) {
    return (
        <div className={cn("text-sm leading-relaxed text-foreground", className)}>{children}</div>
    );
}
