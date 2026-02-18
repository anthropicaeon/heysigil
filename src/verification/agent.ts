/**
 * Agent Key-Pair Verification
 *
 * Agents attest their identity by signing a challenge message with their
 * private key. This is the most natural auth pattern for autonomous agents —
 * no GitHub, no OAuth, just cryptographic proof of key ownership.
 *
 * Flow:
 *   1. Agent requests a challenge → receives a random nonce
 *   2. Agent signs the nonce with their private key (EIP-191)
 *   3. Backend recovers the signer, confirms it matches the expected wallet
 *   4. Attestation issued via EAS
 */

import { ethers } from "ethers";
import { randomBytes } from "node:crypto";
import type { VerificationResult, VerificationChallenge } from "./types.js";
import { buildSuccess, buildFailure } from "./result-builder.js";

/**
 * Generate a challenge for agent key-pair verification.
 *
 * The agent must sign this challenge message with their private key
 * and submit the signature for verification.
 */
export function createAgentChallenge(
    projectId: string,
    walletAddress: string,
): VerificationChallenge {
    const challengeCode = randomBytes(16).toString("hex");

    return {
        id: `agent-${Date.now()}-${challengeCode.slice(0, 8)}`,
        challengeCode,
        method: "agent_keypair",
        projectId,
        instructions: [
            `Sign the following message with your agent's private key:`,
            ``,
            `  sigil-agent-verify:${challengeCode}`,
            ``,
            `Use EIP-191 personal_sign. Example with ethers.js:`,
            ``,
            `  const wallet = new ethers.Wallet(AGENT_PRIVATE_KEY);`,
            `  const signature = await wallet.signMessage("sigil-agent-verify:${challengeCode}");`,
            ``,
            `Then submit the signature to POST /api/verify/check with:`,
            `  { verificationId, signature }`,
        ].join("\n"),
    };
}

/**
 * Verify an agent's key-pair signature.
 *
 * Recovers the signer address from the EIP-191 signature and confirms
 * it matches the expected wallet address. This proves the agent controls
 * the private key associated with their claimed wallet.
 */
export async function verifyAgentSignature(
    signatureData: string,
    projectId: string,
    expectedCode: string,
    expectedWallet?: string,
): Promise<VerificationResult> {
    try {
        // Parse the signature data — expected format: JSON with { signature, challengeCode }
        let signature: string;
        let challengeCode: string;

        try {
            const parsed = JSON.parse(signatureData);
            signature = parsed.signature;
            challengeCode = parsed.challengeCode || expectedCode;
        } catch {
            // If not JSON, treat the entire string as the signature
            signature = signatureData;
            challengeCode = expectedCode;
        }

        if (!signature) {
            return buildFailure(
                "agent_keypair",
                projectId,
                "No signature provided. Sign the challenge message with your agent's private key.",
            );
        }

        // Reconstruct the message the agent should have signed
        const message = `sigil-agent-verify:${challengeCode}`;

        // Recover the signer address from the signature (EIP-191)
        let recoveredAddress: string;
        try {
            recoveredAddress = ethers.verifyMessage(message, signature);
        } catch (err) {
            return buildFailure(
                "agent_keypair",
                projectId,
                `Invalid signature format. Ensure you signed the exact message: "${message}"`,
            );
        }

        // If we have an expected wallet, verify it matches
        if (expectedWallet) {
            if (recoveredAddress.toLowerCase() !== expectedWallet.toLowerCase()) {
                return buildFailure(
                    "agent_keypair",
                    projectId,
                    `Signer mismatch. Expected ${expectedWallet}, got ${recoveredAddress}. ` +
                        `Ensure you're signing with the correct agent key.`,
                );
            }
        }

        return buildSuccess("agent_keypair", projectId, recoveredAddress, {
            recoveredAddress,
            message,
            signaturePrefix: signature.slice(0, 20) + "...",
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return buildFailure("agent_keypair", projectId, `Verification failed: ${message}`);
    }
}
