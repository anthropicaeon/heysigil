/**
 * VerifyFlow Types
 */

export interface Method {
    id: string;
    name: string;
    description: string;
    projectIdFormat: string;
    requiresOAuth: boolean;
    /** Whether this method is recommended (shown prominently) */
    recommended?: boolean;
    /** Badge text like "Fastest", "Most Secure" */
    badge?: string;
    /** Usage percentage for social proof */
    popularity?: number;
}

export type Step = "method" | "details" | "challenge" | "result";

export interface ChallengeResponse {
    verificationId: string;
    challengeCode: string;
    method: string;
    projectId: string;
    walletAddress: string;
    instructions: string;
    authUrl?: string;
    expiresAt: string;
}

export interface CheckResult {
    verificationId: string;
    status: string;
    success: boolean;
    error?: string;
    attestationUid?: string;
}
