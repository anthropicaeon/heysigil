/**
 * Governance Dashboard Utilities
 *
 * Helper functions for proposal status, voting calculations, and display.
 */

import type { ProposalStatus } from "@/types/governance";

import { formatTokens as formatTokensUtil, parseNumberString } from "./format";

// ─── Status Group Helpers ──────────────────────────────

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

/** Get Tailwind class for status badge */
export function getStatusVariant(
    s: ProposalStatus,
): "default" | "secondary" | "destructive" | "outline" | "sage" | "rose" | "lavender" {
    const map: Record<
        ProposalStatus,
        "default" | "secondary" | "destructive" | "outline" | "sage" | "rose" | "lavender"
    > = {
        Voting: "default",
        Approved: "sage",
        Rejected: "destructive",
        Expired: "secondary",
        ProofSubmitted: "lavender",
        Completed: "sage",
        Disputed: "rose",
        Overridden: "secondary",
    };
    return map[s];
}

/** Get human-readable status label */
export function statusLabel(s: ProposalStatus): string {
    if (s === "ProofSubmitted") return "Proof Submitted";
    return s;
}

/** Calculate vote percentage (yes votes as percentage of total) */
export function votePercentage(yes: string, no: string): number {
    const y = parseNumberString(yes);
    const n = parseNumberString(no);
    if (y + n === 0) return 50;
    return (y / (y + n)) * 100;
}

/** Re-export formatTokens for convenience */
export const formatTokens = formatTokensUtil;
