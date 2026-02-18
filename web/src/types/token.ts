/**
 * Token Types
 *
 * Types for token holdings and project info.
 */

export interface TokenBalance {
    symbol: string;
    balance: string;
    address: string;
}

export interface ProjectInfo {
    projectId: string;
    name: string | null;
    description: string | null;
    poolTokenAddress: string | null;
    poolId: string | null;
    ownerWallet: string | null;
    attestationUid: string | null;
    devLinks: { platform: string; url: string; projectId: string }[] | null;
    deployedBy: string | null;
    feesAccruedWei: string;
    feesAccruedUsdc: string;
    createdAt: string | null;
    verifiedAt: string | null;
}

