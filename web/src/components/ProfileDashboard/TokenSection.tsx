"use client";

/**
 * Project Section
 *
 * Displays a grid of project cards with optional header.
 */

import Image from "next/image";
import type { ProjectInfo } from "@/types";
import { ProjectCard } from "./TokenCard";

interface ProjectSectionProps {
    projects: ProjectInfo[];
    title?: string;
    icon?: string;
    showHeader?: boolean;
    /** When true, cards show a "Claim" CTA */
    claimable?: boolean;
}

export function ProjectSection({ projects, title, icon, showHeader = true, claimable = false }: ProjectSectionProps) {
    if (projects.length === 0) return null;

    return (
        <>
            {showHeader && title && (
                <div className="profile-section-header">
                    <h2>
                        {icon && (
                            <Image
                                src={icon}
                                alt=""
                                width={20}
                                height={20}
                                style={{
                                    display: "inline",
                                    verticalAlign: "middle",
                                    marginRight: 6,
                                    opacity: 0.6,
                                }}
                            />
                        )}
                        {title}
                    </h2>
                    <span className="section-count">{projects.length} project{projects.length !== 1 ? "s" : ""}</span>
                </div>
            )}
            <div className="token-grid">
                {projects.map((p) => (
                    <ProjectCard key={p.projectId} project={p} claimable={claimable} />
                ))}
            </div>
        </>
    );
}
