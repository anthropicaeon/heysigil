"use client";

/**
 * Suggestion Components
 *
 * Quick action chips for common prompts, border-centric design.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SuggestionsProps {
    children: ReactNode;
    className?: string;
}

export function Suggestions({ children, className }: SuggestionsProps) {
    return <div className={cn("flex flex-wrap gap-2.5", className)}>{children}</div>;
}

interface SuggestionProps {
    suggestion: string;
    onClick: () => void;
    className?: string;
}

export function Suggestion({ suggestion, onClick, className }: SuggestionProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "border border-border bg-background/75 px-3 py-2 text-xs text-foreground uppercase tracking-[0.11em]",
                "hover:bg-lavender/30 hover:border-primary/30 transition-colors",
                className,
            )}
        >
            {suggestion}
        </button>
    );
}
