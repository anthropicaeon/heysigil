/**
 * LoadingButton Component
 *
 * Button with built-in loading state and spinner.
 */

import type { ReactNode, CSSProperties } from "react";

interface LoadingButtonProps {
    loading: boolean;
    disabled?: boolean;
    onClick: () => void;
    children: ReactNode;
    loadingText?: string;
    className?: string;
    style?: CSSProperties;
}

export function LoadingButton({
    loading,
    disabled,
    onClick,
    children,
    loadingText = "Loading...",
    className = "btn-primary",
    style,
}: LoadingButtonProps) {
    return (
        <button
            type="button"
            className={className}
            disabled={disabled || loading}
            onClick={onClick}
            style={style}
        >
            {loading ? (
                <>
                    <span className="spinner" style={{ width: 14, height: 14, marginRight: "var(--space-2)" }} />
                    {loadingText}
                </>
            ) : (
                children
            )}
        </button>
    );
}
