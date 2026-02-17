/**
 * Token Types
 *
 * Types for token holdings and balances.
 */

export interface TokenBalance {
    symbol: string;
    balance: string;
    address: string;
}

export interface TokenInfo {
    address: string;
    name: string;
    ticker: string;
    color: string;
    role: "dev" | "holder";
    balance: string;
    escrowBalance: string;
    activeProposals: number;
    totalProposals: number;
    projectId: string;
}
