"use client";

/**
 * Inline Citation Components
 *
 * Display inline citations with carousel, border-centric design.
 */

import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { type ReactNode, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InlineCitationProps {
    children: ReactNode;
    className?: string;
}

export function InlineCitation({ children, className }: InlineCitationProps) {
    return <div className={cn("", className)}>{children}</div>;
}

interface InlineCitationCardProps {
    children: ReactNode;
    className?: string;
}

export function InlineCitationCard({ children, className }: InlineCitationCardProps) {
    return <div className={cn("border border-border bg-background", className)}>{children}</div>;
}

interface InlineCitationCardTriggerProps {
    sources: string[];
    className?: string;
}

export function InlineCitationCardTrigger({ sources, className }: InlineCitationCardTriggerProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/20",
                className,
            )}
        >
            <span className="text-xs text-muted-foreground">
                {sources.length} source{sources.length !== 1 ? "s" : ""}
            </span>
        </div>
    );
}

interface InlineCitationCardBodyProps {
    children: ReactNode;
    className?: string;
}

export function InlineCitationCardBody({ children, className }: InlineCitationCardBodyProps) {
    return <div className={cn("p-4", className)}>{children}</div>;
}

interface InlineCitationCarouselProps {
    children: ReactNode;
    className?: string;
}

export function InlineCitationCarousel({ children, className }: InlineCitationCarouselProps) {
    return <div className={cn("", className)}>{children}</div>;
}

interface InlineCitationCarouselHeaderProps {
    children: ReactNode;
    className?: string;
}

export function InlineCitationCarouselHeader({
    children,
    className,
}: InlineCitationCarouselHeaderProps) {
    return <div className={cn("flex items-center gap-2 mb-3", className)}>{children}</div>;
}

interface InlineCitationCarouselContentProps {
    children: ReactNode;
    className?: string;
}

export function InlineCitationCarouselContent({
    children,
    className,
}: InlineCitationCarouselContentProps) {
    const [index, setIndex] = useState(0);
    const items = Array.isArray(children) ? children : [children];

    return (
        <InlineCitationCarouselContext.Provider value={{ index, setIndex, total: items.length }}>
            <div className={cn("", className)}>{items[index]}</div>
        </InlineCitationCarouselContext.Provider>
    );
}

// Context for carousel state
import { createContext, useContext } from "react";

const InlineCitationCarouselContext = createContext<{
    index: number;
    setIndex: (i: number) => void;
    total: number;
}>({ index: 0, setIndex: () => {}, total: 0 });

export function InlineCitationCarouselPrev() {
    const { index, setIndex } = useContext(InlineCitationCarouselContext);
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            className="size-7 p-0"
        >
            <ChevronLeft className="size-4" />
        </Button>
    );
}

export function InlineCitationCarouselNext() {
    const { index, setIndex, total } = useContext(InlineCitationCarouselContext);
    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => setIndex(Math.min(total - 1, index + 1))}
            disabled={index >= total - 1}
            className="size-7 p-0"
        >
            <ChevronRight className="size-4" />
        </Button>
    );
}

export function InlineCitationCarouselIndex() {
    const { index, total } = useContext(InlineCitationCarouselContext);
    return (
        <span className="text-xs text-muted-foreground ml-auto">
            {index + 1} / {total}
        </span>
    );
}

interface InlineCitationCarouselItemProps {
    children: ReactNode;
    className?: string;
}

export function InlineCitationCarouselItem({
    children,
    className,
}: InlineCitationCarouselItemProps) {
    return <div className={cn("", className)}>{children}</div>;
}

interface InlineCitationSourceProps {
    title: string;
    url: string;
    description?: string;
    className?: string;
}

export function InlineCitationSource({
    title,
    url,
    description,
    className,
}: InlineCitationSourceProps) {
    return (
        <div className={cn("", className)}>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
                {title}
                <ExternalLink className="size-3" />
            </a>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
    );
}

interface InlineCitationQuoteProps {
    children: ReactNode;
    className?: string;
}

export function InlineCitationQuote({ children, className }: InlineCitationQuoteProps) {
    return (
        <blockquote
            className={cn(
                "mt-2 pl-3 border-l-2 border-primary/30 text-sm text-muted-foreground italic",
                className,
            )}
        >
            {children}
        </blockquote>
    );
}
