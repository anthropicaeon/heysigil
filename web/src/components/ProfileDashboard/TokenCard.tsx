"use client";

/**
 * Project Card
 *
 * Displays a single verified project with token and attestation info.
 * Border-centric pastel design system.
 */

import { CheckCircle, ChevronRight, Clock, Zap } from "lucide-react";
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

export const ProjectCard = memo(function ProjectCard({ project }: { project: ProjectInfo }) {
    const displayName = project.name || project.projectId;
    const shortId =
        project.projectId.length > 20 ? project.projectId.slice(0, 20) + "…" : project.projectId;
    const color = hashColor(project.projectId);

    return (
        <div className="border-border border-b last:border-b-0 bg-background hover:bg-secondary/30 transition-colors">
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
                <Badge variant="default" className="text-xs">
                    <Zap className="size-3 mr-1" />
                    Developer
                </Badge>
            </div>

            {/* Stats Row */}
            <div className="flex border-border border-b">
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
                <div className="flex-1 px-6 py-4 lg:px-8 border-border border-r">
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
                <div className="flex-1 px-6 py-4 lg:px-8">
                    {project.verifiedAt ? (
                        <>
                            <p className="text-sm text-foreground">
                                {new Date(project.verifiedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">Verified Date</p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">—</p>
                            <p className="text-xs text-muted-foreground">Not Verified</p>
                        </>
                    )}
                </div>
            </div>

            {/* Actions Row */}
            <div className="flex items-center justify-between px-6 py-3 lg:px-8">
                <div className="flex gap-2">
                    {project.devLinks && project.devLinks.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            Platforms: {project.devLinks.map((l) => l.platform).join(", ")}
                        </span>
                    )}
                </div>
                {project.poolTokenAddress && (
                    <Link
                        href={`/governance?token=${project.poolTokenAddress}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Button variant="ghost" size="sm" className="gap-1">
                            Governance
                            <ChevronRight className="size-4" />
                        </Button>
                    </Link>
                )}
            </div>
        </div>
    );
});
