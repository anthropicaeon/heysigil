/**
 * Verification API Schemas
 *
 * Zod schemas for developer identity verification endpoints.
 */

import { z } from "@hono/zod-openapi";
import {
    UUIDSchema,
    WalletAddressSchema,
    VerificationMethodSchema,
    VerificationStatusSchema,
    PaginationQuerySchema,
    PaginationResponseSchema,
    TimestampSchema,
} from "./common.js";

// ─── Request Schemas ─────────────────────────────────────

/**
 * POST /api/verify/challenge request body
 */
export const ChallengeRequestSchema = z
    .object({
        method: VerificationMethodSchema.openapi({
            description: "Verification method to use",
        }),
        projectId: z.string().min(1).openapi({
            example: "org/repo",
            description: "Project identifier (format depends on method)",
        }),
        walletAddress: WalletAddressSchema.openapi({
            description: "Wallet address to associate with verification",
        }),
    })
    .openapi("ChallengeRequest");

/**
 * POST /api/verify/check request body
 */
export const CheckRequestSchema = z
    .object({
        verificationId: UUIDSchema.openapi({
            description: "ID of the pending verification",
        }),
        tweetProof: z
            .object({
                proofData: z.string().openapi({
                    description: "zkTLS proof data",
                }),
                provider: z.enum(["reclaim", "opacity", "vlayer"]).openapi({
                    example: "reclaim",
                    description: "Proof provider",
                }),
                challengeCode: z.string().openapi({
                    description: "Challenge code included in tweet",
                }),
            })
            .optional()
            .openapi({
                description: "Required for tweet_zktls verification method",
            }),
    })
    .openapi("CheckRequest");

/**
 * GET /api/verify query parameters (list verifications)
 */
export const VerificationListQuerySchema = PaginationQuerySchema.extend({
    status: VerificationStatusSchema.optional().openapi({
        description: "Filter by verification status",
    }),
    method: VerificationMethodSchema.optional().openapi({
        description: "Filter by verification method",
    }),
    projectId: z.string().optional().openapi({
        example: "org/repo",
        description: "Filter by project identifier",
    }),
});

/**
 * Path parameter for verification ID
 */
export const VerificationIdParamSchema = z.object({
    id: UUIDSchema,
});

// ─── Response Schemas ────────────────────────────────────

/**
 * POST /api/verify/challenge response
 */
export const ChallengeResponseSchema = z
    .object({
        verificationId: UUIDSchema.openapi({
            description: "Use this ID to check verification status",
        }),
        challengeCode: z.string().openapi({
            example: "oc-a1b2c3d4e5f6",
            description: "Code to include in verification (file, DNS, tweet)",
        }),
        method: VerificationMethodSchema,
        projectId: z.string().openapi({ example: "org/repo" }),
        walletAddress: WalletAddressSchema,
        instructions: z.string().openapi({
            example: "Add a file at .well-known/pool-claim.txt...",
            description: "Human-readable verification instructions",
        }),
        authUrl: z.string().url().optional().openapi({
            example: "https://github.com/login/oauth/authorize?...",
            description: "OAuth URL for OAuth-based methods",
        }),
        expiresAt: TimestampSchema.openapi({
            description: "Challenge expiration time (24 hours from creation)",
        }),
    })
    .openapi("ChallengeResponse");

/**
 * POST /api/verify/check response
 */
export const CheckResponseSchema = z
    .object({
        verificationId: UUIDSchema,
        status: VerificationStatusSchema.openapi({
            description: "Current verification status (verified or pending)",
        }),
        success: z.boolean().openapi({
            description: "Whether verification succeeded",
        }),
        error: z.string().optional().openapi({
            description: "Error message if verification failed",
        }),
        method: VerificationMethodSchema,
        projectId: z.string().openapi({ example: "org/repo" }),
    })
    .openapi("CheckResponse");

/**
 * GET /api/verify/status/:id response (public, minimal)
 */
export const VerificationStatusResponseSchema = z
    .object({
        id: UUIDSchema,
        status: VerificationStatusSchema,
        method: VerificationMethodSchema,
        projectId: z.string().openapi({ example: "org/repo" }),
        createdAt: TimestampSchema,
        verifiedAt: TimestampSchema.nullable(),
    })
    .openapi("VerificationStatusResponse");

/**
 * Verification record in list
 */
export const VerificationListItemSchema = z
    .object({
        id: UUIDSchema,
        method: VerificationMethodSchema,
        projectId: z.string().openapi({ example: "org/repo" }),
        walletAddress: WalletAddressSchema,
        status: VerificationStatusSchema,
        platformUsername: z.string().nullable().openapi({
            example: "octocat",
            description: "Verified username on the platform",
        }),
        attestationUid: z.string().nullable().openapi({
            example: "0xabcdef...",
            description: "EAS attestation UID if claimed",
        }),
        createdAt: TimestampSchema,
        verifiedAt: TimestampSchema.nullable(),
    })
    .openapi("VerificationListItem");

/**
 * GET /api/verify response (list with pagination)
 */
export const VerificationListResponseSchema = z
    .object({
        verifications: z.array(VerificationListItemSchema),
        pagination: PaginationResponseSchema,
    })
    .openapi("VerificationListResponse");

/**
 * GET /api/verify/:id response (full details, authenticated)
 */
export const VerificationDetailResponseSchema = z
    .object({
        id: UUIDSchema,
        method: VerificationMethodSchema,
        projectId: z.string().openapi({ example: "org/repo" }),
        walletAddress: WalletAddressSchema,
        status: VerificationStatusSchema,
        platformUsername: z.string().nullable(),
        attestationUid: z.string().nullable(),
        createdAt: TimestampSchema,
        verifiedAt: TimestampSchema.nullable(),
    })
    .openapi("VerificationDetailResponse");

/**
 * OAuth callback query parameters
 */
export const OAuthCallbackQuerySchema = z.object({
    code: z.string().optional().openapi({
        description: "OAuth authorization code",
    }),
    state: z.string().optional().openapi({
        description: "State parameter (verification ID)",
    }),
    error: z.string().optional().openapi({
        description: "OAuth error code if authorization failed",
    }),
});
