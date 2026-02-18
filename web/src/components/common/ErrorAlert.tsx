"use client";

/**
 * ErrorAlert Component
 *
 * Reusable error display with optional dismiss button.
 * Adapted for www design aesthetic using Tailwind and shadcn patterns.
 */

import { AlertCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";

interface ErrorAlertProps {
    error: string;
    onDismiss?: () => void;
    className?: string;
}

export function ErrorAlert({ error, onDismiss, className }: ErrorAlertProps) {
    return (
        <div
            className={cn(
                "flex items-center justify-between gap-3 px-4 py-3 rounded-lg",
                "bg-destructive/10 border border-destructive/20",
                className,
            )}
        >
            <div className="flex items-center gap-2 min-w-0">
                <AlertCircle className="size-4 text-destructive shrink-0" />
                <p className="text-sm text-destructive truncate">{error}</p>
            </div>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss error"
                    className="text-destructive hover:text-destructive/80 transition-colors shrink-0"
                >
                    <X className="size-4" />
                </button>
            )}
        </div>
    );
}
