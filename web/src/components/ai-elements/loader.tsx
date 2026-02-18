"use client";

/**
 * Loader Component
 *
 * Animated loading indicator with border-centric design.
 */

import { cn } from "@/lib/utils";

interface LoaderProps {
    className?: string;
}

export function Loader({ className }: LoaderProps) {
    return (
        <div className={cn("flex items-center gap-1", className)}>
            <span
                className="size-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: "0ms" }}
            />
            <span
                className="size-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: "150ms" }}
            />
            <span
                className="size-2 rounded-full bg-primary animate-bounce"
                style={{ animationDelay: "300ms" }}
            />
        </div>
    );
}
