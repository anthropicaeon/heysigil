/**
 * Fee Distribution Repository
 *
 * Database persistence for fee distribution audit trail.
 * Falls back to in-memory storage when DATABASE_URL is not set.
 */

import { eq, and, desc, sql } from "drizzle-orm";
import { getDb, schema, DatabaseUnavailableError } from "../client.js";

// ─── Types ──────────────────────────────────────────────

export type FeeEventType =
    | "deposit"
    | "escrow"
    | "dev_assigned"
    | "expired"
    | "dev_claimed"
    | "protocol_claimed";

export interface DbFeeDistribution {
    id: string;
    eventType: FeeEventType;
    txHash: string;
    blockNumber: number;
    logIndex: number;
    poolId: string | null;
    tokenAddress: string;
    amount: string | null;
    devAmount: string | null;
    protocolAmount: string | null;
    devAddress: string | null;
    recipientAddress: string | null;
    blockTimestamp: Date;
    indexedAt: Date;
    projectId: string | null;
}

export interface DbIndexerState {
    id: string;
    lastProcessedBlock: number;
    updatedAt: Date;
}

export interface FeeDistributionInsert {
    eventType: FeeEventType;
    txHash: string;
    blockNumber: number;
    logIndex: number;
    poolId?: string | null;
    tokenAddress: string;
    amount?: string | null;
    devAmount?: string | null;
    protocolAmount?: string | null;
    devAddress?: string | null;
    recipientAddress?: string | null;
    blockTimestamp: Date;
    projectId?: string | null;
}

export interface PaginationParams {
    limit?: number;
    offset?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        limit: number;
        offset: number;
        count: number;
        hasMore: boolean;
    };
}

export interface AggregateStats {
    totalDistributedWei: string;
    totalDevClaimedWei: string;
    totalProtocolClaimedWei: string;
    totalEscrowedWei: string;
    distributionCount: number;
    uniqueDevs: number;
    uniquePools: number;
    lastIndexedBlock: number | null;
    lastIndexedAt: Date | null;
}

// ─── In-Memory Fallback ─────────────────────────────────

const memoryDistributions = new Map<string, DbFeeDistribution>();
const memoryTxLogIndex = new Map<string, string>(); // "txHash:logIndex" → id
let memoryLastProcessedBlock = 0;
let _memoryLastUpdatedAt: Date | null = null;

function getTxLogKey(txHash: string, logIndex: number): string {
    return `${txHash}:${logIndex}`;
}

// ─── Fee Distribution Repository ────────────────────────

/**
 * Create a new fee distribution record.
 * Deduplicates by (txHash, logIndex).
 */
export async function createFeeDistribution(
    data: FeeDistributionInsert,
): Promise<DbFeeDistribution | null> {
    // Check for existing record first
    const existing = await findByTxHashAndLogIndex(data.txHash, data.logIndex);
    if (existing) {
        return null; // Already exists, skip
    }

    const distribution: DbFeeDistribution = {
        id: crypto.randomUUID(),
        eventType: data.eventType,
        txHash: data.txHash,
        blockNumber: data.blockNumber,
        logIndex: data.logIndex,
        poolId: data.poolId ?? null,
        tokenAddress: data.tokenAddress,
        amount: data.amount ?? null,
        devAmount: data.devAmount ?? null,
        protocolAmount: data.protocolAmount ?? null,
        devAddress: data.devAddress ?? null,
        recipientAddress: data.recipientAddress ?? null,
        blockTimestamp: data.blockTimestamp,
        indexedAt: new Date(),
        projectId: data.projectId ?? null,
    };

    try {
        const db = getDb();
        const [row] = await db
            .insert(schema.feeDistributions)
            .values({
                id: distribution.id,
                eventType: distribution.eventType,
                txHash: distribution.txHash,
                blockNumber: distribution.blockNumber,
                logIndex: distribution.logIndex,
                poolId: distribution.poolId,
                tokenAddress: distribution.tokenAddress,
                amount: distribution.amount,
                devAmount: distribution.devAmount,
                protocolAmount: distribution.protocolAmount,
                devAddress: distribution.devAddress,
                recipientAddress: distribution.recipientAddress,
                blockTimestamp: distribution.blockTimestamp,
                projectId: distribution.projectId,
            })
            .onConflictDoNothing()
            .returning();

        if (!row) return null; // Conflict, already exists

        return {
            id: row.id,
            eventType: row.eventType as FeeEventType,
            txHash: row.txHash,
            blockNumber: row.blockNumber,
            logIndex: row.logIndex,
            poolId: row.poolId,
            tokenAddress: row.tokenAddress,
            amount: row.amount,
            devAmount: row.devAmount,
            protocolAmount: row.protocolAmount,
            devAddress: row.devAddress,
            recipientAddress: row.recipientAddress,
            blockTimestamp: row.blockTimestamp,
            indexedAt: row.indexedAt,
            projectId: row.projectId,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            memoryDistributions.set(distribution.id, distribution);
            memoryTxLogIndex.set(getTxLogKey(data.txHash, data.logIndex), distribution.id);
            return distribution;
        }
        throw err;
    }
}

