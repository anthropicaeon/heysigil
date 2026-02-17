/**
 * Fee Distribution API Routes
 *
 * Public endpoints for querying the transparent fee audit trail.
 * All endpoints are read-only and publicly accessible.
 */

import { createRoute, OpenAPIHono, type z, type RouteHandler } from "@hono/zod-openapi";
import {
    findDistributions,
    findByPoolId,
    findByDevAddress,
    findByTxHash,
    getAggregateStats,
    type FeeEventType,
    type DbFeeDistribution,
} from "../../db/repositories/index.js";
import { getFeeIndexer, isFeeIndexerConfigured } from "../../services/fee-indexer.js";
import { rateLimit } from "../../middleware/rate-limit.js";
import {
    ErrorResponseSchema,
    PaginationQuerySchema,
    RateLimitResponseSchema,
} from "../schemas/common.js";
import {
    DistributionsQuerySchema,
    DistributionsResponseSchema,
    ProjectIdParamSchema,
    ProjectDistributionsResponseSchema,
    PoolIdParamSchema,
    PoolDistributionsResponseSchema,
    DevAddressParamSchema,
    DevDistributionsResponseSchema,
    FeeTotalsResponseSchema,
    TxHashParamSchema,
    TxVerifyResponseSchema,
    IndexerHealthResponseSchema,
} from "../schemas/fees.js";

const fees = new OpenAPIHono();

// Type helper to relax strict type checking for handlers
// biome-ignore lint/suspicious/noExplicitAny: OpenAPI handler type relaxation
type AnyHandler = RouteHandler<any, any>;

// Rate limit: 60 requests per minute per IP (public endpoints)
fees.use(
    "*",
    rateLimit("fees", {
        limit: 60,
        windowMs: 60 * 1000,
        message: "Fee API rate limit exceeded. Please slow down.",
    }),
);

// ─── Response Formatters ────────────────────────────────

function formatDistribution(d: DbFeeDistribution) {
    return {
        id: d.id,
        eventType: d.eventType,
        txHash: d.txHash,
        blockNumber: d.blockNumber,
        logIndex: d.logIndex,
        poolId: d.poolId,
        tokenAddress: d.tokenAddress,
        amount: d.amount,
        devAmount: d.devAmount,
        protocolAmount: d.protocolAmount,
        devAddress: d.devAddress,
        recipientAddress: d.recipientAddress,
        blockTimestamp: d.blockTimestamp.toISOString(),
        indexedAt: d.indexedAt.toISOString(),
        projectId: d.projectId,
        explorerUrl: `https://basescan.org/tx/${d.txHash}`,
    };
}

// ─── Routes ─────────────────────────────────────────────

/**
 * GET /api/fees/distributions
 * List fee distributions with optional filters and pagination.
 */
const distributionsRoute = createRoute({
    method: "get",
    path: "/distributions",
    tags: ["Fees"],
    summary: "List fee distributions",
    description:
        "List fee distributions with optional filters by event type, pool, developer, or token. Supports pagination.",
    request: {
        query: DistributionsQuerySchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: DistributionsResponseSchema,
                },
            },
            description: "List of fee distributions",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Invalid query parameters",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (60 requests per minute)",
        },
    },
});

fees.openapi(distributionsRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const query = (c.req as any).valid("query") as z.infer<typeof DistributionsQuerySchema>;

    // Validate event type if provided
    const validTypes: FeeEventType[] = [
        "deposit",
        "escrow",
        "dev_assigned",
        "expired",
        "dev_claimed",
        "protocol_claimed",
    ];

    if (query.type && !validTypes.includes(query.type as FeeEventType)) {
        return c.json(
            {
                error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
            },
            400,
        );
    }

    const limit = Math.min(Math.max(1, query.limit || 20), 100);
    const offset = Math.max(0, query.offset || 0);

    const result = await findDistributions(
        {
            eventType: query.type as FeeEventType | undefined,
            poolId: query.pool || undefined,
            devAddress: query.dev || undefined,
            tokenAddress: query.token || undefined,
        },
        { limit, offset },
    );

    return c.json({
        distributions: result.data.map(formatDistribution),
        pagination: result.pagination,
    });
}) as AnyHandler);

/**
 * GET /api/fees/project/:projectId
 * Get fee history for a specific project.
 */
