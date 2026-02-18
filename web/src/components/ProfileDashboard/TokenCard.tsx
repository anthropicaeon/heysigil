"use client";

/**
 * Project Card
 *
 * Displays a single project with token info, fees accrued, and actions.
 * Pastel aesthetic with consistent borders.
 */

import {
    ArrowUpRight,
    CheckCircle,
    ChevronRight,
    Clock,
    Coins,
    ExternalLink,
    Gift,
    Zap,
} from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ProjectInfo } from "@/types";

/** Generate a deterministic color from a string */
function hashColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 35%, 65%)`;
}

/** Get a friendly display name from projectId like "github:org/repo" */
function getDisplayName(project: ProjectInfo): string {
    if (project.name) return project.name;
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

    const hasFees = Number(project.feesAccruedWei || "0") > 0;

    return (
        <div
            className={cn(
                "bg-background hover:bg-secondary/20 transition-colors",
                claimable && "bg-cream/30",
            )}
        >
            {/* Header Row */}
            <div className="flex items-center justify-between px-6 py-4 lg:px-8 border-border border-b">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div
                        className="size-12 flex items-center justify-center text-white font-bold text-lg border border-border"
                        style={{ backgroundColor: color }}
                    >
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div>
                        <h3 className="font-semibold text-foreground text-lg">{displayName}</h3>
                        <p className="text-sm text-muted-foreground font-mono">{shortId}</p>
                    </div>
                </div>
                {/* Status Badge */}
                <div className="flex items-center gap-2">
                    {claimable ? (
                        <Badge variant="outline" className="border-border">
                            <Gift className="size-3 mr-1" />
                            Claimable
                        </Badge>
                    ) : (
                        <Badge variant="sage">
                            <Zap className="size-3 mr-1" />
                            Verified
                        </Badge>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border border-border border-b">
                {/* Fees */}
                <div className="flex-1 px-6 py-4 lg:px-8">
                    <div className="flex items-center gap-2 mb-1">
                        <Coins className="size-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Fees Accrued
                        </span>
                    </div>
                    <p
                        className={cn(
                            "text-xl font-bold",
                            hasFees ? "text-foreground" : "text-muted-foreground",
                        )}
                    >
                        {project.feesAccruedUsdc}
                    </p>
                </div>

                {/* Token Contract */}
                <div className="flex-1 px-6 py-4 lg:px-8">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Token Contract
                        </span>
                    </div>
                    {project.poolTokenAddress ? (
                        <a
                            href={`https://basescan.org/address/${project.poolTokenAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono text-foreground hover:text-primary flex items-center gap-1 group"
                        >
                            {project.poolTokenAddress.slice(0, 6)}…
                            {project.poolTokenAddress.slice(-4)}
                            <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                    ) : (
                        <p className="text-sm text-muted-foreground">No token deployed</p>
                    )}
                </div>

                {/* Attestation */}
                <div className="flex-1 px-6 py-4 lg:px-8">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Attestation
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {project.attestationUid ? (
                            <>
                                <CheckCircle className="size-4 text-primary" />
                                <span className="text-sm font-medium text-foreground">Verified</span>
                            </>
                        ) : (
                            <>
                                <Clock className="size-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Pending</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between px-6 py-3 lg:px-8 bg-secondary/10">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {project.devLinks && project.devLinks.length > 0 && (
                        <span className="flex items-center gap-1">
                            {project.devLinks.map((l) => l.platform).join(", ")}
                        </span>
                    )}
                    {(project.verifiedAt || project.createdAt) && (
                        <span>
                            {project.verifiedAt ? "Verified" : "Created"}{" "}
                            {new Date(
                                project.verifiedAt || project.createdAt || "",
                            ).toLocaleDateString()}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {claimable ? (
                        <Link href={`/verify?project=${encodeURIComponent(project.projectId)}`}>
                            <Button size="sm" className="gap-1">
                                Verify & Claim
                                <ChevronRight className="size-4" />
                            </Button>
                        </Link>
                    ) : (
                        <>
                            {project.attestationUid && (
                                <a
                                    href={`https://base.easscan.org/attestation/view/${project.attestationUid}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button variant="ghost" size="sm" className="gap-1">
                                        <ExternalLink className="size-4" />
                                        EAS
                                    </Button>
                                </a>
                            )}
                            {project.poolTokenAddress && (
                                <Link href={`/governance?token=${project.poolTokenAddress}`}>
                                    <Button variant="outline" size="sm" className="gap-1">
                                        Governance
                                        <ChevronRight className="size-4" />
                                    </Button>
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});
