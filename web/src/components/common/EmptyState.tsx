"use client";

import type { ReactNode, CSSProperties } from "react";

interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
        disabled?: boolean;
        loading?: boolean;
    };
    /** Container class. Default: "portfolio-empty" */
    className?: string;
    /** Use raw element classes (for profile-empty-section pattern) */
    useRawClasses?: boolean;
    style?: CSSProperties;
}

/**
 * Reusable empty state component with icon, title, description, and optional action.
 *
 * Two CSS patterns supported:
 * - Default: Uses portfolio-empty-* classes
 * - useRawClasses: Uses plain elements (for profile-empty-section pattern)
 */
export function EmptyState({
    icon,
    title,
    description,
    action,
    className = "portfolio-empty",
    useRawClasses = false,
    style,
}: EmptyStateProps) {
    const iconClass = useRawClasses ? "empty-icon" : "portfolio-empty-icon";
    const titleClass = useRawClasses ? undefined : "portfolio-empty-title";
    const descClass = useRawClasses ? undefined : "portfolio-empty-desc";

    return (
        <div className={className} style={style}>
            {icon && <div className={iconClass}>{icon}</div>}
            <p className={titleClass}>{title}</p>
            {description && <p className={descClass}>{description}</p>}
            {action && (
                <button
                    type="button"
                    className="btn-primary btn-sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    style={{ width: "100%", marginTop: "var(--space-3)" }}
                >
                    {action.loading ? (
                        <span className="spinner" style={{ width: 14, height: 14 }} />
                    ) : (
                        action.label
                    )}
                </button>
            )}
        </div>
    );
}
