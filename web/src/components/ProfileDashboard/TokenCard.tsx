"use client";

/**
 * Project Card
 *
 * Displays a single project with token info, fees accrued, and claim action.
 * Border-centric pastel design system.
 */

import { CheckCircle, ChevronRight, Clock, Gift, Zap } from "lucide-react";
import Link from "next/link";
import { memo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
            className={`border-border border-b last:border-b-0 bg-background hover:bg-secondary/30 transition-colors ${claimable ? "ring-1 ring-orange-300" : ""}`}
        >
            {/* Header Row */}
            <div className="flex items-center justify-between px-6 py-4 lg:px-8 border-border border-b">
                <div className="flex items-center gap-3">
                    <div
                        className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: color }}
                    >
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground">{displayName}</h3>
                        <span className="text-sm text-muted-foreground">{shortId}</span>
                    </div>
                </div>
                {claimable ? (
                    <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                        <Gift className="size-3 mr-1" />
                        Claimable
                    </Badge>
                ) : (
                    <Badge variant="default" className="text-xs">
                        <Zap className="size-3 mr-1" />
                        Verified
                    </Badge>
                )}
            </div>

            {/* Stats Row */}
            <div className="flex border-border border-b">
                <div className="flex-1 px-6 py-4 lg:px-8 border-border border-r">
                    <p className="text-lg font-semibold text-green-600">
                        {project.feesAccruedUsdc}
                    </p>
                    <p className="text-xs text-muted-foreground">Fees Accrued</p>
                </div>
                <div className="flex-1 px-6 py-4 lg:px-8 border-border border-r">
                    {project.poolTokenAddress ? (
                        <>
                            <p className="text-sm font-mono text-foreground truncate">
                                {project.poolTokenAddress.slice(0, 6)}…
                                {project.poolTokenAddress.slice(-4)}
                            </p>
                            <p className="text-xs text-muted-foreground">Token Contract</p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">—</p>
                            <p className="text-xs text-muted-foreground">No Token Yet</p>
                        </>
                    )}
                </div>
                <div className="flex-1 px-6 py-4 lg:px-8">
                    <div className="flex items-center gap-2">
                        {project.attestationUid ? (
                            <>
                                <CheckCircle className="size-4 text-green-600" />
                                <span className="text-sm text-foreground">Verified</span>
                            </>
                        ) : (
                            <>
                                <Clock className="size-4 text-orange-500" />
                                <span className="text-sm text-muted-foreground">Pending</span>
                            </>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">Attestation</p>
                </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between px-6 py-3 lg:px-8">
                <div className="flex items-center gap-4">
                    {project.devLinks && project.devLinks.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {project.devLinks.map((l) => l.platform).join(", ")}
                        </span>
                    )}
                    {(project.verifiedAt || project.createdAt) && (
                        <span className="text-xs text-muted-foreground">
                            {project.verifiedAt ? "Verified" : "Created"}{" "}
                            {new Date(
                                project.verifiedAt || project.createdAt || "",
                            ).toLocaleDateString()}
                        </span>
                    )}
                </div>
                {claimable ? (
                    <Link href={`/verify?project=${encodeURIComponent(project.projectId)}`}>
                        <Button size="sm" className="gap-1 bg-orange-500 hover:bg-orange-600">
                            Verify & Claim
                            <ChevronRight className="size-4" />
                        </Button>
                    </Link>
                ) : (
                    project.poolTokenAddress && (
                        <Link href={`/governance?token=${project.poolTokenAddress}`}>
                            <Button variant="ghost" size="sm" className="gap-1">
                                Governance
                                <ChevronRight className="size-4" />
                            </Button>
                        </Link>
                    )
                )}
            </div>
        </div>
    );
});
