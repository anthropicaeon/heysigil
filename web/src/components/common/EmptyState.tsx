"use client";

/**
 * EmptyState Component
 *
 * Reusable empty state component with progressive disclosure support.
 * Adapted for www design aesthetic using Tailwind and shadcn patterns.
 */

import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
    label: string;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    loading?: boolean;
    variant?: "default" | "secondary" | "outline" | "ghost";
}

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    /** Primary action button */
    action?: EmptyStateAction;
    /** Secondary action (e.g., "Learn more") */
    secondaryAction?: EmptyStateAction;
    /** Progressive disclosure: Show step context */
    stepHint?: string;
    /** Container class */
    className?: string;
}

/**
 * Reusable empty state component with progressive disclosure support.
 *
 * Features:
 * - Icon, title, and description
 * - Primary and secondary actions
 * - Step hints for onboarding context
 * - Uses shadcn Button and Tailwind styling
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    secondaryAction,
    stepHint,
    className,
}: EmptyStateProps) {
    const renderAction = (act: EmptyStateAction, isPrimary: boolean) => {
        const variant = act.variant ?? (isPrimary ? "default" : "outline");

        const content = act.loading ? (
            <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Loading...
            </>
        ) : (
            act.label
        );

        if (act.href) {
            return (
                <Link href={act.href} className={isPrimary ? "w-full" : ""}>
                    <Button
                        variant={variant}
                        size="sm"
                        className={cn(isPrimary && "w-full")}
                        disabled={act.disabled}
                    >
                        {content}
                    </Button>
                </Link>
            );
        }

        return (
            <Button
                variant={variant}
                size="sm"
                onClick={act.onClick}
                disabled={act.disabled || act.loading}
                className={cn(isPrimary && "w-full")}
            >
                {content}
            </Button>
        );
    };

    return (
        <div
            className={cn(
                "flex flex-col px-4 py-6",
                className,
            )}
        >
            {/* Progressive disclosure: step hint */}
            {stepHint && (
                <span className="text-xs font-medium text-primary uppercase tracking-wider mb-3">
                    {stepHint}
                </span>
            )}

            {/* Header with icon */}
            <div className="flex items-start gap-3 mb-4">
                {icon && (
                    <div className="size-12 bg-lavender/50 border border-border flex items-center justify-center shrink-0 text-primary">
                        {icon}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
                    )}
                </div>
            </div>

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="border-t border-border pt-4 space-y-2">
                    {action && <div className="w-full">{renderAction(action, true)}</div>}
                    {secondaryAction && <div>{renderAction(secondaryAction, false)}</div>}
                </div>
            )}
        </div>
    );
}
