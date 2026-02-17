/**
 * Mock Proposal Fixtures
 *
 * Development mock data for governance proposals.
 * Replace with real contract reads in production.
 */

import type { Proposal } from "@/components/GovernanceDashboard/types";

export const MOCK_PROPOSALS: Proposal[] = [
    {
        id: 1,
        proposer: "0xDev...1234",
        title: "Ship v2.0 — Complete UI Redesign",
        description:
            "Full redesign of the platform UI with new component library, dark mode support, and mobile-first responsive layouts. Includes user testing and accessibility audit.",
        tokenAmount: "1,000,000,000",
        targetDate: Date.now() / 1000 + 30 * 86400,
        status: "Voting",
        votingDeadline: Date.now() / 1000 + 4 * 86400,
        yesVotes: "3,200,000,000",
        noVotes: "800,000,000",
        proofUri: "",
        completionDeadline: 0,
        completionYes: "0",
        completionNo: "0",
    },
    {
        id: 2,
        proposer: "0xDev...1234",
        title: "API v3 Integration — Multi-chain Support",
        description:
            "Integrate Arbitrum and Optimism chain support into the existing API layer. Includes new RPC endpoints, cross-chain bridging helpers, and updated SDK.",
        tokenAmount: "500,000,000",
        targetDate: Date.now() / 1000 + 60 * 86400,
        status: "Approved",
        votingDeadline: Date.now() / 1000 - 1 * 86400,
        yesVotes: "5,400,000,000",
        noVotes: "600,000,000",
        proofUri: "",
        completionDeadline: 0,
        completionYes: "0",
        completionNo: "0",
    },
    {
        id: 3,
        proposer: "0xHolder...5678",
        title: "Community SDK Documentation",
        description:
            "Create comprehensive developer documentation, code examples, and quickstart guides for the project SDK. Community-driven proposal.",
        tokenAmount: "200,000,000",
        targetDate: Date.now() / 1000 + 14 * 86400,
        status: "ProofSubmitted",
        votingDeadline: Date.now() / 1000 - 7 * 86400,
        yesVotes: "4,800,000,000",
        noVotes: "200,000,000",
        proofUri: "https://github.com/example/docs-pr/pull/42",
        completionDeadline: Date.now() / 1000 + 2 * 86400,
        completionYes: "2,100,000,000",
        completionNo: "300,000,000",
    },
    {
        id: 4,
        proposer: "0xDev...1234",
        title: "Mobile App MVP",
        description:
            "Build a React Native mobile app with core features: wallet connection, swap interface, and governance voting.",
        tokenAmount: "2,000,000,000",
        targetDate: Date.now() / 1000 - 5 * 86400,
        status: "Completed",
        votingDeadline: Date.now() / 1000 - 30 * 86400,
        yesVotes: "6,200,000,000",
        noVotes: "800,000,000",
        proofUri: "https://apps.apple.com/example",
        completionDeadline: Date.now() / 1000 - 10 * 86400,
        completionYes: "5,500,000,000",
        completionNo: "500,000,000",
    },
    {
        id: 5,
        proposer: "0xHolder...9abc",
        title: "Token Burn Mechanism",
        description:
            "Implement a deflationary token burn on every swap. Rejected by the community due to concerns about long-term supply effects.",
        tokenAmount: "800,000,000",
        targetDate: Date.now() / 1000 - 10 * 86400,
        status: "Rejected",
        votingDeadline: Date.now() / 1000 - 15 * 86400,
        yesVotes: "1,200,000,000",
        noVotes: "4,800,000,000",
        proofUri: "",
        completionDeadline: 0,
        completionYes: "0",
        completionNo: "0",
    },
];

export const MOCK_ESCROW_BALANCE = "7,300,000,000";
export const MOCK_TOTAL_SUPPLY = "100,000,000,000";