/**
 * Find a fee distribution by transaction hash and log index.
 * Used for deduplication.
 */
export async function findByTxHashAndLogIndex(
    txHash: string,
    logIndex: number,
): Promise<DbFeeDistribution | null> {
    try {
        const db = getDb();
        const [row] = await db
            .select()
            .from(schema.feeDistributions)
            .where(
                and(
                    eq(schema.feeDistributions.txHash, txHash),
                    eq(schema.feeDistributions.logIndex, logIndex),
                ),
            )
            .limit(1);

        if (!row) return null;

        return {
            id: row.id,
            eventType: row.eventType as FeeEventType,
            txHash: row.txHash,
            blockNumber: row.blockNumber,
            logIndex: row.logIndex,
            poolId: row.poolId,
            tokenAddress: row.tokenAddress,
            amount: row.amount,
            devAmount: row.devAmount,
            protocolAmount: row.protocolAmount,
            devAddress: row.devAddress,
            recipientAddress: row.recipientAddress,
            blockTimestamp: row.blockTimestamp,
            indexedAt: row.indexedAt,
            projectId: row.projectId,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            const id = memoryTxLogIndex.get(getTxLogKey(txHash, logIndex));
            if (!id) return null;
            return memoryDistributions.get(id) ?? null;
        }
        throw err;
    }
}

/**
 * Find fee distributions by pool ID with pagination.
 */
export async function findByPoolId(
    poolId: string,
    pagination: PaginationParams = {},
): Promise<PaginatedResult<DbFeeDistribution>> {
    const limit = Math.min(Math.max(1, pagination.limit ?? 20), 100);
    const offset = Math.max(0, pagination.offset ?? 0);

    try {
        const db = getDb();
        const rows = await db
            .select()
            .from(schema.feeDistributions)
            .where(eq(schema.feeDistributions.poolId, poolId))
            .orderBy(desc(schema.feeDistributions.blockNumber))
            .limit(limit)
            .offset(offset);

        const data = rows.map((row) => ({
            id: row.id,
            eventType: row.eventType as FeeEventType,
            txHash: row.txHash,
            blockNumber: row.blockNumber,
            logIndex: row.logIndex,
            poolId: row.poolId,
            tokenAddress: row.tokenAddress,
            amount: row.amount,
            devAmount: row.devAmount,
            protocolAmount: row.protocolAmount,
            devAddress: row.devAddress,
            recipientAddress: row.recipientAddress,
            blockTimestamp: row.blockTimestamp,
            indexedAt: row.indexedAt,
            projectId: row.projectId,
        }));

        return {
            data,
            pagination: {
                limit,
                offset,
                count: data.length,
                hasMore: data.length === limit,
            },
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            const all = Array.from(memoryDistributions.values())
                .filter((d) => d.poolId === poolId)
                .sort((a, b) => b.blockNumber - a.blockNumber);

            const data = all.slice(offset, offset + limit);
            return {
                data,
                pagination: {
                    limit,
                    offset,
                    count: data.length,
                    hasMore: data.length === limit,
                },
            };
        }
        throw err;
    }
}

/**
 * Find fee distributions by developer address with pagination.
 */
