/**
 * Fee Distribution API Routes
 *
 * Public endpoints for querying the transparent fee audit trail.
 * All endpoints are read-only and publicly accessible.
 */

import { Hono } from "hono";
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

const fees = new Hono();

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
 *
 * List fee distributions with optional filters and pagination.
 *
 * Query params:
 *   - type: Event type filter (deposit, escrow, dev_assigned, expired, dev_claimed, protocol_claimed)
 *   - pool: Pool ID filter
 *   - dev: Developer address filter
 *   - token: Token address filter
 *   - limit: Max results (default 20, max 100)
 *   - offset: Pagination offset (default 0)
 */
fees.get("/distributions", async (c) => {
    const typeParam = c.req.query("type");
    const poolId = c.req.query("pool");
    const devAddress = c.req.query("dev");
    const tokenAddress = c.req.query("token");
    const limitParam = c.req.query("limit");
    const offsetParam = c.req.query("offset");

    // Validate event type if provided
    const validTypes: FeeEventType[] = [
        "deposit",
        "escrow",
        "dev_assigned",
        "expired",
        "dev_claimed",
        "protocol_claimed",
    ];

    if (typeParam && !validTypes.includes(typeParam as FeeEventType)) {
        return c.json(
            {
                error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
            },
            400,
        );
    }

    const limit = Math.min(Math.max(1, Number(limitParam) || 20), 100);
    const offset = Math.max(0, Number(offsetParam) || 0);

    const result = await findDistributions(
        {
            eventType: typeParam as FeeEventType | undefined,
            poolId: poolId || undefined,
            devAddress: devAddress || undefined,
            tokenAddress: tokenAddress || undefined,
        },
        { limit, offset },
    );

    return c.json({
        distributions: result.data.map(formatDistribution),
        pagination: result.pagination,
    });
});

/**
 * GET /api/fees/project/:projectId
 *
 * Get fee history for a specific project.
 * Uses the poolId linked to the project.
 *
 * Note: This looks up by project's poolId, not projectId string.
 * For direct poolId lookup, use /api/fees/pool/:poolId
 */
fees.get("/project/:projectId", async (c) => {
    const projectId = c.req.param("projectId");
    const limitParam = c.req.query("limit");
    const offsetParam = c.req.query("offset");

    // URL decode the projectId (handles "org/repo" format)
    const decodedProjectId = decodeURIComponent(projectId);

    const limit = Math.min(Math.max(1, Number(limitParam) || 20), 100);
    const offset = Math.max(0, Number(offsetParam) || 0);

    // Search by projectId field in fee distributions
    const result = await findDistributions(
        { poolId: undefined }, // We can't filter by projectId directly yet
        { limit, offset },
    );

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
});

/**
 * GET /api/fees/pool/:poolId
 *
 * Get fee history for a specific Uniswap V4 pool.
 */
fees.get("/pool/:poolId", async (c) => {
    const poolId = c.req.param("poolId");
    const limitParam = c.req.query("limit");
    const offsetParam = c.req.query("offset");

    const limit = Math.min(Math.max(1, Number(limitParam) || 20), 100);
    const offset = Math.max(0, Number(offsetParam) || 0);

    const result = await findByPoolId(poolId, { limit, offset });

    return c.json({
        poolId,
        distributions: result.data.map(formatDistribution),
        pagination: result.pagination,
    });
});

/**
 * GET /api/fees/dev/:address
 *
 * Get fee history for a specific developer address.
 * Includes deposits, claims, and assignments.
 */
fees.get("/dev/:address", async (c) => {
    const address = c.req.param("address");
    const limitParam = c.req.query("limit");
    const offsetParam = c.req.query("offset");

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return c.json({ error: "Invalid Ethereum address format" }, 400);
    }

    const limit = Math.min(Math.max(1, Number(limitParam) || 20), 100);
    const offset = Math.max(0, Number(offsetParam) || 0);

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
});

/**
 * GET /api/fees/totals
 *
 * Get aggregate statistics for all fee distributions.
 */
fees.get("/totals", async (c) => {
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
});

/**
 * GET /api/fees/verify/:txHash
 *
 * Verify a specific transaction and return all fee events it contains.
 * Useful for confirming that a swap's fees were properly distributed.
 */
fees.get("/verify/:txHash", async (c) => {
    const txHash = c.req.param("txHash");

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
        return c.json({ error: "Invalid transaction hash format" }, 400);
    }

    const events = await findByTxHash(txHash);

    if (events.length === 0) {
        return c.json({
            txHash,
            found: false,
            message: "No fee distribution events found for this transaction",
            events: [],
            explorerUrl: `https://basescan.org/tx/${txHash}`,
        });
    }

    return c.json({
        txHash,
        found: true,
        eventCount: events.length,
        events: events.map(formatDistribution),
        explorerUrl: `https://basescan.org/tx/${txHash}`,
    });
});

/**
 * GET /api/fees/health
 *
 * Check the indexer health status.
 * Returns block lag, running state, and any errors.
 */
fees.get("/health", async (c) => {
    const isConfigured = isFeeIndexerConfigured();

    if (!isConfigured) {
        return c.json({
            status: "disabled",
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
});

export { fees };
