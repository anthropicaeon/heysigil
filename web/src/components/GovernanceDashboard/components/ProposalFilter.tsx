/**
 * ProposalFilter
 *
 * Tab filter for proposals with "New Proposal" button.
 * Updated with pastel design system.
 */

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { TabFilter } from "../types";

const TAB_OPTIONS: TabFilter[] = ["all", "active", "completed", "rejected"];

interface ProposalFilterProps {
    activeTab: TabFilter;
    onTabChange: (tab: TabFilter) => void;
    onCreateClick: () => void;
}

export function ProposalFilter({ activeTab, onTabChange, onCreateClick }: ProposalFilterProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-border border-b">
            <div className="flex overflow-x-auto">
                {TAB_OPTIONS.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => onTabChange(tab)}
                        className={cn(
                            "px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap",
                            "border-border border-r last:border-r-0",
                            activeTab === tab
                                ? "bg-primary/5 text-primary"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/30",
                        )}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
            <div className="px-6 py-3 sm:py-0">
                <Button onClick={onCreateClick}>
                    <Plus className="size-4 mr-2" />
                    New Proposal
                </Button>
            </div>
        </div>
    );
}
