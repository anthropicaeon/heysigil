/**
 * Centralized API Client
 *
 * Single source of truth for API endpoints with consistent error handling.
 */

import type { ChallengeResponse, CheckResult, ClaimResult, WalletInfo, FeeInfo } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Re-export types for convenience
export type { ChallengeResponse, CheckResult, ClaimResult, WalletInfo, FeeInfo };

// ─── Error Class ───────────────────────────────────────

export class ApiError extends Error {
    constructor(
        message: string,
        public status: number
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// ─── Request Helper ────────────────────────────────────

async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
        ...options,
    });

    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ApiError(data.error || `HTTP ${res.status}`, res.status);
    }

    return res.json();
}

// ─── API Client ────────────────────────────────────────

export const apiClient = {
    verify: {
        createChallenge: (method: string, projectId: string, walletAddress: string, accessToken?: string) =>
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
        getInfo: (sessionId: string) =>
            request<WalletInfo>(`/api/wallet/${sessionId}`),

        create: (sessionId: string) =>
            request<WalletInfo>(`/api/wallet/${sessionId}/create`, {
                method: "POST",
            }),
    },

    fees: {
        getClaimable: (walletAddress: string) =>
            request<FeeInfo>(`/api/fees/claimable/${walletAddress}`),
    },
};
