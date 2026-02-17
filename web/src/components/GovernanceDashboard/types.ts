/**
 * Governance Dashboard Types
 */

export type ProposalStatus =
    | "Voting"
    | "Approved"
    | "Rejected"
    | "Expired"
    | "ProofSubmitted"
    | "Completed"
    | "Disputed"
    | "Overridden";

export interface Proposal {
    id: number;
    proposer: string;
    title: string;
    description: string;
    tokenAmount: string;
    targetDate: number;
    status: ProposalStatus;
    votingDeadline: number;
    yesVotes: string;
    noVotes: string;
    proofUri: string;
    completionDeadline: number;
    completionYes: string;
    completionNo: string;
}

export type TabFilter = "all" | "active" | "completed" | "rejected";
