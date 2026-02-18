"use client";

/**
 * Token Section
 *
 * Displays a stacked list of tokens with optional header.
 * Border-centric pastel design system.
 */

import type { TokenInfo } from "@/types";

import { TokenCard } from "./TokenCard";

interface TokenSectionProps {
    tokens: TokenInfo[];
    title?: string;
    showHeader?: boolean;
}

export function TokenSection({ tokens, title, showHeader = true }: TokenSectionProps) {
    if (tokens.length === 0) return null;

    return (
        <div className="bg-background">
            {showHeader && title && (
                <div className="flex items-center justify-between px-6 py-4 lg:px-12 border-border border-b">
                    <h2 className="text-lg font-semibold text-foreground lowercase">{title}</h2>
                    <span className="text-sm text-muted-foreground">{tokens.length} tokens</span>
                </div>
            )}
            <div className="divide-y divide-border border-border border-b">
                {tokens.map((t) => (
                    <TokenCard key={t.address} token={t} />
                ))}
            </div>
        </div>
    );
}
