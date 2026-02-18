"use client";

/**
 * Project Section
 *
 * Displays a stacked list of project cards with optional header.
 * Border-centric pastel design system.
 */

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
                <div className="flex items-center justify-between px-6 py-4 lg:px-12 border-border border-b">
                    <h2 className="text-lg font-semibold text-foreground lowercase">{title}</h2>
                    <span className="text-sm text-muted-foreground">
                        {projects.length} project{projects.length !== 1 ? "s" : ""}
                    </span>
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
