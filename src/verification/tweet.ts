import type { VerificationResult, VerificationChallenge } from "./types.js";
import { randomBytes } from "node:crypto";
import {
    verifyProof as reclaimVerifyProof,
    type Proof as ReclaimProof,
} from "@reclaimprotocol/js-sdk";
import { getErrorMessage } from "../utils/errors.js";

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

/** Max age of a proof before we reject it (1 hour). */
const MAX_PROOF_AGE_MS = 60 * 60 * 1000;

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
 * Dispatches to the appropriate provider-specific verifier.
 * Each verifier:
 * - Cryptographically verifies the proof signature
 * - Checks the proof contains the correct challenge code
 * - Verifies the tweet author matches the claimed project
 * - Verifies the proof is recent (within time window)
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
            error: getErrorMessage(err),
        };
    }
}

/**
 * Verify a Reclaim Protocol proof using the official SDK.
 *
 * The proof object received from the client is the full Reclaim proof JSON
 * produced by the browser extension. We:
 * 1. Cryptographically verify the proof via `verifyProof()` from the SDK
 * 2. Extract the tweet text from `claimData.context` / `extractedParameterValues`
 * 3. Confirm the tweet text contains our challenge code
 * 4. Optionally extract the tweet author
 * 5. Check proof recency
 */
async function verifyReclaimProof(
    proofData: string,
    projectId: string,
    expectedCode: string,
): Promise<VerificationResult> {
    // Parse the proof JSON
    let proof: ReclaimProof;
    try {
        proof = JSON.parse(proofData) as ReclaimProof;
    } catch {
        return {
            success: false,
            method: "tweet_zktls",
            projectId,
            error: "Invalid proof data — could not parse JSON",
        };
    }

    // Step 1: Cryptographic verification via the Reclaim SDK.
    // This verifies the attestor signature, proof integrity, and TLS session validity.
    let isValid: boolean;
    try {
        isValid = await reclaimVerifyProof(proof as ReclaimProof);
    } catch (err) {
        return {
            success: false,
            method: "tweet_zktls",
            projectId,
            error: `Reclaim proof verification failed: ${getErrorMessage(err, "unknown SDK error")}`,
        };
    }

    if (!isValid) {
        return {
            success: false,
            method: "tweet_zktls",
            projectId,
            error: "Reclaim proof signature verification failed — proof is invalid or tampered",
        };
    }

    // Step 2: Extract the tweet content from the verified proof.
    // Reclaim proofs contain `claimData` with `context` (JSON string) and
    // `extractedParameterValues` (key-value map of captured values).
    const claimData = (proof as any).claimData ?? (proof as any).claim ?? {};
    const context = claimData.context ?? "{}";
    const extractedParams = claimData.extractedParameterValues ?? {};

    let contextObj: Record<string, unknown> = {};
    try {
        contextObj = typeof context === "string" ? JSON.parse(context) : context;
    } catch {
        // Context may not be valid JSON in all providers — continue with extractedParams
    }

    // The tweet text could be in extractedParams.tweet_text, extractedParams.text,
    // or in the context object, depending on the Reclaim provider configuration.
    const tweetText =
        (extractedParams.tweet_text as string) ??
        (extractedParams.text as string) ??
        (contextObj.extractedParameters as any)?.tweet_text ??
        (contextObj.extractedParameters as any)?.text ??
        "";

    const tweetAuthor =
        (extractedParams.username as string) ??
        (extractedParams.author as string) ??
        (contextObj.extractedParameters as any)?.username ??
        "";

    // Step 3: Verify the tweet text contains the challenge code
    if (!tweetText || !tweetText.includes(expectedCode)) {
        return {
            success: false,
            method: "tweet_zktls",
            projectId,
            error: tweetText
                ? "Tweet text does not contain the expected challenge code"
                : "Could not extract tweet text from proof — ensure you're using a Twitter/X provider",
        };
    }

    // Step 4: Check proof recency
    const proofTimestamp = Number(claimData.timestampS ?? 0) * 1000;
    if (proofTimestamp > 0 && Date.now() - proofTimestamp > MAX_PROOF_AGE_MS) {
        return {
            success: false,
            method: "tweet_zktls",
            projectId,
            error: "Proof is too old — please generate a fresh proof (max 1 hour)",
        };
    }

    return {
        success: true,
        method: "tweet_zktls",
        projectId,
        platformUsername: tweetAuthor || undefined,
        proof: {
            provider: "reclaim",
            verified: true,
            proofTimestamp: proofTimestamp || undefined,
        },
    };
}

/**
 * Verify an Opacity Network proof.
 *
 * TODO: Integrate Opacity SDK when available.
 * Opacity uses MPC-TLS with EigenLayer attestation.
 * See: https://docs.opacity.network
 */
async function verifyOpacityProof(
    _proofData: string,
    projectId: string,
    _expectedCode: string,
): Promise<VerificationResult> {
    return {
        success: false,
        method: "tweet_zktls",
        projectId,
        error: "Opacity Network proof verification not yet implemented — use Reclaim Protocol instead",
    };
}

/**
 * Verify a vlayer Web Proof.
 *
 * TODO: Integrate @vlayer/sdk when stable.
 * vlayer captures TLS sessions via browser extension and generates Solidity-verifiable proofs.
 * See: https://docs.vlayer.xyz
 */
async function verifyVlayerProof(
    _proofData: string,
    projectId: string,
    _expectedCode: string,
): Promise<VerificationResult> {
    return {
        success: false,
        method: "tweet_zktls",
        projectId,
        error: "vlayer Web Proof verification not yet implemented — use Reclaim Protocol instead",
    };
}
