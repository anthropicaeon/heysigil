"use client";

/**
 * Reasoning Components
 *
 * Display AI reasoning process with border-centric design.
 */

import { BrainIcon, ChevronDown } from "lucide-react";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

import { Loader } from "./loader";

interface ReasoningProps {
    children: ReactNode;
    isStreaming?: boolean;
    className?: string;
}

export function Reasoning({ children, isStreaming, className }: ReasoningProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className={cn("border border-border bg-lavender/18", className)}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-lavender/32 transition-colors"
            >
                <BrainIcon className="size-4 text-primary" />
                <span className="font-medium">Thinking</span>
                {isStreaming && <Loader className="ml-2" />}
                <ChevronDown
                    className={cn("size-4 ml-auto transition-transform", open && "rotate-180")}
                />
            </button>
            {open && <div className="border-t border-border">{children}</div>}
        </div>
    );
}

interface ReasoningTriggerProps {
    className?: string;
}

export function ReasoningTrigger({ className }: ReasoningTriggerProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground",
                className,
            )}
        >
            <BrainIcon className="size-3" />
            View reasoning process
        </div>
    );
}

interface ReasoningContentProps {
    children: ReactNode;
    className?: string;
}

export function ReasoningContent({ children, className }: ReasoningContentProps) {
    return (
        <div className={cn("px-4 py-3 text-sm text-foreground whitespace-pre-wrap", className)}>
            {children}
        </div>
    );
}
