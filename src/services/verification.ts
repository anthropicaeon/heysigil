/**
 * Verification Service
 *
 * Business logic for verification operations, extracted from route handlers.
 * Enables reuse outside HTTP context and improves testability.
 */

import type { VerificationMethod } from "../verification/types.js";
import { getGitHubAuthUrl, verifyGitHubFile } from "../verification/github.js";
import { verifyDomainDns, verifyDomainFile, verifyDomainMeta } from "../verification/domain.js";
import { createTweetChallenge, verifyTweetProof } from "../verification/tweet.js";
import { getFacebookAuthUrl } from "../verification/facebook.js";
import { getInstagramAuthUrl } from "../verification/instagram.js";

// ─── Types ────────────────────────────────────────────────

interface InstructionResult {
    instructions: string;
    authUrl?: string;
}

interface VerificationInput {
    method: VerificationMethod;
    projectId: string;
    walletAddress: string;
    challengeCode: string;
}

interface CheckInput {
    method: VerificationMethod;
    projectId: string;
    walletAddress: string;
    challengeCode: string;
    tweetProof?: {
        proofData: string;
        provider: "reclaim" | "opacity" | "vlayer";
        challengeCode: string;
    };
}

interface CheckResult {
    success: boolean;
    error?: string;
    platformUsername?: string;
    proof?: Record<string, unknown>;
}

// ─── Instruction Builder ──────────────────────────────────

/**
 * Build method-specific instructions for a verification challenge.
 * Pure function with no side effects.
 */
export function buildVerificationInstructions(
    input: VerificationInput,
    verificationId: string,
): InstructionResult | { error: string } {
    const { method, projectId, walletAddress, challengeCode } = input;

    switch (method) {
        case "github_oauth":
            return {
                authUrl: getGitHubAuthUrl(verificationId),
                instructions: `Click the authorization URL to verify you have admin access to ${projectId}.`,
            };

        case "github_file":
            return {
                instructions: [
                    `Add a file at .well-known/pool-claim.txt in the ${projectId} repo with this content:`,
                    ``,
                    `verification-code=${challengeCode}`,
                    `wallet-address=${walletAddress}`,
                    ``,
                    `Then call POST /api/verify/check with your verification ID.`,
                ].join("\n"),
            };

        case "domain_dns":
            return {
                instructions: [
                    `Add this DNS TXT record:`,
                    ``,
                    `  _poolclaim.${projectId} TXT "pool-claim-verify=${walletAddress}:${challengeCode}"`,
                    ``,
                    `DNS propagation can take 15 minutes to 72 hours.`,
                    `Then call POST /api/verify/check with your verification ID.`,
                ].join("\n"),
            };

        case "domain_file":
            return {
                instructions: [
                    `Place a file at: https://${projectId}/.well-known/pool-claim.txt`,
                    ``,
                    `Content:`,
                    `verification-token=${challengeCode}`,
                    `wallet-address=${walletAddress}`,
                    ``,
                    `Then call POST /api/verify/check with your verification ID.`,
                ].join("\n"),
            };

        case "domain_meta":
            return {
                instructions: [
                    `Add this meta tag to the <head> of https://${projectId}:`,
                    ``,
                    `<meta name="pool-claim-verification" content="${walletAddress}:${challengeCode}" />`,
                    ``,
                    `Then call POST /api/verify/check with your verification ID.`,
                ].join("\n"),
            };

        case "tweet_zktls": {
            const tweetChallenge = createTweetChallenge(projectId, walletAddress);
            return { instructions: tweetChallenge.instructions };
        }

        case "facebook_oauth":
            return {
                authUrl: getFacebookAuthUrl(verificationId),
                instructions: `Click the authorization URL to verify you admin the Facebook page "${projectId}".`,
            };

        case "instagram_graph":
            return {
                authUrl: getInstagramAuthUrl(verificationId),
                instructions: `Click the authorization URL to verify you own the Instagram account @${projectId}.`,
            };

        default:
            return { error: `Unsupported verification method: ${method}` };
    }
}

// ─── Verification Executor ────────────────────────────────

/**
 * Execute verification check for non-OAuth methods.
 * Returns verification result without database operations.
 */
export async function executeVerificationCheck(
    input: CheckInput,
): Promise<CheckResult | { error: string }> {
    const { method, projectId, walletAddress, challengeCode, tweetProof } = input;

    switch (method) {
        case "github_file":
            return verifyGitHubFile(projectId, challengeCode, walletAddress);

        case "domain_dns":
            return verifyDomainDns(projectId, challengeCode, walletAddress);

        case "domain_file":
            return verifyDomainFile(projectId, challengeCode, walletAddress);

        case "domain_meta":
            return verifyDomainMeta(projectId, challengeCode, walletAddress);

        case "tweet_zktls":
            if (!tweetProof) {
                return { error: "Missing tweetProof for tweet_zktls verification" };
            }
            return verifyTweetProof(tweetProof, projectId, challengeCode);

        case "github_oauth":
        case "facebook_oauth":
        case "instagram_graph":
            return { error: `Method ${method} uses OAuth — check the callback instead` };

        default:
            return { error: `Unsupported verification method: ${method}` };
    }
}

/**
 * Check if a method requires OAuth flow (callback-based verification)
 */
export function isOAuthMethod(method: VerificationMethod): boolean {
    return ["github_oauth", "facebook_oauth", "instagram_graph"].includes(method);
}

/**
 * Check if a method requires manual verification (file/DNS/tweet-based)
 */
export function isManualMethod(method: VerificationMethod): boolean {
    return ["github_file", "domain_dns", "domain_file", "domain_meta", "tweet_zktls"].includes(
        method,
    );
}
