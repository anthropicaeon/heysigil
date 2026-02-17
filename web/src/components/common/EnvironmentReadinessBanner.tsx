"use client";

import { useEnvironmentReadiness } from "@/hooks/useEnvironmentReadiness";

function icon(status: "ok" | "warn" | "error" | "checking"): string {
    if (status === "ok") return "OK";
    if (status === "warn") return "WARN";
    if (status === "error") return "ERR";
    return "...";
}

export function EnvironmentReadinessBanner() {
    const isDev = process.env.NODE_ENV !== "production";
    const { loading, checks } = useEnvironmentReadiness();

    if (!isDev) return null;
    if (!loading && checks.length > 0 && checks.every((c) => c.status === "ok")) return null;

    return (
        <div
            style={{
                margin: "var(--space-4) var(--space-6)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-4)",
                background: "var(--bg-tertiary)",
            }}
        >
            <p style={{ margin: 0, marginBottom: "var(--space-2)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
                Local environment readiness
            </p>
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
                {checks.map((check) => (
                    <p key={check.key} style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>
                        <strong>{icon(check.status)}</strong> {check.label}: {check.detail}
                    </p>
                ))}
            </div>
        </div>
    );
}
