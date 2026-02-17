/**
 * ProposalFilter
 *
 * Tab filter for proposals with "New Proposal" button.
 */

import type { TabFilter } from "../types";

const TAB_OPTIONS: TabFilter[] = ["all", "active", "completed", "rejected"];

interface ProposalFilterProps {
    activeTab: TabFilter;
    onTabChange: (tab: TabFilter) => void;
    onCreateClick: () => void;
}

export function ProposalFilter({ activeTab, onTabChange, onCreateClick }: ProposalFilterProps) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div className="gov-tabs">
                {TAB_OPTIONS.map((tab) => (
                    <button
                        key={tab}
                        type="button"
                        className={`gov-tab ${activeTab === tab ? "active" : ""}`}
                        onClick={() => onTabChange(tab)}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                ))}
            </div>
            <button
                type="button"
                className="btn-primary"
                onClick={onCreateClick}
                style={{ marginBottom: "var(--space-6)" }}
            >
                + New Proposal
            </button>
        </div>
    );
}
