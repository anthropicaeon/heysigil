/**
 * Fee Indexer Service
 *
 * Indexes SigilFeeVault events into the database for transparent audit trail.
 * Polls the blockchain every 12 seconds (Base block time ~2s).
 *
 * Events indexed:
 *   - FeesDeposited: Swap fee collected, dev known
 *   - FeesEscrowed: Swap fee collected, dev unknown
 *   - DevAssigned: Dev verified, escrow released
 *   - FeesExpired: 30-day escrow expired to protocol
 *   - DevFeesClaimed: Dev withdrew fees
 *   - ProtocolFeesClaimed: Protocol withdrew fees
 */

import { ethers } from "ethers";
import { and, eq, isNull } from "drizzle-orm";
import { getEnv } from "../config/env.js";
import { getErrorMessage } from "../utils/errors.js";
import { loggers } from "../utils/logger.js";
import { getDb, schema, DatabaseUnavailableError } from "../db/client.js";
import {
    createFeeDistribution,
    getLastProcessedBlock,
    updateLastProcessedBlock,
    type FeeEventType,
    type FeeDistributionInsert,
} from "../db/repositories/index.js";

const log = loggers.feeIndexer;

// ─── Constants ──────────────────────────────────────────

const POLL_INTERVAL_MS = 12_000; // 12 seconds
const BACKFILL_BATCH_SIZE = 1000; // Process 1000 blocks at a time
const MAX_RETRY_DELAY_MS = 60_000; // Max backoff delay
const INITIAL_RETRY_DELAY_MS = 1_000; // Initial backoff delay

// ─── Event ABIs ─────────────────────────────────────────

const FEE_VAULT_ABI = [
    "event FeesDeposited(bytes32 indexed poolId, address indexed dev, address indexed token, uint256 devAmount, uint256 protocolAmount)",
    "event FeesEscrowed(bytes32 indexed poolId, address indexed token, uint256 amount)",
    "event DevAssigned(bytes32 indexed poolId, address indexed dev, uint256 tokensTransferred)",
    "event FeesExpired(bytes32 indexed poolId, address indexed token, uint256 amount)",
    "event DevFeesClaimed(address indexed dev, address indexed token, uint256 amount)",
    "event ProtocolFeesClaimed(address indexed token, uint256 amount, address to)",
];

const FEE_VAULT_INTERFACE = new ethers.Interface(FEE_VAULT_ABI);

// Event topic hashes for filtering
const EVENT_TOPICS = {
    FeesDeposited: FEE_VAULT_INTERFACE.getEvent("FeesDeposited")?.topicHash,
    FeesEscrowed: FEE_VAULT_INTERFACE.getEvent("FeesEscrowed")?.topicHash,
    DevAssigned: FEE_VAULT_INTERFACE.getEvent("DevAssigned")?.topicHash,
    FeesExpired: FEE_VAULT_INTERFACE.getEvent("FeesExpired")?.topicHash,
    DevFeesClaimed: FEE_VAULT_INTERFACE.getEvent("DevFeesClaimed")?.topicHash,
    ProtocolFeesClaimed: FEE_VAULT_INTERFACE.getEvent("ProtocolFeesClaimed")?.topicHash,
};

// ─── Types ──────────────────────────────────────────────

export interface FeeIndexerConfig {
    rpcUrl?: string;
    feeVaultAddress?: string;
    startBlock?: number;
}

export interface IndexerStatus {
    isRunning: boolean;
    lastProcessedBlock: number | null;
    currentBlock: number | null;
    blockLag: number | null;
    lastError: string | null;
    eventsIndexed: number;
    startedAt: Date | null;
}

// ─── Fee Indexer Class ──────────────────────────────────

export class FeeIndexer {
    private provider: ethers.JsonRpcProvider;
    private rpcUrl: string;
    private feeVaultAddress: string;
    private startBlock: number;

