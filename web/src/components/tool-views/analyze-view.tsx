"use client";

/**
 * Analyze View
 *
 * Display analysis results with border-centric design.
 */

import { BrainIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface AnalyzeViewProps {
    invocation: {
        state: string;
        input?: { problem?: string; approach?: string };
        output?: {
            state?: string;
            problem?: string;
            approach?: string;
            breakdown?: string;
            components?: string[];
        };
        errorText?: string;
    };
    className?: string;
}

export default function AnalyzeView({ invocation, className }: AnalyzeViewProps) {
    const problem = invocation.input?.problem || "Unknown problem";
    const approach = invocation.input?.approach || "systematic";

    switch (invocation.state) {
        case "input-streaming":
            return (
                <div className={cn("text-sm text-muted-foreground", className)}>
                    Preparing analysis...
                </div>
            );

        case "input-available":
            return (
                <div className={cn("text-sm text-muted-foreground", className)}>
                    Analyzing: <strong className="text-foreground">{problem}</strong> using{" "}
                    <strong className="text-foreground">{approach}</strong> approach
                </div>
            );

        case "output-available":
            if (invocation.output?.state === "loading") {
                return (
                    <div className={cn("text-sm text-muted-foreground", className)}>
                        Analyzing: <strong className="text-foreground">{problem}</strong>...
                    </div>
                );
            }

            const output = invocation.output;

            return (
                <div className={cn("space-y-3", className)}>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <BrainIcon className="size-4 text-purple-600" />
                        Analysis Results
                    </div>

                    <div className="border border-border divide-y divide-border bg-purple-50/30">
                        <div className="px-4 py-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Problem
                            </p>
                            <p className="text-sm text-foreground">{output?.problem}</p>
                        </div>

                        <div className="px-4 py-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Approach
                            </p>
                            <p className="text-sm text-foreground capitalize">{output?.approach}</p>
                        </div>

                        <div className="px-4 py-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Breakdown
                            </p>
                            <p className="text-sm text-foreground">{output?.breakdown}</p>
                        </div>

                        {output?.components && output.components.length > 0 && (
                            <div className="px-4 py-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                    Components
                                </p>
                                <ul className="space-y-1">
                                    {output.components.map((component, index) => (
                                        <li
                                            key={index}
                                            className="text-sm text-foreground flex items-start gap-2"
                                        >
                                            <span className="text-primary">•</span>
                                            {component}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            );

        case "output-error":
            return (
                <div className={cn("text-sm text-destructive", className)}>
                    Error: {invocation.errorText}
                </div>
            );

        default:
            return null;
    }
}
