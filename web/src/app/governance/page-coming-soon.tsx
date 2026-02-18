/**
 * Governance Coming-Soon Page
 *
 * Shows the governance dashboard greyed out with a "Coming Soon" banner.
 * To activate: rename this file to page.tsx (replacing the original).
 */

"use client";

import { Clock, Vote } from "lucide-react";
import Link from "next/link";

import GovernanceDashboard from "@/components/GovernanceDashboard";
import { Button } from "@/components/ui/button";

export default function GovernanceComingSoonPage() {
    return (
        <div className="relative min-h-screen">
            {/* Coming Soon Banner — sits above the greyed-out content */}
            <div className="sticky top-0 z-50 bg-primary text-primary-foreground border-b border-primary-foreground/20">
                <div className="container px-6 py-6 lg:px-12 lg:py-8 flex flex-col sm:flex-row items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-12 bg-primary-foreground/10 flex items-center justify-center">
                            <Vote className="size-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold lowercase">
                                governance — coming soon
                            </h2>
                            <p className="text-primary-foreground/70 text-sm">
                                Milestone governance is under active development. Check back soon.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 sm:ml-auto">
                        <div className="flex items-center gap-1.5 text-primary-foreground/60 text-xs">
                            <Clock className="size-3.5" />
                            <span>Q2 2026</span>
                        </div>
                        <Link href="/features">
                            <Button
                                size="sm"
                                variant="secondary"
                                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                            >
                                View Features
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Greyed-out governance dashboard */}
            <div className="pointer-events-none select-none opacity-30 grayscale">
                <GovernanceDashboard />
            </div>
        </div>
    );
}
