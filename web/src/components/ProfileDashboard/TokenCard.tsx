"use client";

/**
 * Project Card
 *
 * Displays a single project with token info, fees accrued, and claim action.
 */

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProjectInfo } from "@/types";

/** Generate a deterministic color from a string */
function hashColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 55%, 50%)`;
}

/** Get a friendly display name from projectId like "github:org/repo" */
function getDisplayName(project: ProjectInfo): string {
    if (project.name) return project.name;
    // Strip platform prefix: "github:org/repo" → "org/repo"
    const id = project.projectId;
    const colonIdx = id.indexOf(":");
    return colonIdx > -1 ? id.slice(colonIdx + 1) : id;
}

/** Get short repo path */
function getShortId(project: ProjectInfo): string {
    const id = project.projectId;
    const colonIdx = id.indexOf(":");
    const clean = colonIdx > -1 ? id.slice(colonIdx + 1) : id;
    return clean.length > 35 ? clean.slice(0, 35) + "…" : clean;
}

export const ProjectCard = memo(function ProjectCard({
    project,
    claimable = false,
}: {
    project: ProjectInfo;
    claimable?: boolean;
}) {
    const displayName = getDisplayName(project);
    const shortId = getShortId(project);
    const color = hashColor(project.projectId);

    return (
        <div
            className="token-card"
            style={claimable ? {
                border: "1px solid var(--warning)",
                boxShadow: "0 0 12px rgba(255, 193, 7, 0.08)",
            } : undefined}
        >
            {/* Top: icon + name + badge */}
            <div className="token-card-top">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="token-card-icon" style={{ background: color }}>
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="token-card-name">
                        <h3>{displayName}</h3>
                        <span className="ticker">{shortId}</span>
                    </div>
                </div>
                {claimable ? (
                    <span className="token-role-badge" style={{
                        background: "rgba(255, 193, 7, 0.15)",
                        color: "var(--warning)",
                        border: "1px solid rgba(255, 193, 7, 0.3)",
                    }}>
                        🎁 Claimable
                    </span>
                ) : (
                    <span className="token-role-badge role-dev">
                        <Image
                            src="/icons/zap-fast.svg"
                            alt=""
                            width={12}
                            height={12}
                            style={{
                                display: "inline",
                                verticalAlign: "middle",
                                marginRight: 3,
                                opacity: 0.6,
                            }}
                        />{" "}
                        Verified
                    </span>
                )}
            </div>

            {/* Stats row */}
            <div className="token-card-stats">
                <div className="token-stat">
                    <div className="stat-value" style={{ color: "var(--success)" }}>
                        {project.feesAccruedUsdc}
                    </div>
                    <div className="stat-label">Fees Accrued</div>
                </div>
                <div className="token-stat">
                    {project.poolTokenAddress ? (
                        <>
                            <div className="stat-value" style={{ fontSize: "var(--text-xs)", wordBreak: "break-all" }}>
                                {project.poolTokenAddress.slice(0, 6)}…{project.poolTokenAddress.slice(-4)}
                            </div>
                            <div className="stat-label">Token</div>
                        </>
                    ) : (
                        <>
                            <div className="stat-value" style={{ color: "var(--text-tertiary)" }}>—</div>
                            <div className="stat-label">No Token</div>
                        </>
                    )}
                </div>
            </div>

            {/* Platform links */}
            {project.devLinks && project.devLinks.length > 0 && (
                <div className="fee-row" style={{ marginBottom: "var(--space-3)" }}>
                    <span className="fee-label">Platform</span>
                    <span className="fee-value">
                        {project.devLinks.map((l) => l.platform).join(", ")}
                    </span>
                </div>
            )}

            {/* Verified / Created date */}
            <div className="fee-row" style={{ marginBottom: "var(--space-4)" }}>
                <span className="fee-label">
                    {project.verifiedAt ? "Verified" : "Created"}
                </span>
                <span className="fee-value">
                    {new Date(project.verifiedAt || project.createdAt || "").toLocaleDateString()}
                </span>
            </div>

            {/* Claim CTA */}
            {claimable && (
                <Link
                    href={`/verify?project=${encodeURIComponent(
                        project.projectId.replace(/^github:/, "")
                    )}`}
                    style={{
                        display: "block",
                        textAlign: "center",
                        padding: "var(--space-3) var(--space-4)",
                        background: "var(--warning)",
                        color: "#000",
                        borderRadius: "var(--radius-md)",
                        fontWeight: 600,
                        fontSize: "var(--text-sm)",
                        textDecoration: "none",
                        marginTop: "var(--space-2)",
                        transition: "opacity 0.15s ease",
                    }}
                >
                    Verify & Claim →
                </Link>
            )}
        </div>
    );
});
