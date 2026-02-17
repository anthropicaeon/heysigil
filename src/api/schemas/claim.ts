/**
 * Claim API Schemas
 *
 * Zod schemas for EAS attestation claiming endpoints.
 */

import { z } from "@hono/zod-openapi";
import {
    UUIDSchema,
    WalletAddressSchema,
    TxHashSchema,
    VerificationMethodSchema,
    TimestampSchema,
} from "./common.js";

// ─── Request Schemas ─────────────────────────────────────

/**
 * POST /api/claim request body
 */
export const ClaimRequestSchema = z
    .object({
        verificationId: UUIDSchema.openapi({
            description: "ID of the verified verification record",
        }),
        rpcUrl: z.string().url().optional().openapi({
            example: "https://mainnet.base.org",
            description: "Custom RPC URL for attestation (defaults to Base mainnet)",
        }),
    })
    .openapi("ClaimRequest");

/**
 * Path parameter for project ID (greedy, supports slashes)
 */
export const ClaimProjectIdParamSchema = z.object({
    projectId: z.string().openapi({
        example: "github.com/org/repo",
        description: "Project identifier (URL-encoded, supports slashes)",
    }),
});

// ─── Response Schemas ────────────────────────────────────

/**
 * POST /api/claim success response
 */
export const ClaimSuccessResponseSchema = z
    .object({
        success: z.literal(true),
        attestationUid: z.string().openapi({
            example: "0xabcdef1234567890...",
            description: "EAS attestation UID",
        }),
        txHash: TxHashSchema.openapi({
            description: "Transaction hash of attestation creation",
        }),
        projectId: z.string().openapi({
            example: "github.com/org/repo",
            description: "Claimed project identifier",
        }),
        walletAddress: WalletAddressSchema.openapi({
            description: "Developer wallet that claimed the project",
        }),
    })
    .openapi("ClaimSuccessResponse");

/**
 * POST /api/claim already claimed response
 */
export const ClaimAlreadyIssuedResponseSchema = z
    .object({
        message: z.literal("Attestation already issued"),
        attestationUid: z.string().openapi({
            example: "0xabcdef1234567890...",
            description: "Existing attestation UID",
        }),
    })
    .openapi("ClaimAlreadyIssuedResponse");

/**
 * GET /api/claim/status/:projectId response (claimed)
 * Note: ownerWallet intentionally omitted from public endpoint.
 * Wallet can be discovered via attestationUid lookup if needed.
 */
export const ClaimStatusClaimedResponseSchema = z
    .object({
        claimed: z.literal(true),
        projectId: z.string().openapi({
            example: "github.com/org/repo",
        }),
        verificationMethod: VerificationMethodSchema.openapi({
            description: "Method used to verify ownership",
        }),
        attestationUid: z.string().nullable().openapi({
            example: "0xabcdef1234567890...",
            description: "EAS attestation UID if issued",
        }),
        verifiedAt: TimestampSchema.nullable().openapi({
            description: "When verification was completed",
        }),
    })
    .openapi("ClaimStatusClaimedResponse");

/**
 * GET /api/claim/status/:projectId response (unclaimed)
 */
export const ClaimStatusUnclaimedResponseSchema = z
    .object({
        claimed: z.literal(false),
        projectId: z.string().openapi({
            example: "github.com/org/repo",
        }),
    })
    .openapi("ClaimStatusUnclaimedResponse");

/**
 * Combined claim status response (discriminated union)
 */
export const ClaimStatusResponseSchema = z.union([
    ClaimStatusClaimedResponseSchema,
    ClaimStatusUnclaimedResponseSchema,
]);
