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
    return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
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
                "px-3 py-1.5 text-xs border border-border bg-secondary/30 text-foreground",
                "hover:bg-secondary/60 hover:border-primary/30 transition-colors",
                className,
            )}
        >
            {suggestion}
        </button>
    );
}