export async function findByDevAddress(
    devAddress: string,
    pagination: PaginationParams = {},
): Promise<PaginatedResult<DbFeeDistribution>> {
    const limit = Math.min(Math.max(1, pagination.limit ?? 20), 100);
    const offset = Math.max(0, pagination.offset ?? 0);
    const normalizedAddress = devAddress.toLowerCase();

    try {
        const db = getDb();
        const rows = await db
            .select()
            .from(schema.feeDistributions)
            .where(sql`LOWER(${schema.feeDistributions.devAddress}) = ${normalizedAddress}`)
            .orderBy(desc(schema.feeDistributions.blockNumber))
            .limit(limit)
            .offset(offset);

        const data = rows.map((row) => ({
            id: row.id,
            eventType: row.eventType as FeeEventType,
            txHash: row.txHash,
            blockNumber: row.blockNumber,
            logIndex: row.logIndex,
            poolId: row.poolId,
            tokenAddress: row.tokenAddress,
            amount: row.amount,
            devAmount: row.devAmount,
            protocolAmount: row.protocolAmount,
            devAddress: row.devAddress,
            recipientAddress: row.recipientAddress,
            blockTimestamp: row.blockTimestamp,
            indexedAt: row.indexedAt,
            projectId: row.projectId,
        }));

        return {
            data,
            pagination: {
                limit,
                offset,
                count: data.length,
                hasMore: data.length === limit,
            },
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            const all = Array.from(memoryDistributions.values())
                .filter((d) => d.devAddress?.toLowerCase() === normalizedAddress)
                .sort((a, b) => b.blockNumber - a.blockNumber);

            const data = all.slice(offset, offset + limit);
            return {
                data,
                pagination: {
                    limit,
                    offset,
                    count: data.length,
                    hasMore: data.length === limit,
                },
            };
        }
        throw err;
    }
}

/**
 * Find fee distributions with optional filters and pagination.
 */
export async function findDistributions(
    filters: {
        eventType?: FeeEventType;
        poolId?: string;
        devAddress?: string;
        tokenAddress?: string;
    } = {},
    pagination: PaginationParams = {},
): Promise<PaginatedResult<DbFeeDistribution>> {
    const limit = Math.min(Math.max(1, pagination.limit ?? 20), 100);
    const offset = Math.max(0, pagination.offset ?? 0);

    try {
        const db = getDb();

        // Build where conditions
        const conditions = [];
        if (filters.eventType) {
            conditions.push(eq(schema.feeDistributions.eventType, filters.eventType));
        }
        if (filters.poolId) {
            conditions.push(eq(schema.feeDistributions.poolId, filters.poolId));
        }
        if (filters.devAddress) {
            conditions.push(
                sql`LOWER(${schema.feeDistributions.devAddress}) = ${filters.devAddress.toLowerCase()}`,
            );
        }
        if (filters.tokenAddress) {
            conditions.push(
                sql`LOWER(${schema.feeDistributions.tokenAddress}) = ${filters.tokenAddress.toLowerCase()}`,
            );
        }

        let query = db
            .select()
            .from(schema.feeDistributions)
            .orderBy(desc(schema.feeDistributions.blockNumber))
            .limit(limit)
            .offset(offset);

        if (conditions.length > 0) {
            query = query.where(and(...conditions)) as typeof query;
        }

        const rows = await query;

        const data = rows.map((row) => ({
            id: row.id,
            eventType: row.eventType as FeeEventType,
            txHash: row.txHash,
            blockNumber: row.blockNumber,
            logIndex: row.logIndex,
            poolId: row.poolId,
            tokenAddress: row.tokenAddress,
            amount: row.amount,
            devAmount: row.devAmount,
            protocolAmount: row.protocolAmount,
            devAddress: row.devAddress,
            recipientAddress: row.recipientAddress,
            blockTimestamp: row.blockTimestamp,
            indexedAt: row.indexedAt,
            projectId: row.projectId,
        }));

        return {
            data,
            pagination: {
                limit,
                offset,
                count: data.length,
                hasMore: data.length === limit,
            },
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            let all = Array.from(memoryDistributions.values());

            if (filters.eventType) {
                all = all.filter((d) => d.eventType === filters.eventType);
            }
            if (filters.poolId) {
                all = all.filter((d) => d.poolId === filters.poolId);
            }
            if (filters.devAddress) {
                const normalized = filters.devAddress.toLowerCase();
                all = all.filter((d) => d.devAddress?.toLowerCase() === normalized);
            }
            if (filters.tokenAddress) {
                const normalized = filters.tokenAddress.toLowerCase();
                all = all.filter((d) => d.tokenAddress.toLowerCase() === normalized);
            }

            all.sort((a, b) => b.blockNumber - a.blockNumber);
            const data = all.slice(offset, offset + limit);

            return {
                data,
                pagination: {
                    limit,
                    offset,
                    count: data.length,
                    hasMore: data.length === limit,
                },
            };
        }
        throw err;
    }
}

