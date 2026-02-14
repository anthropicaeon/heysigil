export interface AttestationData {
  /** Platform used for verification (github, facebook, instagram, twitter, domain) */
  platform: string;
  /** Project identifier (e.g., "github.com/org/repo") */
  projectId: string;
  /** Wallet address of the verified owner */
  wallet: string;
  /** Unix timestamp of verification */
  verifiedAt: number;
  /** Whether this attestation confirms ownership */
  isOwner: boolean;
}

export interface AttestationResult {
  /** EAS attestation UID */
  uid: string;
  /** Transaction hash */
  txHash: string;
}
