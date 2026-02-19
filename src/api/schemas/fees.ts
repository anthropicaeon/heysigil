/**
 * Fee Distribution API Schemas
 *
 * Zod schemas for the fee distribution audit trail endpoints.
 */

import { z } from "@hono/zod-openapi";
import {
    WalletAddressSchema,
    TxHashSchema,
    PoolIdSchema,
    TokenAddressSchema,
    WeiAmountSchema,
    PaginationQuerySchema,
    PaginationResponseSchema,
    FeeEventTypeSchema,
    TimestampSchema,
} from "./common.js";

// ─── Fee Distribution Schema ─────────────────────────────

/**
 * Single fee distribution event
 */
export const FeeDistributionSchema = z
    .object({
        id: z.number().int().openapi({ example: 1, description: "Database record ID" }),
        eventType: FeeEventTypeSchema,
        txHash: TxHashSchema,
        blockNumber: z.number().int().openapi({ example: 12345678 }),
        logIndex: z.number().int().openapi({ example: 0 }),
        poolId: PoolIdSchema,
        tokenAddress: TokenAddressSchema,
        amount: WeiAmountSchema.nullable().openapi({ description: "Total amount in wei" }),
        devAmount: WeiAmountSchema.nullable().openapi({ description: "Developer share in wei" }),
        protocolAmount: WeiAmountSchema.nullable().openapi({
            description: "Protocol share in wei",
        }),
        devAddress: WalletAddressSchema.nullable().openapi({
            description: "Developer wallet address",
        }),
        recipientAddress: WalletAddressSchema.nullable().openapi({
            description: "Fee recipient address",
        }),
        blockTimestamp: TimestampSchema,
        indexedAt: TimestampSchema,
        projectId: z.string().nullable().openapi({ example: "github:org/repo" }),
        explorerUrl: z.string().url().openapi({
            example: "https://basescan.org/tx/0x1234...",
            description: "Block explorer link",
        }),
    })
    .openapi("FeeDistribution");

// ─── Query Schemas ───────────────────────────────────────

/**
 * GET /distributions query parameters
 */
export const DistributionsQuerySchema = PaginationQuerySchema.extend({
    type: FeeEventTypeSchema.optional().openapi({
        description: "Filter by event type",
    }),
    pool: z.string().optional().openapi({
        example: "0xabcdef...",
        description: "Filter by pool ID",
    }),
    dev: z.string().optional().openapi({
        example: "0x742d35Cc...",
        description: "Filter by developer address",
    }),
    token: z.string().optional().openapi({
        example: "0x4200000...",
        description: "Filter by token address",
    }),
});

/**
 * Path parameter for projectId (URL-encoded)
 */
export const ProjectIdParamSchema = z.object({
    projectId: z.string().openapi({
        example: "github:org/repo",
        description: "Project identifier (URL-encoded)",
    }),
});

/**
 * Path parameter for poolId
 */
export const PoolIdParamSchema = z.object({
    poolId: PoolIdSchema,
});

/**
 * Path parameter for developer address
 */
export const DevAddressParamSchema = z.object({
    address: WalletAddressSchema,
});

/**
 * Path parameter for transaction hash
 */
export const TxHashParamSchema = z.object({
    txHash: TxHashSchema,
});

// ─── Response Schemas ────────────────────────────────────

/**
 * GET /distributions response
 */
export const DistributionsResponseSchema = z
    .object({
        distributions: z.array(FeeDistributionSchema),
        pagination: PaginationResponseSchema,
    })
    .openapi("DistributionsResponse");

/**
 * GET /project/:projectId response
 */
export const ProjectDistributionsResponseSchema = z
    .object({
        projectId: z.string().openapi({ example: "github:org/repo" }),
        distributions: z.array(FeeDistributionSchema),
        pagination: PaginationResponseSchema,
    })
    .openapi("ProjectDistributionsResponse");

/**
 * GET /pool/:poolId response
 */