/**
 * Find fee distribution by transaction hash.
 * Returns all events from a single transaction.
 */
export async function findByTxHash(txHash: string): Promise<DbFeeDistribution[]> {
    try {
        const db = getDb();
        const rows = await db
            .select()
            .from(schema.feeDistributions)
            .where(eq(schema.feeDistributions.txHash, txHash))
            .orderBy(schema.feeDistributions.logIndex);

        return rows.map((row) => ({
            id: row.id,
            eventType: row.eventType as FeeEventType,
            txHash: row.txHash,
            blockNumber: row.blockNumber,
            logIndex: row.logIndex,
            poolId: row.poolId,
            tokenAddress: row.tokenAddress,
            amount: row.amount,
            devAmount: row.devAmount,
            protocolAmount: row.protocolAmount,
            devAddress: row.devAddress,
            recipientAddress: row.recipientAddress,
            blockTimestamp: row.blockTimestamp,
            indexedAt: row.indexedAt,
            projectId: row.projectId,
        }));
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            return Array.from(memoryDistributions.values())
                .filter((d) => d.txHash === txHash)
                .sort((a, b) => a.logIndex - b.logIndex);
        }
        throw err;
    }
}

/**
 * Get aggregate statistics for the fee distributions.
 */
export async function getAggregateStats(): Promise<AggregateStats> {
    try {
        const db = getDb();

        // Get totals by event type
        const [stats] = await db
            .select({
                distributionCount: sql<number>`COUNT(*)`.mapWith(Number),
                uniqueDevs:
                    sql<number>`COUNT(DISTINCT ${schema.feeDistributions.devAddress})`.mapWith(
                        Number,
                    ),
                uniquePools: sql<number>`COUNT(DISTINCT ${schema.feeDistributions.poolId})`.mapWith(
                    Number,
                ),
            })
            .from(schema.feeDistributions);

        // Get sum of deposits (dev amounts)
        const [depositStats] = await db
            .select({
                totalDevAmount: sql<string>`COALESCE(SUM(CAST(${schema.feeDistributions.devAmount} AS NUMERIC)), 0)`,
                totalProtocolAmount: sql<string>`COALESCE(SUM(CAST(${schema.feeDistributions.protocolAmount} AS NUMERIC)), 0)`,
            })
            .from(schema.feeDistributions)
            .where(eq(schema.feeDistributions.eventType, "deposit"));

        // Get sum of dev claims
        const [devClaimStats] = await db
            .select({
                totalClaimed: sql<string>`COALESCE(SUM(CAST(${schema.feeDistributions.amount} AS NUMERIC)), 0)`,
            })
            .from(schema.feeDistributions)
            .where(eq(schema.feeDistributions.eventType, "dev_claimed"));

        // Get sum of protocol claims
        const [protocolClaimStats] = await db
            .select({
                totalClaimed: sql<string>`COALESCE(SUM(CAST(${schema.feeDistributions.amount} AS NUMERIC)), 0)`,
            })
            .from(schema.feeDistributions)
            .where(eq(schema.feeDistributions.eventType, "protocol_claimed"));

        // Get sum of escrowed
        const [escrowStats] = await db
            .select({
                totalEscrowed: sql<string>`COALESCE(SUM(CAST(${schema.feeDistributions.amount} AS NUMERIC)), 0)`,
            })
            .from(schema.feeDistributions)
            .where(eq(schema.feeDistributions.eventType, "escrow"));

        // Get indexer state
        const indexerState = await getLastProcessedBlock();
        const lastDistribution = await db
            .select({ indexedAt: schema.feeDistributions.indexedAt })
            .from(schema.feeDistributions)
            .orderBy(desc(schema.feeDistributions.indexedAt))
            .limit(1);

        // Calculate total distributed (dev deposits + protocol deposits)
        const totalDevDeposits = BigInt(depositStats?.totalDevAmount ?? "0");
        const totalProtocolDeposits = BigInt(depositStats?.totalProtocolAmount ?? "0");
        const totalDistributed = totalDevDeposits + totalProtocolDeposits;

        return {
            totalDistributedWei: totalDistributed.toString(),
            totalDevClaimedWei: devClaimStats?.totalClaimed ?? "0",
            totalProtocolClaimedWei: protocolClaimStats?.totalClaimed ?? "0",
            totalEscrowedWei: escrowStats?.totalEscrowed ?? "0",
            distributionCount: stats?.distributionCount ?? 0,
            uniqueDevs: stats?.uniqueDevs ?? 0,
            uniquePools: stats?.uniquePools ?? 0,
            lastIndexedBlock: indexerState,
            lastIndexedAt: lastDistribution[0]?.indexedAt ?? null,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            const all = Array.from(memoryDistributions.values());

            let totalDistributed = 0n;
            let totalDevClaimed = 0n;
            let totalProtocolClaimed = 0n;
            let totalEscrowed = 0n;
            const uniqueDevs = new Set<string>();
            const uniquePools = new Set<string>();
            let lastIndexedAt: Date | null = null;

            for (const d of all) {
                if (d.devAddress) uniqueDevs.add(d.devAddress.toLowerCase());
                if (d.poolId) uniquePools.add(d.poolId);
                if (!lastIndexedAt || d.indexedAt > lastIndexedAt) {
                    lastIndexedAt = d.indexedAt;
                }

                switch (d.eventType) {
                    case "deposit":
                        if (d.devAmount) totalDistributed += BigInt(d.devAmount);
                        if (d.protocolAmount) totalDistributed += BigInt(d.protocolAmount);
                        break;
                    case "dev_claimed":
                        if (d.amount) totalDevClaimed += BigInt(d.amount);
                        break;
                    case "protocol_claimed":
                        if (d.amount) totalProtocolClaimed += BigInt(d.amount);
                        break;
                    case "escrow":
                        if (d.amount) totalEscrowed += BigInt(d.amount);
                        break;
                }
            }

            return {
                totalDistributedWei: totalDistributed.toString(),
                totalDevClaimedWei: totalDevClaimed.toString(),
                totalProtocolClaimedWei: totalProtocolClaimed.toString(),
                totalEscrowedWei: totalEscrowed.toString(),
                distributionCount: all.length,
                uniqueDevs: uniqueDevs.size,
                uniquePools: uniquePools.size,
                lastIndexedBlock: memoryLastProcessedBlock || null,
                lastIndexedAt,
            };
        }
        throw err;
    }
}

