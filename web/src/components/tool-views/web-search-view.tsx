"use client";

/**
 * Web Search View
 *
 * Display web search results with border-centric design.
 */

import { ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";

interface WebSearchResult {
    title: string;
    url: string;
    snippet?: string;
    source?: string;
}

interface WebSearchViewProps {
    invocation: {
        state: string;
        input?: { query?: string };
        output?: { state?: string; results?: WebSearchResult[] };
        errorText?: string;
    };
    className?: string;
}

export default function WebSearchView({ invocation, className }: WebSearchViewProps) {
    const query = invocation.input?.query || "Unknown query";

    switch (invocation.state) {
        case "input-streaming":
            return (
                <div className={cn("text-sm text-muted-foreground", className)}>
                    Preparing search query...
                </div>
            );

        case "input-available":
            return (
                <div className={cn("text-sm text-muted-foreground", className)}>
                    Searching the web for: <strong className="text-foreground">{query}</strong>
                </div>
            );

        case "output-available":
            if (invocation.output?.state === "loading") {
                return (
                    <div className={cn("text-sm text-muted-foreground", className)}>
                        Searching the web for: <strong className="text-foreground">{query}</strong>
                        ...
                    </div>
                );
            }

            const results = invocation.output?.results || [];

            return (
                <div className={cn("space-y-3", className)}>
                    <div className="text-sm text-muted-foreground">
                        Found {results.length} result{results.length !== 1 ? "s" : ""} for:{" "}
                        <strong className="text-foreground">{query}</strong>
                    </div>
                    <div className="divide-y divide-border border border-border">
                        {results.map((result, index) => (
                            <div
                                key={index}
                                className="px-4 py-3 hover:bg-secondary/20 transition-colors"
                            >
                                <a
                                    href={result.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                                >
                                    {result.title}
                                    <ExternalLink className="size-3 shrink-0" />
                                </a>
                                {result.source && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {result.source}
                                    </p>
                                )}
                                {result.snippet && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {result.snippet}
                                    </p>
                                )}
                            </div>
                        ))}
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