export const PoolDistributionsResponseSchema = z
    .object({
        poolId: PoolIdSchema,
        distributions: z.array(FeeDistributionSchema),
        pagination: PaginationResponseSchema,
    })
    .openapi("PoolDistributionsResponse");

/**
 * Developer earnings summary
 */
export const DevEarningsSummarySchema = z
    .object({
        directEarnedWei: WeiAmountSchema,
        assignedFromEscrowWei: WeiAmountSchema,
        totalEarnedWei: WeiAmountSchema,
        totalClaimedWei: WeiAmountSchema,
        unclaimedWei: WeiAmountSchema,
    })
    .openapi("DevEarningsSummary");

/**
 * GET /dev/:address response
 */
export const DevDistributionsResponseSchema = z
    .object({
        address: WalletAddressSchema,
        summary: DevEarningsSummarySchema,
        distributions: z.array(FeeDistributionSchema),
        pagination: PaginationResponseSchema,
    })
    .openapi("DevDistributionsResponse");

/**
 * GET /totals response
 */
export const FeeTotalsResponseSchema = z
    .object({
        totalDistributedWei: WeiAmountSchema,
        totalDevClaimedWei: WeiAmountSchema,
        totalProtocolClaimedWei: WeiAmountSchema,
        totalEscrowedWei: WeiAmountSchema,
        distributionCount: z.number().int().openapi({ example: 1234 }),
        uniqueDevs: z.number().int().openapi({ example: 42 }),
        uniquePools: z.number().int().openapi({ example: 15 }),
        lastIndexedBlock: z.number().int().nullable().openapi({ example: 12345678 }),
        lastIndexedAt: TimestampSchema.nullable(),
    })
    .openapi("FeeTotalsResponse");

/**
 * GET /verify/:txHash response (found)
 */
export const TxVerifyFoundResponseSchema = z
    .object({
        txHash: TxHashSchema,
        found: z.literal(true),
        eventCount: z.number().int().openapi({ example: 2 }),
        events: z.array(FeeDistributionSchema),
        explorerUrl: z.string().url().openapi({
            example: "https://basescan.org/tx/0x1234...",
        }),
    })
    .openapi("TxVerifyFoundResponse");

/**
 * GET /verify/:txHash response (not found)
 */
export const TxVerifyNotFoundResponseSchema = z
    .object({
        txHash: TxHashSchema,
        found: z.literal(false),
        message: z.string().openapi({
            example: "No fee distribution events found for this transaction",
        }),
        events: z.tuple([]).openapi({
            description: "Empty array (no events found)",
        }),
        explorerUrl: z.string().url(),
    })
    .openapi("TxVerifyNotFoundResponse");

/**
 * Combined verify response (discriminated union)
 */
export const TxVerifyResponseSchema = z.union([
    TxVerifyFoundResponseSchema,
    TxVerifyNotFoundResponseSchema,
]);

/**
 * Indexer health status
 */
export const IndexerHealthStatusSchema = z
    .enum(["healthy", "degraded", "unhealthy", "stopped", "disabled"])
    .openapi({
        example: "healthy",
        description: "Indexer health status",
    });

/**
 * GET /health response
 */
export const IndexerHealthResponseSchema = z
    .object({
        status: IndexerHealthStatusSchema,
        message: z.string().optional().openapi({
            example: "Fee indexer not configured (SIGIL_FEE_VAULT_ADDRESS not set)",
        }),
        isRunning: z.boolean().openapi({ example: true }),
        lastProcessedBlock: z.number().int().nullable().openapi({ example: 12345678 }),
        currentBlock: z.number().int().nullable().openapi({ example: 12345680 }),
        blockLag: z.number().int().nullable().openapi({
            example: 2,
            description: "Number of blocks behind current",
        }),
        lastError: z.string().nullable().openapi({ example: null }),
        eventsIndexed: z.number().int().openapi({ example: 5432 }),
        startedAt: TimestampSchema.nullable(),
    })
    .openapi("IndexerHealthResponse");
