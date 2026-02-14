export type VerificationMethod =
  | "github_oauth"
  | "github_oidc"
  | "github_file"
  | "facebook_oauth"
  | "instagram_graph"
  | "tweet_zktls"
  | "domain_dns"
  | "domain_file"
  | "domain_meta";

export type VerificationStatus = "pending" | "verified" | "failed" | "expired";

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

export interface VerificationResult {
  success: boolean;
  method: VerificationMethod;
  projectId: string;
  platformUsername?: string;
  /** Platform-specific proof data */
  proof?: Record<string, unknown>;
  error?: string;
}

export interface VerificationChallenge {
  id: string;
  challengeCode: string;
  method: VerificationMethod;
  projectId: string;
  instructions: string;
}