const projectRoute = createRoute({
    method: "get",
    path: "/project/{projectId}",
    tags: ["Fees"],
    summary: "Get project fee history",
    description: "Get fee distribution history for a specific project by its project ID.",
    request: {
        params: ProjectIdParamSchema,
        query: PaginationQuerySchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ProjectDistributionsResponseSchema,
                },
            },
            description: "Project fee distributions",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (60 requests per minute)",
        },
    },
});

fees.openapi(projectRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { projectId } = (c.req as any).valid("param") as z.infer<typeof ProjectIdParamSchema>;
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const query = (c.req as any).valid("query") as z.infer<typeof PaginationQuerySchema>;

    // URL decode the projectId (handles "org/repo" format)
    const decodedProjectId = decodeURIComponent(projectId);

    const limit = Math.min(Math.max(1, query.limit || 20), 100);
    const offset = Math.max(0, query.offset || 0);

    // Search by projectId field in fee distributions
    const result = await findDistributions({ poolId: undefined }, { limit, offset });

    // Filter results by projectId client-side (until we add projectId index)
    const filtered = result.data.filter((d) => d.projectId === decodedProjectId);

    return c.json({
        projectId: decodedProjectId,
        distributions: filtered.map(formatDistribution),
        pagination: {
            limit,
            offset,
            count: filtered.length,
            hasMore: result.pagination.hasMore,
        },
    });
}) as AnyHandler);

/**
 * GET /api/fees/pool/:poolId
 * Get fee history for a specific Uniswap V4 pool.
 */
const poolRoute = createRoute({
    method: "get",
    path: "/pool/{poolId}",
    tags: ["Fees"],
    summary: "Get pool fee history",
    description: "Get fee distribution history for a specific Uniswap V4 pool.",
    request: {
        params: PoolIdParamSchema,
        query: PaginationQuerySchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: PoolDistributionsResponseSchema,
                },
            },
            description: "Pool fee distributions",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (60 requests per minute)",
        },
    },
});

fees.openapi(poolRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { poolId } = (c.req as any).valid("param") as z.infer<typeof PoolIdParamSchema>;
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const query = (c.req as any).valid("query") as z.infer<typeof PaginationQuerySchema>;

    const limit = Math.min(Math.max(1, query.limit || 20), 100);
    const offset = Math.max(0, query.offset || 0);

    const result = await findByPoolId(poolId, { limit, offset });

    return c.json({
        poolId,
        distributions: result.data.map(formatDistribution),
        pagination: result.pagination,
    });
}) as AnyHandler);

/**
 * GET /api/fees/dev/:address
 * Get fee history for a specific developer address.
 */
const devRoute = createRoute({
    method: "get",
    path: "/dev/{address}",
    tags: ["Fees"],
    summary: "Get developer fee history",
    description: "Get fee history for a specific developer address, including earnings summary.",
    request: {
        params: DevAddressParamSchema,
        query: PaginationQuerySchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: DevDistributionsResponseSchema,
                },
            },
            description: "Developer fee distributions with earnings summary",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Invalid Ethereum address format",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (60 requests per minute)",
        },
    },
});

fees.openapi(devRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { address } = (c.req as any).valid("param") as z.infer<typeof DevAddressParamSchema>;
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const query = (c.req as any).valid("query") as z.infer<typeof PaginationQuerySchema>;

    const limit = Math.min(Math.max(1, query.limit || 20), 100);
    const offset = Math.max(0, query.offset || 0);

    const result = await findByDevAddress(address, { limit, offset });

    // Calculate earnings summary
    let totalEarned = 0n;
    let totalClaimed = 0n;

    for (const d of result.data) {
        if (d.eventType === "deposit" && d.devAmount) {
            totalEarned += BigInt(d.devAmount);
        }
        if (d.eventType === "dev_claimed" && d.amount) {
            totalClaimed += BigInt(d.amount);
        }
    }

    return c.json({
        address,
        summary: {
            totalEarnedWei: totalEarned.toString(),
            totalClaimedWei: totalClaimed.toString(),
            unclaimedWei: (totalEarned - totalClaimed).toString(),
        },
        distributions: result.data.map(formatDistribution),
        pagination: result.pagination,
    });
}) as AnyHandler);

