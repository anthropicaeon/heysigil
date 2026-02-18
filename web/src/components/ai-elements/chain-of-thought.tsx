"use client";

/**
 * Chain of Thought Components
 *
 * Display agent reasoning steps with border-centric design.
 */

import { CheckCircle, ChevronDown, Circle, Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

interface ChainOfThoughtProps {
    children: ReactNode;
    defaultOpen?: boolean;
    className?: string;
}

export function ChainOfThought({ children, defaultOpen = false, className }: ChainOfThoughtProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className={cn("border border-border bg-secondary/20", className)}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors"
            >
                <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
                Agent Reasoning
            </button>
            {open && <div className="border-t border-border">{children}</div>}
        </div>
    );
}

interface ChainOfThoughtHeaderProps {
    children: ReactNode;
    className?: string;
}

export function ChainOfThoughtHeader({ children, className }: ChainOfThoughtHeaderProps) {
    return (
        <div
            className={cn(
                "px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider border-b border-border",
                className,
            )}
        >
            {children}
        </div>
    );
}

interface ChainOfThoughtContentProps {
    children: ReactNode;
    className?: string;
}

export function ChainOfThoughtContent({ children, className }: ChainOfThoughtContentProps) {
    return <div className={cn("divide-y divide-border", className)}>{children}</div>;
}

interface ChainOfThoughtStepProps {
    icon: React.ElementType;
    label: string;
    description: string;
    status: "complete" | "active" | "pending";
    children?: ReactNode;
    className?: string;
}

export function ChainOfThoughtStep({
    icon: Icon,
    label,
    description,
    status,
    children,
    className,
}: ChainOfThoughtStepProps) {
    const StatusIcon = status === "complete" ? CheckCircle : status === "active" ? Loader2 : Circle;

    return (
        <div className={cn("px-4 py-3", className)}>
            <div className="flex items-start gap-3">
                <div
                    className={cn(
                        "size-8 flex items-center justify-center border shrink-0",
                        status === "complete" && "bg-sage/30 border-sage text-primary",
                        status === "active" && "bg-primary/10 border-primary text-primary",
                        status === "pending" &&
                            "bg-secondary/30 border-border text-muted-foreground",
                    )}
                >
                    <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        <StatusIcon
                            className={cn(
                                "size-3",
                                status === "complete" && "text-primary",
                                status === "active" && "text-primary animate-spin",
                                status === "pending" && "text-muted-foreground",
                            )}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {description}
                    </p>
                    {children && <div className="mt-2">{children}</div>}
                </div>
            </div>
        </div>
    );
}

interface ChainOfThoughtSearchResultsProps {
    children: ReactNode;
    className?: string;
}

export function ChainOfThoughtSearchResults({
    children,
    className,
}: ChainOfThoughtSearchResultsProps) {
    return <div className={cn("flex gap-2 overflow-x-auto pb-1", className)}>{children}</div>;
}

interface ChainOfThoughtSearchResultProps {
    children: ReactNode;
    className?: string;
}

export function ChainOfThoughtSearchResult({
    children,
    className,
}: ChainOfThoughtSearchResultProps) {
    return (
        <div
            className={cn(
                "px-2 py-1 bg-secondary/30 border border-border text-xs shrink-0",
                className,
            )}
        >
            {children}
        </div>
    );
}
