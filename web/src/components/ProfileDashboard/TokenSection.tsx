"use client";

/**
 * Project Section
 *
 * Displays a stacked list of project cards with optional header.
 * Border-centric design with divide patterns.
 */

import { Badge } from "@/components/ui/badge";
import type { ProjectInfo } from "@/types";

import { ProjectCard } from "./TokenCard";

interface ProjectSectionProps {
    projects: ProjectInfo[];
    title?: string;
    showHeader?: boolean;
    /** When true, cards show a "Claim" CTA */
    claimable?: boolean;
}

export function ProjectSection({
    projects,
    title,
    showHeader = true,
    claimable = false,
}: ProjectSectionProps) {
    if (projects.length === 0) return null;

    return (
        <div className="bg-background">
            {showHeader && title && (
                <div className="flex items-center justify-between px-6 py-4 lg:px-8 border-border border-b bg-secondary/20">
                    <h2 className="text-lg font-semibold text-foreground lowercase">{title}</h2>
                    <Badge variant="outline">
                        {projects.length} project{projects.length !== 1 ? "s" : ""}
                    </Badge>
                </div>
            )}
            <div className="divide-y divide-border border-border border-b">
                {projects.map((p) => (
                    <ProjectCard key={p.projectId} project={p} claimable={claimable} />
                ))}
            </div>
        </div>
    );
}
