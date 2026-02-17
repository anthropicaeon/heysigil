/**
 * Common OpenAPI Schemas
 *
 * Shared Zod schemas used across multiple API routes.
 * These provide consistent validation and OpenAPI documentation.
 */

import { z } from "@hono/zod-openapi";

// ─── Primitive Schemas ───────────────────────────────────

/**
 * Ethereum wallet address (0x + 40 hex chars)
 */
export const WalletAddressSchema = z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
    .openapi({
        example: "0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00",
        description: "Ethereum wallet address (checksummed or lowercase)",
    });

/**
 * Transaction hash (0x + 64 hex chars)
 */
export const TxHashSchema = z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format")
    .openapi({
        example: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        description: "Ethereum transaction hash",
    });

/**
 * UUID v4 format
 */
export const UUIDSchema = z.string().uuid().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "UUID v4 identifier",
});

/**
 * ISO 8601 timestamp string
 */
export const TimestampSchema = z.string().datetime().openapi({
    example: "2024-01-15T12:30:00.000Z",
    description: "ISO 8601 datetime",
    format: "date-time",
});

/**
 * Pool ID (bytes32 hex string)
 */
export const PoolIdSchema = z
    .string()
    .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid pool ID format")
    .openapi({
        example: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        description: "Uniswap V4 pool ID (bytes32)",
    });

/**
 * Token/Contract address (same as wallet but semantically different)
 */
export const TokenAddressSchema = z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid token address format")
    .openapi({
        example: "0x4200000000000000000000000000000000000006",
        description: "ERC-20 token contract address",
    });

/**
 * Wei amount as string (BigInt serialized)
 */
export const WeiAmountSchema = z.string().regex(/^\d+$/, "Must be a numeric string").openapi({
    example: "1000000000000000000",
    description: "Amount in wei (BigInt as string)",
});

/**
 * Session ID (UUID format)
 */
export const SessionIdSchema = z.string().uuid().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Chat session UUID",
});

// ─── Pagination Schemas ──────────────────────────────────

/**
 * Pagination query parameters
 */
export const PaginationQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20).openapi({
        example: 20,
        description: "Maximum number of results (1-100)",
    }),
    offset: z.coerce.number().int().min(0).default(0).openapi({
        example: 0,
        description: "Number of results to skip",
    }),
});

/**
 * Pagination response metadata
 */
export const PaginationResponseSchema = z
    .object({
        limit: z.number().int().openapi({ example: 20 }),
        offset: z.number().int().openapi({ example: 0 }),
        count: z
            .number()
            .int()
            .openapi({ example: 15, description: "Number of results in this response" }),
        hasMore: z
            .boolean()
            .openapi({ example: false, description: "Whether more results are available" }),
    })
    .openapi("PaginationResponse");

// ─── Error Schemas ───────────────────────────────────────

/**
 * Standard error response
 */
export const ErrorResponseSchema = z
    .object({
        error: z.string().openapi({
            example: "Missing required field",
            description: "Error message",
        }),
        hint: z.string().optional().openapi({
            example: "Include 'method' in request body",
            description: "Helpful hint for resolving the error",
        }),
        retryAfter: z.number().optional().openapi({
            example: 60,
            description: "Seconds to wait before retrying (for rate limits)",
        }),
    })
    .openapi("ErrorResponse");

/**
 * Not found error response
 */
export const NotFoundResponseSchema = z
    .object({
        error: z.string().openapi({
            example: "Resource not found",
        }),
    })
    .openapi("NotFoundResponse");

/**
 * Rate limit error response
 */
export const RateLimitResponseSchema = z
    .object({
        error: z.string().openapi({
            example: "Rate limit exceeded. Please slow down.",
        }),
        retryAfter: z.number().optional().openapi({
            example: 60,
        }),
    })
    .openapi("RateLimitResponse");

// ─── Verification Method Schema ──────────────────────────

/**
 * Supported verification methods
 */
export const VerificationMethodSchema = z
    .enum([
        "github_oauth",
        "github_oidc",
        "github_file",
        "facebook_oauth",
        "instagram_graph",
        "tweet_zktls",
        "domain_dns",
        "domain_file",
        "domain_meta",
    ])
    .openapi({
        example: "github_oauth",
        description: "Verification method identifier",
    });

/**
 * Verification status values
 */
export const VerificationStatusSchema = z
    .enum(["pending", "verified", "failed", "expired"])
    .openapi({
        example: "verified",
        description: "Current verification status",
    });

// ─── Platform Schema ─────────────────────────────────────

/**
 * Supported platforms for developer links
 */
export const PlatformSchema = z
    .enum(["github", "twitter", "facebook", "instagram", "domain"])
    .openapi({
        example: "github",
        description: "Platform identifier",
    });

// ─── Fee Event Type Schema ───────────────────────────────

/**
 * Fee distribution event types
 */
export const FeeEventTypeSchema = z
    .enum(["deposit", "escrow", "dev_assigned", "expired", "dev_claimed", "protocol_claimed"])
    .openapi({
        example: "deposit",
        description: "Type of fee distribution event",
    });
