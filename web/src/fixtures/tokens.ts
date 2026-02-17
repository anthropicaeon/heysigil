/**
 * Mock Token Fixtures
 *
 * Development mock data for token displays.
 * Replace with real data in production.
 */

import type { TokenInfo } from "@/types";

export const MOCK_DEV_TOKENS: TokenInfo[] = [
    {
        address: "0xTOKEN1...aaaa",
        name: "NexusAI Protocol",
        ticker: "NEXUS",
        color: "#6C5CE7",
        role: "dev",
        balance: "50,000,000",
        escrowBalance: "7,300,000,000",
        activeProposals: 1,
        totalProposals: 4,
        projectId: "nexusai",
    },
    {
        address: "0xTOKEN2...bbbb",
        name: "DeFi Guardian",
        ticker: "GUARD",
        color: "#00B894",
        role: "dev",
        balance: "50,000,000",
        escrowBalance: "9,100,000,000",
        activeProposals: 0,
        totalProposals: 2,
        projectId: "defi-guardian",
    },
];

export const MOCK_HELD_TOKENS: TokenInfo[] = [
    {
        address: "0xTOKEN3...cccc",
        name: "Quantum Chain",
        ticker: "QNTM",
        color: "#E17055",
        role: "holder",
        balance: "125,000,000",
        escrowBalance: "6,800,000,000",
        activeProposals: 2,
        totalProposals: 6,
        projectId: "quantum-chain",
    },
    {
        address: "0xTOKEN4...dddd",
        name: "SocialFi Hub",
        ticker: "SHUB",
        color: "#0984E3",
        role: "holder",
        balance: "89,500,000",
        escrowBalance: "8,200,000,000",
        activeProposals: 1,
        totalProposals: 3,
        projectId: "socialfi-hub",
    },
    {
        address: "0xTOKEN5...eeee",
        name: "DataVault Network",
        ticker: "DVLT",
        color: "#FDCB6E",
        role: "holder",
        balance: "52,000,000",
        escrowBalance: "5,400,000,000",
        activeProposals: 0,
        totalProposals: 1,
        projectId: "datavault",
    },
];
