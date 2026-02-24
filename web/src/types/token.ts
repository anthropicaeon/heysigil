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

export interface LaunchListItem {
    projectId: string;
    name: string | null;
    description: string | null;
    platform: "github" | "twitter" | "facebook" | "instagram" | "domain" | "unknown";
    poolTokenAddress: string;
    poolId: string;
    deployTxHash: string | null;
    deployedBy: string | null;
    attestationUid: string | null;
    ownerWallet: string | null;
    createdAt: string | null;
    verifiedAt: string | null;
    explorerUrl: string;
    dexUrl: string;
    marketCap: number | null;
    volume24h: number | null;
}