/**
 * GET /api/fees/totals
 * Get aggregate statistics for all fee distributions.
 */
const totalsRoute = createRoute({
    method: "get",
    path: "/totals",
    tags: ["Fees"],
    summary: "Get aggregate fee statistics",
    description: "Get aggregate statistics for all fee distributions across the platform.",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: FeeTotalsResponseSchema,
                },
            },
            description: "Aggregate fee statistics",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (60 requests per minute)",
        },
    },
});

fees.openapi(totalsRoute, (async (c) => {
    const stats = await getAggregateStats();

    return c.json({
        totalDistributedWei: stats.totalDistributedWei,
        totalDevClaimedWei: stats.totalDevClaimedWei,
        totalProtocolClaimedWei: stats.totalProtocolClaimedWei,
        totalEscrowedWei: stats.totalEscrowedWei,
        distributionCount: stats.distributionCount,
        uniqueDevs: stats.uniqueDevs,
        uniquePools: stats.uniquePools,
        lastIndexedBlock: stats.lastIndexedBlock,
        lastIndexedAt: stats.lastIndexedAt?.toISOString() ?? null,
    });
}) as AnyHandler);

/**
 * GET /api/fees/verify/:txHash
 * Verify a specific transaction and return all fee events it contains.
 */
const verifyTxRoute = createRoute({
    method: "get",
    path: "/verify/{txHash}",
    tags: ["Fees"],
    summary: "Verify transaction fee events",
    description:
        "Verify a specific transaction and return all fee distribution events it contains.",
    request: {
        params: TxHashParamSchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: TxVerifyResponseSchema,
                },
            },
            description: "Fee events for transaction (found: true/false)",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Invalid transaction hash format",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (60 requests per minute)",
        },
    },
});

fees.openapi(verifyTxRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { txHash } = (c.req as any).valid("param") as z.infer<typeof TxHashParamSchema>;

    const events = await findByTxHash(txHash);

    if (events.length === 0) {
        return c.json({
            txHash,
            found: false as const,
            message: "No fee distribution events found for this transaction",
            events: [],
            explorerUrl: `https://basescan.org/tx/${txHash}`,
        });
    }

    return c.json({
        txHash,
        found: true as const,
        eventCount: events.length,
        events: events.map(formatDistribution),
        explorerUrl: `https://basescan.org/tx/${txHash}`,
    });
}) as AnyHandler);

/**
 * GET /api/fees/health
 * Check the indexer health status.
 */
const healthRoute = createRoute({
    method: "get",
    path: "/health",
    tags: ["Fees"],
    summary: "Check indexer health",
    description:
        "Check the fee indexer health status including block lag, running state, and errors.",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: IndexerHealthResponseSchema,
                },
            },
            description: "Indexer health status",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (60 requests per minute)",
        },
    },
});

fees.openapi(healthRoute, (async (c) => {
    const isConfigured = isFeeIndexerConfigured();

    if (!isConfigured) {
        return c.json({
            status: "disabled" as const,
            message: "Fee indexer not configured (SIGIL_FEE_VAULT_ADDRESS not set)",
            isRunning: false,
            lastProcessedBlock: null,
            currentBlock: null,
            blockLag: null,
            lastError: null,
            eventsIndexed: 0,
            startedAt: null,
        });
    }

    const indexer = getFeeIndexer();
    const status = await indexer.getStatus();

    // Determine health status based on block lag
    let healthStatus: "healthy" | "degraded" | "unhealthy" | "stopped";

    if (!status.isRunning) {
        healthStatus = "stopped";
    } else if (status.blockLag === null) {
        healthStatus = "degraded";
    } else if (status.blockLag <= 10) {
        healthStatus = "healthy";
    } else if (status.blockLag <= 100) {
        healthStatus = "degraded";
    } else {
        healthStatus = "unhealthy";
    }

    return c.json({
        status: healthStatus,
        isRunning: status.isRunning,
        lastProcessedBlock: status.lastProcessedBlock,
        currentBlock: status.currentBlock,
        blockLag: status.blockLag,
        lastError: status.lastError,
        eventsIndexed: status.eventsIndexed,
        startedAt: status.startedAt?.toISOString() ?? null,
    });
}) as AnyHandler);

export { fees };
