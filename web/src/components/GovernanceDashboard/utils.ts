/**
 * Governance Dashboard Utilities
 */

import type { ProposalStatus } from "./types";
import { formatTokens as formatTokensUtil } from "@/lib/format";

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
    const y = parseFloat(yes.replace(/,/g, "")) || 0;
    const n = parseFloat(no.replace(/,/g, "")) || 0;
    if (y + n === 0) return 50;
    return (y / (y + n)) * 100;
}

export const formatTokens = formatTokensUtil;