    private isRunning = false;
    private pollTimer: ReturnType<typeof setTimeout> | null = null;
    private retryDelay = INITIAL_RETRY_DELAY_MS;
    private lastError: string | null = null;
    private eventsIndexed = 0;
    private startedAt: Date | null = null;
    private currentBlock: number | null = null;

    /** Cached poolId → projectId mapping from the projects table */
    private poolToProject = new Map<string, string>();

    constructor(config: FeeIndexerConfig = {}) {
        const env = getEnv();

        const rpcUrl = config.rpcUrl || env.BASE_RPC_URL;
        this.rpcUrl = rpcUrl;
        this.feeVaultAddress = config.feeVaultAddress || env.SIGIL_FEE_VAULT_ADDRESS;
        this.startBlock = config.startBlock || 0;

        if (!this.feeVaultAddress) {
            log.warn("SIGIL_FEE_VAULT_ADDRESS not configured — indexer disabled");
        }

        this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    /**
     * Start the indexer polling loop.
     * Will backfill from last processed block (or startBlock) to current.
     */
    async start(): Promise<void> {
        if (!this.feeVaultAddress) {
            log.warn("Cannot start — SIGIL_FEE_VAULT_ADDRESS not configured");
            return;
        }

        if (this.isRunning) {
            log.warn("Already running");
            return;
        }

        this.isRunning = true;
        this.startedAt = new Date();
        this.lastError = null;

        log.info({ rpc: this.rpcUrl, feeVault: this.feeVaultAddress }, "Starting fee indexer");

        // Initial backfill
        await this.catchUp();

        // Start polling loop
        this.schedulePoll();

        log.info("Fee indexer running");
    }

    /**
     * Stop the indexer gracefully.
     */
    stop(): void {
        if (!this.isRunning) {
            return;
        }

        log.info("Stopping fee indexer...");
        this.isRunning = false;

        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }

        log.info("Fee indexer stopped");
    }

    /**
     * Backfill historical events from a specific block.
     * Useful for initial indexing or recovery.
     */
    async backfill(fromBlock: number): Promise<void> {
        if (!this.feeVaultAddress) {
            throw new Error("SIGIL_FEE_VAULT_ADDRESS not configured");
        }

        log.info({ fromBlock }, "Backfilling from block");

        const currentBlock = await this.provider.getBlockNumber();
        let processedBlock = fromBlock;

        while (processedBlock < currentBlock) {
            const toBlock = Math.min(processedBlock + BACKFILL_BATCH_SIZE, currentBlock);

            log.debug({ from: processedBlock, to: toBlock }, "Backfill batch");

            await this.processBlockRange(processedBlock, toBlock);
            processedBlock = toBlock + 1;

            // Update state after each batch
            await updateLastProcessedBlock(toBlock);
        }

        log.info({ toBlock: currentBlock }, "Backfill complete");
    }

    /**
     * Get the current indexer status.
     */
    async getStatus(): Promise<IndexerStatus> {
        const lastProcessedBlock = await getLastProcessedBlock();

        try {
            this.currentBlock = await this.provider.getBlockNumber();
        } catch {
            // Keep last known value
        }

        return {
            isRunning: this.isRunning,
            lastProcessedBlock,
            currentBlock: this.currentBlock,
            blockLag:
                lastProcessedBlock !== null && this.currentBlock !== null
                    ? this.currentBlock - lastProcessedBlock
                    : null,
            lastError: this.lastError,
            eventsIndexed: this.eventsIndexed,
            startedAt: this.startedAt,
        };
    }

    // ─── Private Methods ────────────────────────────────

    private schedulePoll(): void {
        if (!this.isRunning) return;

        this.pollTimer = setTimeout(async () => {
            await this.poll();
            this.schedulePoll();
        }, POLL_INTERVAL_MS);
    }

