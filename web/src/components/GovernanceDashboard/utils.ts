/**
 * Governance Dashboard Utilities
 */

import type { ProposalStatus } from "./types";

// ─── Status Group Helpers (DRY) ──────────────────────────────

const POST_VOTING_STATUSES: ProposalStatus[] = [
    "Approved",
    "ProofSubmitted",
    "Completed",
    "Disputed",
    "Overridden",
];
const COMPLETION_VOTING_STATUSES: ProposalStatus[] = [
    "ProofSubmitted",
    "Completed",
    "Disputed",
    "Overridden",
];
const FINAL_STATUSES: ProposalStatus[] = ["Completed", "Overridden"];

/** Status is past voting phase (approved, completion, or final) */
export const isPostVoting = (s: ProposalStatus): boolean => POST_VOTING_STATUSES.includes(s);

/** Status shows completion votes (proof submitted through final) */
export const isCompletionVoting = (s: ProposalStatus): boolean =>
    COMPLETION_VOTING_STATUSES.includes(s);

/** Status is final (completed or overridden) */
export const isFinalStatus = (s: ProposalStatus): boolean => FINAL_STATUSES.includes(s);

export function statusVariant(
    s: ProposalStatus,
): "default" | "secondary" | "destructive" | "outline" | "sage" {
    const map: Record<
        ProposalStatus,
        "default" | "secondary" | "destructive" | "outline" | "sage"
    > = {
        Voting: "default",
        Approved: "sage",
        Rejected: "destructive",
        Expired: "secondary",
        ProofSubmitted: "outline",
        Completed: "sage",
        Disputed: "destructive",
        Overridden: "secondary",
    };
    return map[s];
}

export function statusLabel(s: ProposalStatus): string {
    if (s === "ProofSubmitted") return "Proof Submitted";
    return s;
}

export function votePercentage(yes: string, no: string): number {
    const y = parseFloat(yes.replace(/,/g, "")) || 0;
    const n = parseFloat(no.replace(/,/g, "")) || 0;
    if (y + n === 0) return 50;
    return (y / (y + n)) * 100;
}

export function formatTokens(value: string): string {
    const num = parseFloat(value.replace(/,/g, "")) || 0;
    if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
    return num.toLocaleString();
}
