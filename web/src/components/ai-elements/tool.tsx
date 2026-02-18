"use client";

/**
 * Tool Components
 *
 * Display tool invocations with border-centric design.
 */

import {
    BrainIcon,
    CheckCircleIcon,
    ChevronDown,
    Loader2,
    NewspaperIcon,
    ScaleIcon,
    SearchIcon,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

const TOOL_CONFIG: Record<string, { icon: typeof SearchIcon; label: string; color: string }> = {
    "tool-websearch": {
        icon: SearchIcon,
        label: "Web Search",
        color: "bg-blue-50 border-blue-200 text-blue-800",
    },
    "tool-news": {
        icon: NewspaperIcon,
        label: "News Search",
        color: "bg-green-50 border-green-200 text-green-800",
    },
    "tool-analyze": {
        icon: BrainIcon,
        label: "Analysis",
        color: "bg-purple-50 border-purple-200 text-purple-800",
    },
    "tool-decide": {
        icon: ScaleIcon,
        label: "Decision",
        color: "bg-orange-50 border-orange-200 text-orange-800",
    },
    "tool-provideAnswer": {
        icon: CheckCircleIcon,
        label: "Final Answer",
        color: "bg-sage/30 border-sage text-primary",
    },
};

interface ToolProps {
    children: ReactNode;
    className?: string;
}

export function Tool({ children, className }: ToolProps) {
    return (
        <div className={cn("border border-border bg-background overflow-hidden", className)}>
            {children}
        </div>
    );
}

interface ToolHeaderProps {
    type: string;
    state?: "loading" | "ready" | string;
    className?: string;
}

export function ToolHeader({ type, state, className }: ToolHeaderProps) {
    const config = TOOL_CONFIG[type] || {
        icon: SearchIcon,
        label: type.replace("tool-", ""),
        color: "bg-secondary/30 border-border text-foreground",
    };
    const Icon = config.icon;
    const isLoading = state === "loading";

    return (
        <div
            className={cn(
                "flex items-center gap-2 px-4 py-2 border-b border-border",
                config.color,
                className,
            )}
        >
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
            <span className="text-sm font-medium">{config.label}</span>
            {isLoading && <span className="text-xs ml-auto opacity-70">Processing...</span>}
        </div>
    );
}

interface ToolContentProps {
    children: ReactNode;
    className?: string;
}

export function ToolContent({ children, className }: ToolContentProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={cn("", className)}>
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors border-b border-border"
            >
                <ChevronDown
                    className={cn("size-3 transition-transform", expanded && "rotate-180")}
                />
                {expanded ? "Hide details" : "Show details"}
            </button>
            {expanded && <div className="p-4">{children}</div>}
        </div>
    );
}

interface ToolInputProps {
    input: object;
    className?: string;
}

export function ToolInput({ input, className }: ToolInputProps) {
    return (
        <div className={cn("px-4 py-2 bg-secondary/20 border-b border-border", className)}>
            <p className="text-xs text-muted-foreground mb-1">Input:</p>
            <pre className="text-xs text-foreground overflow-x-auto">
                {JSON.stringify(input, null, 2)}
            </pre>
        </div>
    );
}

interface ToolOutputProps {
    output: unknown;
    className?: string;
}

export function ToolOutput({ output, className }: ToolOutputProps) {
    return (
        <div className={cn("px-4 py-2 bg-secondary/10", className)}>
            <p className="text-xs text-muted-foreground mb-1">Output:</p>
            <pre className="text-xs text-foreground overflow-x-auto">
                {JSON.stringify(output, null, 2)}
            </pre>
        </div>
    );
}
