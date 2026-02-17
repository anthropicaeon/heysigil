/**
 * Verify API Hook
 *
 * Abstracts API calls for verification flow.
 */

import type { ChallengeResponse, CheckResult } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface VerifyApi {
    createChallenge: (
        method: string,
        projectId: string,
        walletAddress: string
    ) => Promise<ChallengeResponse>;
    checkVerification: (verificationId: string) => Promise<CheckResult>;
    claimAttestation: (verificationId: string) => Promise<{ attestationUid?: string }>;
}

export function useVerifyApi(): VerifyApi {
    const createChallenge = async (
        method: string,
        projectId: string,
        walletAddress: string
    ): Promise<ChallengeResponse> => {
        const res = await fetch(`${API_BASE}/api/verify/challenge`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method, projectId, walletAddress }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
        }

        return res.json();
    };

    const checkVerification = async (verificationId: string): Promise<CheckResult> => {
        const res = await fetch(`${API_BASE}/api/verify/check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verificationId }),
        });

        return res.json();
    };

    const claimAttestation = async (verificationId: string): Promise<{ attestationUid?: string }> => {
        const res = await fetch(`${API_BASE}/api/claim`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ verificationId }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || `HTTP ${res.status}`);
        }

        return res.json();
    };

    return { createChallenge, checkVerification, claimAttestation };
}
