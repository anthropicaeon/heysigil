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
                "flex flex-col items-center justify-center py-12 px-6 text-center",
                className,
            )}
        >
            {/* Progressive disclosure: step hint */}
            {stepHint && (
                <span className="text-xs font-medium text-primary uppercase tracking-wider mb-4">
                    {stepHint}
                </span>
            )}

            {icon && (
                <div className="size-16 rounded-full bg-lavender flex items-center justify-center mb-4 text-primary">
                    {icon}
                </div>
            )}

            <p className="text-lg font-semibold text-foreground mb-2">{title}</p>

            {description && (
                <p className="text-sm text-muted-foreground max-w-xs mb-6">{description}</p>
            )}

            {action && <div className="w-full max-w-xs">{renderAction(action, true)}</div>}

            {secondaryAction && <div className="mt-3">{renderAction(secondaryAction, false)}</div>}
        </div>
    );
}
