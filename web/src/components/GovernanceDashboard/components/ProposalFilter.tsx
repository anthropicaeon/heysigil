/**
 * ProposalFilter
 *
 * Tab filter for proposals with "New Proposal" button.
 * Refined border-centric design with visual polish.
 */

import { Filter, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { TabFilter } from "../types";

const TAB_OPTIONS: { value: TabFilter; label: string; description: string }[] = [
    { value: "all", label: "All", description: "View all proposals" },
    { value: "active", label: "Active", description: "Currently voting" },
    { value: "completed", label: "Completed", description: "Successfully delivered" },
    { value: "rejected", label: "Rejected", description: "Did not pass" },
];

interface ProposalFilterProps {
    activeTab: TabFilter;
    onTabChange: (tab: TabFilter) => void;
    onCreateClick: () => void;
}

export function ProposalFilter({ activeTab, onTabChange, onCreateClick }: ProposalFilterProps) {
    return (
        <div className="border-border border-b bg-lavender/20">
            <div className="flex flex-col sm:flex-row sm:items-stretch sm:justify-between">
                {/* Filter Label + Tabs */}
                <div className="flex items-stretch">
                    {/* Filter Icon Cell */}
                    <div className="hidden lg:flex items-center justify-center px-4 border-border border-r bg-lavender/30">
                        <Filter className="size-4 text-muted-foreground" />
                    </div>

                    {/* Tab Buttons */}
                    <div className="flex overflow-x-auto divide-x divide-border border-border border-b sm:border-b-0 sm:border-r">
                        {TAB_OPTIONS.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => onTabChange(tab.value)}
                                title={tab.description}
                                className={cn(
                                    "px-5 py-4 lg:px-6 text-sm font-medium transition-all whitespace-nowrap",
                                    "relative group",
                                    activeTab === tab.value
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-lavender/40",
                                )}
                            >
                                {tab.label}
                                {/* Active indicator */}
                                {activeTab === tab.value && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* New Proposal Button */}
                <div className="flex items-center px-6 py-3 sm:py-0">
                    <Button onClick={onCreateClick} className="gap-2">
                        <Plus className="size-4" />
                        <span className="hidden sm:inline">New Proposal</span>
                        <span className="sm:hidden">New</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
