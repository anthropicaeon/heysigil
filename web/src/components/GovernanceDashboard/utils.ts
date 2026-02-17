/**
 * Governance Dashboard Utilities
 */

import type { ProposalStatus } from "./types";
import { formatTokens as formatTokensUtil, parseNumberString } from "@/lib/format";

// ─── Status Group Helpers (DRY) ──────────────────────────────

const POST_VOTING_STATUSES: ProposalStatus[] = ["Approved", "ProofSubmitted", "Completed", "Disputed", "Overridden"];
const COMPLETION_VOTING_STATUSES: ProposalStatus[] = ["ProofSubmitted", "Completed", "Disputed", "Overridden"];
const FINAL_STATUSES: ProposalStatus[] = ["Completed", "Overridden"];

/** Status is past voting phase (approved, completion, or final) */
export const isPostVoting = (s: ProposalStatus): boolean => POST_VOTING_STATUSES.includes(s);

/** Status shows completion votes (proof submitted through final) */
export const isCompletionVoting = (s: ProposalStatus): boolean => COMPLETION_VOTING_STATUSES.includes(s);

/** Status is final (completed or overridden) */
export const isFinalStatus = (s: ProposalStatus): boolean => FINAL_STATUSES.includes(s);

export function statusClass(s: ProposalStatus): string {
    const map: Record<ProposalStatus, string> = {
        Voting: "status-voting",
        Approved: "status-approved",
        Rejected: "status-rejected",
        Expired: "status-expired",
        ProofSubmitted: "status-proof",
        Completed: "status-completed",
        Disputed: "status-disputed",
        Overridden: "status-overridden",
    };
    return map[s];
}

export function statusLabel(s: ProposalStatus): string {
    if (s === "ProofSubmitted") return "Proof Submitted";
    return s;
}

export function votePercentage(yes: string, no: string): number {
    const y = parseNumberString(yes);
    const n = parseNumberString(no);
    if (y + n === 0) return 50;
    return (y / (y + n)) * 100;
}

export const formatTokens = formatTokensUtil;
