"use client";

import type { ReactNode, CSSProperties } from "react";
import Link from "next/link";

interface EmptyStateAction {
    label: string;
    onClick?: () => void;
    href?: string;
    disabled?: boolean;
    loading?: boolean;
    variant?: "primary" | "secondary";
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
    /** Container class. Default: "portfolio-empty" */
    className?: string;
    /** Use raw element classes (for profile-empty-section pattern) */
    useRawClasses?: boolean;
    style?: CSSProperties;
}

/**
 * Reusable empty state component with progressive disclosure support.
 *
 * Features:
 * - Icon, title, and description
 * - Primary and secondary actions
 * - Step hints for onboarding context
 * - Two CSS patterns supported:
 *   - Default: Uses portfolio-empty-* classes
 *   - useRawClasses: Uses plain elements (for profile-empty-section pattern)
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    secondaryAction,
    stepHint,
    className = "portfolio-empty",
    useRawClasses = false,
    style,
}: EmptyStateProps) {
    const iconClass = useRawClasses ? "empty-icon" : "portfolio-empty-icon";
    const titleClass = useRawClasses ? undefined : "portfolio-empty-title";
    const descClass = useRawClasses ? undefined : "portfolio-empty-desc";

    const renderAction = (act: EmptyStateAction, isPrimary: boolean) => {
        const btnClass = isPrimary ? "btn-primary" : "btn-secondary";
        const btnStyle: CSSProperties = isPrimary
            ? { width: "100%", marginTop: "var(--space-3)" }
            : { marginTop: "var(--space-2)" };

        const content = act.loading ? (
            <span className="spinner" style={{ width: 14, height: 14 }} />
        ) : (
            act.label
        );

        if (act.href) {
            return (
                <Link
                    href={act.href}
                    className={`${btnClass} btn-sm`}
                    style={btnStyle}
                >
                    {content}
                </Link>
            );
        }

        return (
            <button
                type="button"
                className={`${btnClass} btn-sm`}
                onClick={act.onClick}
                disabled={act.disabled}
                style={btnStyle}
            >
                {content}
            </button>
        );
    };

    return (
        <div className={className} style={style}>
            {/* Progressive disclosure: step hint */}
            {stepHint && (
                <span className="empty-step-hint">{stepHint}</span>
            )}
            {icon && <div className={iconClass}>{icon}</div>}
            <p className={titleClass}>{title}</p>
            {description && <p className={descClass}>{description}</p>}
            {action && renderAction(action, true)}
            {secondaryAction && renderAction(secondaryAction, false)}
        </div>
    );
}