// ─── Indexer State Repository ───────────────────────────

const INDEXER_ID = "fee-indexer";

/**
 * Get the last processed block number.
 */
export async function getLastProcessedBlock(): Promise<number | null> {
    try {
        const db = getDb();
        const [row] = await db
            .select()
            .from(schema.indexerState)
            .where(eq(schema.indexerState.id, INDEXER_ID))
            .limit(1);

        return row?.lastProcessedBlock ?? null;
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            return memoryLastProcessedBlock || null;
        }
        throw err;
    }
}

/**
 * Update the last processed block number.
 */
export async function updateLastProcessedBlock(blockNumber: number): Promise<void> {
    try {
        const db = getDb();
        await db
            .insert(schema.indexerState)
            .values({
                id: INDEXER_ID,
                lastProcessedBlock: blockNumber,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: schema.indexerState.id,
                set: {
                    lastProcessedBlock: blockNumber,
                    updatedAt: new Date(),
                },
            });
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            memoryLastProcessedBlock = blockNumber;
            _memoryLastUpdatedAt = new Date();
            return;
        }
        throw err;
    }
}

/**
 * Link fee distributions to a project by pool ID.
 * Called after deployer creates a token with a known projectId.
 */
export async function linkPoolToProject(poolId: string, projectId: string): Promise<number> {
    try {
        const db = getDb();
        const result = await db
            .update(schema.feeDistributions)
            .set({ projectId })
            .where(
                and(
                    eq(schema.feeDistributions.poolId, poolId),
                    sql`${schema.feeDistributions.projectId} IS NULL`,
                ),
            );

        return result.count ?? 0;
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            let count = 0;
            for (const d of memoryDistributions.values()) {
                if (d.poolId === poolId && !d.projectId) {
                    d.projectId = projectId;
                    count++;
                }
            }
            return count;
        }
        throw err;
    }
}
