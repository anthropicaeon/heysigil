"use client";

/**
 * Decide View
 *
 * Display decision results with border-centric design.
 */

import { CheckCircle, ScaleIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface Evaluation {
    option: string;
    score: number;
    reasoning: string;
}

interface DecideViewProps {
    invocation: {
        state: string;
        input?: { options?: string[]; criteria?: string[]; context?: string };
        output?: {
            state?: string;
            context?: string;
            decision?: string;
            reasoning?: string;
            evaluation?: Evaluation[];
        };
        errorText?: string;
    };
    className?: string;
}

export default function DecideView({ invocation, className }: DecideViewProps) {
    const options = invocation.input?.options || [];
    const criteria = invocation.input?.criteria || [];

    switch (invocation.state) {
        case "input-streaming":
            return (
                <div className={cn("text-sm text-muted-foreground", className)}>
                    Preparing decision analysis...
                </div>
            );

        case "input-available":
            return (
                <div className={cn("text-sm text-muted-foreground", className)}>
                    Evaluating {options.length} options based on:{" "}
                    <strong className="text-foreground">{criteria.join(", ")}</strong>
                </div>
            );

        case "output-available": {
            if (invocation.output?.state === "loading") {
                return (
                    <div className={cn("text-sm text-muted-foreground", className)}>
                        Evaluating options...
                    </div>
                );
            }

            const output = invocation.output;

            return (
                <div className={cn("space-y-3", className)}>
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <ScaleIcon className="size-4 text-primary" />
                        Decision Analysis
                    </div>

                    <div className="border border-border divide-y divide-border bg-cream/35">
                        <div className="px-4 py-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Context
                            </p>
                            <p className="text-sm text-foreground">{output?.context}</p>
                        </div>

                        <div className="px-4 py-3 bg-sage/25">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Decision
                            </p>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="size-4 text-primary" />
                                <p className="text-sm font-medium text-primary">
                                    {output?.decision}
                                </p>
                            </div>
                        </div>

                        <div className="px-4 py-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Reasoning
                            </p>
                            <p className="text-sm text-foreground">{output?.reasoning}</p>
                        </div>

                        {output?.evaluation && output.evaluation.length > 0 && (
                            <div className="px-4 py-3">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                    Evaluation
                                </p>
                                <div className="space-y-2">
                                    {output.evaluation.map((evaluation, index) => (
                                        <div
                                            key={index}
                                            className="px-3 py-2 border border-border bg-background"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-foreground">
                                                    {evaluation.option}
                                                </span>
                                                <span className="text-xs font-medium text-primary">
                                                    Score: {evaluation.score}/10
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {evaluation.reasoning}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

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
