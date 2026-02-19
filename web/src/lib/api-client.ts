/**
 * Centralized API Client
 *
 * Single source of truth for API endpoints with consistent error handling.
 */

import type {
    ChallengeResponse,
    CheckResult,
    ClaimResult,
    FeeInfo,
    LaunchListItem,
    ProjectInfo,
    WalletInfo,
} from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Re-export types for convenience
export type {
    ChallengeResponse,
    CheckResult,
    ClaimResult,
    FeeInfo,
    LaunchListItem,
    ProjectInfo,
    WalletInfo,
};

export interface QuickLaunchResponse {
    success: true;
    deployed: boolean;
    project: {
        id: string;
        projectId: string;
        name: string;
        symbol?: string;
    };
    token?: {
        address: string;
        poolId: string;
        txHash: string;
        explorerUrl: string;
        dexUrl: string;
    };
    claimToken: string;
    claimTokenExpiresAt: string;
    launchDefaults: {
        repo: string;
        repoUrl: string;
        claimLaterSupported: true;
    };
}

// ─── Error Class ───────────────────────────────────────

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ─── Request Helper ────────────────────────────────────

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const { headers: optionHeaders, ...restOptions } = options;
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...restOptions,
        headers: {
            "Content-Type": "application/json",
            ...(optionHeaders as Record<string, string>),
        },
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMsg =
            typeof data.error === "string"
                ? data.error
                : (data.error?.message ?? data.message ?? `HTTP ${res.status}`);
        throw new ApiError(errMsg, res.status);
    }

    return res.json();
}

// ─── API Client ────────────────────────────────────────

export const apiClient = {
    verify: {
        createChallenge: (
            method: string,
            projectId: string,
            walletAddress: string,
            accessToken?: string,
        ) =>
            request<ChallengeResponse>("/api/verify/challenge", {
                method: "POST",
                body: JSON.stringify({ method, projectId, walletAddress }),
                ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
            }),

        checkVerification: (verificationId: string, accessToken?: string) =>
            request<CheckResult>("/api/verify/check", {
                method: "POST",
                body: JSON.stringify({ verificationId }),
                ...(accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : {}),
            }),
    },

    claim: {
        createAttestation: (verificationId: string) =>
            request<ClaimResult>("/api/claim", {
                method: "POST",
                body: JSON.stringify({ verificationId }),
            }),
    },

    wallet: {
        getInfo: (sessionId: string) => request<WalletInfo>(`/api/wallet/${sessionId}`),

        create: (sessionId: string) =>
            request<WalletInfo>(`/api/wallet/${sessionId}/create`, {
                method: "POST",
            }),

        /** Get wallet for the authenticated Privy user */
        getMyWallet: (accessToken: string) =>
            request<WalletInfo>("/api/wallet/me", {
                headers: { Authorization: `Bearer ${accessToken}` },
            }),

        /** Create wallet for the authenticated Privy user (idempotent) */
        createMyWallet: (accessToken: string) =>
            request<WalletInfo>("/api/wallet/me", {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
            }),

        /** Withdraw ETH or ERC-20 tokens to an external address */
        withdraw: (accessToken: string, to: string, amount: string, token = "ETH") =>
            request<{
                success: boolean;
                txHash: string;
                blockNumber?: number;
                token: string;
                amount: string;
                to: string;
            }>("/api/wallet/me/withdraw", {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
                body: JSON.stringify({ to, amount, token }),
            }),
    },

    fees: {
        getClaimable: (walletAddress: string) =>
            request<FeeInfo>(`/api/fees/claimable/${walletAddress}`),
        claimGas: (accessToken: string) =>
            request<{
                funded: boolean;
                alreadyFunded: boolean;
                walletAddress: string;
                txHash?: string;
                amountWei?: string;
                message: string;
            }>("/api/fees/claim-gas", {
                method: "POST",
                headers: { Authorization: `Bearer ${accessToken}` },
            }),
        claim: (accessToken: string, token?: string) =>
            request<{
                success: boolean;
                txHash: string;
                blockNumber?: number;
                walletAddress: string;
                message: string;
                error?: string;
            }>("/api/fees/claim", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: token ? JSON.stringify({ token }) : undefined,
            }),
    },

    launch: {
        quick: () =>
            request<QuickLaunchResponse>("/api/launch/quick", {
                method: "POST",
                body: JSON.stringify({}),
            }),
        myProjects: (accessToken: string) =>
            request<{ projects: ProjectInfo[]; claimableProjects: ProjectInfo[] }>(
                "/api/launch/my-projects",
                {
                    headers: { Authorization: `Bearer ${accessToken}` },
                },
            ),
        list: (params?: {
            limit?: number;
            offset?: number;
            q?: string;
            platform?: "github" | "twitter" | "facebook" | "instagram" | "domain";
            sort?: "newest" | "oldest";
        }) => {
            const query = new URLSearchParams();
            if (params?.limit) query.set("limit", String(params.limit));
            if (params?.offset) query.set("offset", String(params.offset));
            if (params?.q) query.set("q", params.q);
            if (params?.platform) query.set("platform", params.platform);
            if (params?.sort) query.set("sort", params.sort);
            const suffix = query.toString();
            return request<{
                launches: LaunchListItem[];
                pagination: { limit: number; offset: number; count: number; hasMore: boolean };
            }>(`/api/launch/list${suffix ? `?${suffix}` : ""}`);
        },
    },
};
