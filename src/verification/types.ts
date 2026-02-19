export type VerificationMethod =
    | "github_oauth"
    | "github_oidc"
    | "github_file"
    | "sigil_file"
    | "facebook_oauth"
    | "instagram_graph"
    | "tweet_zktls"
    | "domain_dns"
    | "domain_file"
    | "domain_meta"
    | "agent_keypair";

export type VerificationStatus = "pending" | "verified" | "failed" | "expired";

/**
 * Platform identifiers for identity verification.
 * Derived from const array for runtime + type safety.
 */
export const PLATFORMS = ["github", "twitter", "instagram", "facebook", "domain", "agent"] as const;
export type Platform = (typeof PLATFORMS)[number];

export interface VerificationRequest {
    /** Unique verification attempt ID */
    id: string;
    /** Method used for verification */
    method: VerificationMethod;
    /** The project identifier (e.g., "github.com/org/repo", "example.com") */
    projectId: string;
    /** Wallet address of the claimant */
    walletAddress: string;
    /** Unique challenge code for this verification */
    challengeCode: string;
    /** Current status */
    status: VerificationStatus;
    /** Platform-specific username (e.g., GitHub username) */
    platformUsername?: string;
    /** When the verification was created */
    createdAt: Date;
    /** When the verification was completed */
    verifiedAt?: Date;
    /** EAS attestation UID if issued */
    attestationUid?: string;
}

/**
 * Discriminated union for verification results.
 * Enables TypeScript to narrow types based on `success` property.
 */
export type VerificationResult = VerificationSuccess | VerificationFailure;

export interface VerificationSuccess {
    success: true;
    method: VerificationMethod;
    projectId: string;
    platformUsername?: string;
    /** Platform-specific proof data */
    proof?: Record<string, unknown>;
}

export interface VerificationFailure {
    success: false;
    method: VerificationMethod;
    projectId: string;
    error: string;
    platformUsername?: string;
    /** Platform-specific proof data */
    proof?: Record<string, unknown>;
}

export interface VerificationChallenge {
    id: string;
    challengeCode: string;
    method: VerificationMethod;
    projectId: string;
    instructions: string;
}

// ─── Method-to-Platform Mapping ──────────────────────

/**
 * Maps verification method to canonical platform name.
 */
export const METHOD_TO_PLATFORM: Record<VerificationMethod, Platform> = {
    github_oauth: "github",
    github_oidc: "github",
    github_file: "github",
    sigil_file: "github",
    facebook_oauth: "facebook",
    instagram_graph: "instagram",
    tweet_zktls: "twitter",
    domain_dns: "domain",
    domain_file: "domain",
    domain_meta: "domain",
    agent_keypair: "agent",
};

/**
 * Get platform name from verification method.
 */
export function getPlatformFromMethod(method: VerificationMethod): Platform {
    return METHOD_TO_PLATFORM[method];
}