    private async poll(): Promise<void> {
        try {
            await this.catchUp();
            this.retryDelay = INITIAL_RETRY_DELAY_MS; // Reset on success
            this.lastError = null;
        } catch (err) {
            const message = getErrorMessage(err, String(err));
            log.error({ err, retryDelay: this.retryDelay }, "Poll error");
            this.lastError = message;

            // Exponential backoff
            this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_DELAY_MS);
        }
    }

    private async catchUp(): Promise<void> {
        const currentBlock = await this.provider.getBlockNumber();
        this.currentBlock = currentBlock;

        // Refresh the poolId → projectId cache from the projects table
        await this.refreshPoolToProjectCache();

        // Backfill projectId on any existing records that have NULL projectId
        await this.backfillProjectIds();

        let lastProcessed = await getLastProcessedBlock();

        // If no state, start from configured block or current
        if (lastProcessed === null) {
            lastProcessed = this.startBlock > 0 ? this.startBlock - 1 : currentBlock - 1;
            await updateLastProcessedBlock(lastProcessed);
        }

        // Process any new blocks
        if (currentBlock > lastProcessed) {
            await this.processBlockRange(lastProcessed + 1, currentBlock);
            await updateLastProcessedBlock(currentBlock);
        }
    }

    /**
     * Refresh the poolId → projectId mapping from the projects table.
     * Called each poll cycle so newly deployed tokens are picked up.
     */
    private async refreshPoolToProjectCache(): Promise<void> {
        try {
            const db = getDb();
            const rows = await db
                .select({
                    poolId: schema.projects.poolId,
                    projectId: schema.projects.projectId,
                })
                .from(schema.projects);

            this.poolToProject.clear();
            for (const row of rows) {
                if (row.poolId) {
                    this.poolToProject.set(row.poolId, row.projectId);
                }
            }
        } catch (err) {
            if (err instanceof DatabaseUnavailableError) {
                // No DB — keep existing cache
                return;
            }
            log.warn({ err }, "Failed to refresh pool→project cache");
        }
    }

    /**
     * Backfill projectId on feeDistributions records where it's NULL.
     * Uses the poolToProject cache to update records by matching poolId.
     * Runs on startup to repair any records indexed before the projectId fix.
     */
    private async backfillProjectIds(): Promise<void> {
        if (this.poolToProject.size === 0) return;

        try {
            const db = getDb();

            // Update all feeDistributions with NULL projectId using the cache
            let updated = 0;
            for (const [poolId, projectId] of this.poolToProject) {
                const result = await db
                    .update(schema.feeDistributions)
                    .set({ projectId })
                    .where(
                        and(
                            eq(schema.feeDistributions.poolId, poolId),
                            isNull(schema.feeDistributions.projectId),
                        ),
                    );
                // Drizzle doesn't return affected rows directly, so just count the update calls
                updated++;
            }

            log.info(
                { poolMappings: this.poolToProject.size },
                "Backfilled projectId on fee distributions",
            );
        } catch (err) {
            if (err instanceof DatabaseUnavailableError) return;
            log.warn({ err }, "Failed to backfill projectIds");
        }
    }

    private async processBlockRange(fromBlock: number, toBlock: number): Promise<void> {
        // Get all fee vault events in range
        const filter = {
            address: this.feeVaultAddress,
            fromBlock,
            toBlock,
            topics: [
                [
                    EVENT_TOPICS.FeesDeposited,
                    EVENT_TOPICS.FeesEscrowed,
                    EVENT_TOPICS.DevAssigned,
                    EVENT_TOPICS.FeesExpired,
                    EVENT_TOPICS.DevFeesClaimed,
                    EVENT_TOPICS.ProtocolFeesClaimed,
                ].filter(Boolean) as string[],
            ],
        };

        const logs = await this.provider.getLogs(filter);

        if (logs.length === 0) return;

        log.info({ eventCount: logs.length, fromBlock, toBlock }, "Processing fee vault events");

        // Get block timestamps for all unique blocks
        const blockNumbers = [...new Set(logs.map((log) => log.blockNumber))];
        const blockTimestamps = new Map<number, Date>();

        for (const blockNum of blockNumbers) {
            const block = await this.provider.getBlock(blockNum);
            if (block) {
                blockTimestamps.set(blockNum, new Date(block.timestamp * 1000));
            }
        }

        // Process each log
        for (const log of logs) {
            const distribution = this.parseLog(log, blockTimestamps.get(log.blockNumber));
            if (distribution) {
                // Resolve projectId from poolId cache
                if (distribution.poolId && !distribution.projectId) {
                    const projectId = this.poolToProject.get(distribution.poolId);
                    if (projectId) {
                        distribution.projectId = projectId;
                    }
                }

                const created = await createFeeDistribution(distribution);
                if (created) {
                    this.eventsIndexed++;
                }
            }
        }
    }

    private parseLog(eventLog: ethers.Log, blockTimestamp?: Date): FeeDistributionInsert | null {
        const timestamp = blockTimestamp || new Date();

        try {
            const parsed = FEE_VAULT_INTERFACE.parseLog({
                topics: eventLog.topics as string[],
                data: eventLog.data,
            });

            if (!parsed) return null;

            const base = {
                txHash: eventLog.transactionHash,
                blockNumber: eventLog.blockNumber,
                logIndex: eventLog.index,
                blockTimestamp: timestamp,
            };

            switch (parsed.name) {
                case "FeesDeposited":
                    return {
                        ...base,
                        eventType: "deposit" as FeeEventType,
                        poolId: parsed.args[0], // poolId
                        devAddress: parsed.args[1], // dev
                        tokenAddress: parsed.args[2], // token
                        devAmount: parsed.args[3].toString(), // devAmount
                        protocolAmount: parsed.args[4].toString(), // protocolAmount
                    };

                case "FeesEscrowed":
                    return {
                        ...base,
                        eventType: "escrow" as FeeEventType,
                        poolId: parsed.args[0], // poolId
                        tokenAddress: parsed.args[1], // token
                        amount: parsed.args[2].toString(), // amount
                    };

                case "DevAssigned":
                    return {
                        ...base,
                        eventType: "dev_assigned" as FeeEventType,
                        poolId: parsed.args[0], // poolId
                        devAddress: parsed.args[1], // dev
                        tokenAddress: ethers.ZeroAddress, // Not in event, use zero
                        amount: parsed.args[2].toString(), // tokensTransferred
                    };

                case "FeesExpired":
                    return {
                        ...base,
                        eventType: "expired" as FeeEventType,
                        poolId: parsed.args[0], // poolId
                        tokenAddress: parsed.args[1], // token
                        amount: parsed.args[2].toString(), // amount
                    };

                case "DevFeesClaimed":
                    return {
                        ...base,
                        eventType: "dev_claimed" as FeeEventType,
                        devAddress: parsed.args[0], // dev
                        tokenAddress: parsed.args[1], // token
                        amount: parsed.args[2].toString(), // amount
                    };

                case "ProtocolFeesClaimed":
                    return {
                        ...base,
                        eventType: "protocol_claimed" as FeeEventType,
                        tokenAddress: parsed.args[0], // token
                        amount: parsed.args[1].toString(), // amount
                        recipientAddress: parsed.args[2], // to
                    };

                default:
                    return null;
            }
        } catch (err) {
            log.error({ err, txHash: eventLog.transactionHash }, "Failed to parse log");
            return null;
        }
    }
}

// ─── Singleton Instance ─────────────────────────────────

let _indexer: FeeIndexer | null = null;

/**
 * Get the singleton fee indexer instance.
 * Creates it on first call.
 */
export function getFeeIndexer(config?: FeeIndexerConfig): FeeIndexer {
    if (!_indexer) {
        _indexer = new FeeIndexer(config);
    }
    return _indexer;
}

/**
 * Check if the fee indexer is configured and can run.
 */
export function isFeeIndexerConfigured(): boolean {
    const env = getEnv();
    return !!env.SIGIL_FEE_VAULT_ADDRESS;
}
