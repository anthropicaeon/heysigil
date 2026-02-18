"use client";

/**
 * Sources Components
 *
 * Display citation sources with border-centric design.
 */

import { ExternalLink, Link2 } from "lucide-react";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

interface SourcesProps {
    children: ReactNode;
    className?: string;
}

export function Sources({ children, className }: SourcesProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className={cn("", className)}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="text-xs text-primary hover:underline"
            >
                View sources
            </button>
            {open && children}
        </div>
    );
}

interface SourcesTriggerProps {
    count: number;
    className?: string;
}

export function SourcesTrigger({ count, className }: SourcesTriggerProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-1 px-6 py-2 lg:px-12 text-xs text-muted-foreground",
                className,
            )}
        >
            <Link2 className="size-3" />
            {count} source{count !== 1 ? "s" : ""}
        </div>
    );
}

interface SourcesContentProps {
    children: ReactNode;
    className?: string;
}

export function SourcesContent({ children, className }: SourcesContentProps) {
    return (
        <div className={cn("px-6 py-2 lg:px-12 border-t border-border bg-secondary/20", className)}>
            {children}
        </div>
    );
}

interface SourceProps {
    title?: string;
    href: string;
    className?: string;
}

export function Source({ href, className }: SourceProps) {
    const displayUrl = (() => {
        try {
            return new URL(href).hostname;
        } catch {
            return href;
        }
    })();

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "flex items-center gap-2 py-1 text-sm text-foreground hover:text-primary transition-colors",
                className,
            )}
        >
            <ExternalLink className="size-3 shrink-0" />
            <span className="truncate">{displayUrl}</span>
        </a>
    );
}
