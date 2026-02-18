"use client";

/**
 * Project Card
 *
 * Displays a single verified project with token and attestation info.
 */

import { memo } from "react";
import Image from "next/image";
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

export const ProjectCard = memo(function ProjectCard({ project }: { project: ProjectInfo }) {
    const displayName = project.name || project.projectId;
    const shortId = project.projectId.length > 30
        ? project.projectId.slice(0, 30) + "…"
        : project.projectId;
    const color = hashColor(project.projectId);

    return (
        <div className="token-card">
            {/* Top: icon + name */}
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
                    Developer
                </span>
            </div>

            {/* Info rows */}
            <div className="token-card-stats">
                {project.poolTokenAddress ? (
                    <div className="token-stat">
                        <div className="stat-value" style={{ fontSize: "var(--text-xs)", wordBreak: "break-all" }}>
                            {project.poolTokenAddress.slice(0, 6)}…{project.poolTokenAddress.slice(-4)}
                        </div>
                        <div className="stat-label">Token Contract</div>
                    </div>
                ) : (
                    <div className="token-stat">
                        <div className="stat-value" style={{ color: "var(--text-tertiary)" }}>—</div>
                        <div className="stat-label">No Token Yet</div>
                    </div>
                )}
                <div className="token-stat">
                    <div className="stat-value">
                        {project.attestationUid ? "✓ Verified" : "Pending"}
                    </div>
                    <div className="stat-label">Attestation</div>
                </div>
            </div>

            {/* Platform links */}
            {project.devLinks && project.devLinks.length > 0 && (
                <div className="fee-row" style={{ marginBottom: "var(--space-4)" }}>
                    <span className="fee-label">Platforms</span>
                    <span className="fee-value">
                        {project.devLinks.map((l) => l.platform).join(", ")}
                    </span>
                </div>
            )}

            {/* Verified date */}
            {project.verifiedAt && (
                <div className="fee-row" style={{ marginBottom: "var(--space-4)" }}>
                    <span className="fee-label">Verified</span>
                    <span className="fee-value">
                        {new Date(project.verifiedAt).toLocaleDateString()}
                    </span>
                </div>
            )}
        </div>
    );
});
