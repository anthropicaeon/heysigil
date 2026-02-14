import type { VerificationResult, VerificationChallenge } from "./types.js";
import { randomBytes } from "node:crypto";

/**
 * Tweet-a-code verification via zkTLS.
 *
 * Flow:
 * 1. Backend generates a challenge code
 * 2. User tweets the code along with their wallet address
 * 3. User generates a zkTLS proof (via Reclaim Protocol, Opacity, or vlayer)
 * 4. User submits the proof to our backend
 * 5. Backend verifies the proof cryptographically
 *
 * This module handles steps 1, 2 (instructions), and 5 (proof verification).
 * The actual zkTLS proof generation happens client-side in the user's browser.
 */

/**
 * Generate a tweet verification challenge.
 */
export function createTweetChallenge(
  projectId: string,
  walletAddress: string,
): VerificationChallenge {
  const code = `claim-${randomBytes(6).toString("hex")}`;

  return {
    id: randomBytes(16).toString("hex"),
    challengeCode: code,
    method: "tweet_zktls",
    projectId,
    instructions: [
      `1. Post this tweet from the @${projectId} account:`,
      ``,
      `   "Verifying project ownership for Sigil. Code: ${code} Wallet: ${walletAddress}"`,
      ``,
      `2. After posting, open the tweet in your browser`,
      `3. Use the Reclaim Protocol browser extension to generate a proof`,
      `4. Submit the proof below`,
    ].join("\n"),
  };
}

/**
 * Verify a zkTLS proof of a tweet.
 *
 * This is a placeholder for the actual proof verification.
 * In production, this would:
 * - Verify the Reclaim Protocol proof signature
 * - Check the proof contains the correct challenge code
 * - Verify the tweet author matches the claimed project
 * - Verify the proof is recent (within time window)
 */
export async function verifyTweetProof(
  proof: {
    /** Raw proof data from zkTLS provider */
    proofData: string;
    /** Which zkTLS provider generated the proof */
    provider: "reclaim" | "opacity" | "vlayer";
    /** The challenge code that was tweeted */
    challengeCode: string;
  },
  projectId: string,
  expectedCode: string,
): Promise<VerificationResult> {
  if (proof.challengeCode !== expectedCode) {
    return {
      success: false,
      method: "tweet_zktls",
      projectId,
      error: "Challenge code mismatch",
    };
  }

  try {
    switch (proof.provider) {
      case "reclaim":
        return await verifyReclaimProof(proof.proofData, projectId, expectedCode);
      case "opacity":
        return await verifyOpacityProof(proof.proofData, projectId, expectedCode);
      case "vlayer":
        return await verifyVlayerProof(proof.proofData, projectId, expectedCode);
      default:
        return {
          success: false,
          method: "tweet_zktls",
          projectId,
          error: `Unsupported zkTLS provider: ${proof.provider}`,
        };
    }
  } catch (err) {
    return {
      success: false,
      method: "tweet_zktls",
      projectId,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/**
 * Verify a Reclaim Protocol proof.
 *
 * TODO: Integrate @reclaimprotocol/js-sdk for actual proof verification.
 * For now, this is a structured placeholder.
 *
 * Production implementation:
 *   import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
 *   const isValid = await ReclaimProofRequest.verifySignedProof(proofData);
 */
async function verifyReclaimProof(
  proofData: string,
  projectId: string,
  expectedCode: string,
): Promise<VerificationResult> {
  // Parse the proof JSON
  let parsed: { extractedData?: { text?: string; author?: string }; signature?: string };
  try {
    parsed = JSON.parse(proofData);
  } catch {
    return {
      success: false,
      method: "tweet_zktls",
      projectId,
      error: "Invalid proof data — could not parse JSON",
    };
  }

  // In production: cryptographically verify the proof signature here
  // For now, validate structure
  if (!parsed.extractedData?.text || !parsed.signature) {
    return {
      success: false,
      method: "tweet_zktls",
      projectId,
      error: "Proof missing required fields (extractedData.text, signature)",
    };
  }

  // Check that the tweet text contains the challenge code
  if (!parsed.extractedData.text.includes(expectedCode)) {
    return {
      success: false,
      method: "tweet_zktls",
      projectId,
      error: "Tweet text does not contain the expected challenge code",
    };
  }

  return {
    success: true,
    method: "tweet_zktls",
    projectId,
    platformUsername: parsed.extractedData.author,
    proof: { provider: "reclaim", verified: true },
  };
}

/**
 * Verify an Opacity Network proof.
 * TODO: Integrate Opacity SDK.
 */
async function verifyOpacityProof(
  proofData: string,
  projectId: string,
  _expectedCode: string,
): Promise<VerificationResult> {
  return {
    success: false,
    method: "tweet_zktls",
    projectId,
    error: "Opacity Network proof verification not yet implemented",
  };
}

/**
 * Verify a vlayer Web Proof.
 * TODO: Integrate @vlayer/sdk.
 */
async function verifyVlayerProof(
  proofData: string,
  projectId: string,
  _expectedCode: string,
): Promise<VerificationResult> {
  return {
    success: false,
    method: "tweet_zktls",
    projectId,
    error: "vlayer Web Proof verification not yet implemented",
  };
}
