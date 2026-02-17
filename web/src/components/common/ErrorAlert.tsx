/**
 * ErrorAlert Component
 *
 * Reusable error display with optional dismiss button.
 */

interface ErrorAlertProps {
    error: string;
    onDismiss?: () => void;
    className?: string;
}

export function ErrorAlert({ error, onDismiss, className = "result-box result-error" }: ErrorAlertProps) {
    return (
        <div className={className} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ color: "var(--error)", fontSize: "var(--text-sm)", margin: 0 }}>{error}</p>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss error"
                    style={{ background: "none", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "1.2em", padding: "0 var(--space-1)" }}
                >
                    ×
                </button>
            )}
        </div>
    );
}
