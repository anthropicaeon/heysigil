"use client";

/**
 * News Search View
 *
 * Display news search results with border-centric design.
 */

import { ExternalLink, NewspaperIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface NewsItem {
    title: string;
    url?: string;
    publishedAt?: string;
}

interface NewsSearchViewProps {
    invocation: {
        state: string;
        input?: { topic?: string };
        output?: { state?: string; items?: NewsItem[] };
        errorText?: string;
    };
    className?: string;
}

export default function NewsSearchView({ invocation, className }: NewsSearchViewProps) {
    const topic = invocation.input?.topic || "Unknown topic";

    switch (invocation.state) {
        case "input-streaming":
            return (
                <div className={cn("text-sm text-muted-foreground", className)}>
                    Preparing news search...
                </div>
            );

        case "input-available":
            return (
                <div className={cn("text-sm text-muted-foreground", className)}>
                    Searching news for: <strong className="text-foreground">{topic}</strong>
                </div>
            );

        case "output-available":
            if (invocation.output?.state === "loading") {
                return (
                    <div className={cn("text-sm text-muted-foreground", className)}>
                        Searching news for: <strong className="text-foreground">{topic}</strong>...
                    </div>
                );
            }

            const items = invocation.output?.items || [];

            return (
                <div className={cn("space-y-3", className)}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <NewspaperIcon className="size-4" />
                        Found {items.length} news item{items.length !== 1 ? "s" : ""} for:{" "}
                        <strong className="text-foreground">{topic}</strong>
                    </div>
                    <div className="divide-y divide-border border border-border bg-green-50/30">
                        {items.map((item, index) => (
                            <div
                                key={index}
                                className="px-4 py-3 hover:bg-green-50/50 transition-colors"
                            >
                                {item.url ? (
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm font-medium text-green-700 hover:underline"
                                    >
                                        {item.title}
                                        <ExternalLink className="size-3 shrink-0" />
                                    </a>
                                ) : (
                                    <span className="text-sm font-medium text-foreground">
                                        {item.title}
                                    </span>
                                )}
                                {item.publishedAt && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Published: {new Date(item.publishedAt).toLocaleDateString()}
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
