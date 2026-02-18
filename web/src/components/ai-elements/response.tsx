"use client";

/**
 * Response Component
 *
 * Renders markdown-like content with proper formatting.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ResponseProps {
    children: ReactNode;
    className?: string;
}

export function Response({ children, className }: ResponseProps) {
    return (
        <div className={cn("prose prose-sm max-w-none text-foreground", className)}>{children}</div>
    );
}
