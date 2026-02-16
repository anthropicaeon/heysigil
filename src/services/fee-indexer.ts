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
import { getEnv } from "../config/env.js";
import {
    createFeeDistribution,
    getLastProcessedBlock,
    updateLastProcessedBlock,
    type FeeEventType,
    type FeeDistributionInsert,
} from "../db/repositories/index.js";

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
    private feeVaultAddress: string;
    private startBlock: number;

    private isRunning = false;
    private pollTimer: ReturnType<typeof setTimeout> | null = null;
    private retryDelay = INITIAL_RETRY_DELAY_MS;
    private lastError: string | null = null;
    private eventsIndexed = 0;
    private startedAt: Date | null = null;
    private currentBlock: number | null = null;

    constructor(config: FeeIndexerConfig = {}) {
        const env = getEnv();

        const rpcUrl = config.rpcUrl || env.BASE_RPC_URL;
        this.feeVaultAddress = config.feeVaultAddress || env.SIGIL_FEE_VAULT_ADDRESS;
        this.startBlock = config.startBlock || 0;

        if (!this.feeVaultAddress) {
            console.warn("[fee-indexer] SIGIL_FEE_VAULT_ADDRESS not configured — indexer disabled");
        }

        this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    /**
     * Start the indexer polling loop.
     * Will backfill from last processed block (or startBlock) to current.
     */
    async start(): Promise<void> {
        if (!this.feeVaultAddress) {
            console.warn("[fee-indexer] Cannot start — SIGIL_FEE_VAULT_ADDRESS not configured");
            return;
        }

        if (this.isRunning) {
            console.warn("[fee-indexer] Already running");
            return;
        }

        this.isRunning = true;
        this.startedAt = new Date();
        this.lastError = null;

        console.log(`[fee-indexer] Starting...`);
        console.log(`[fee-indexer]   RPC: ${this.provider._getConnection().url}`);
        console.log(`[fee-indexer]   Fee Vault: ${this.feeVaultAddress}`);

        // Initial backfill
        await this.catchUp();

        // Start polling loop
        this.schedulePoll();

        console.log("[fee-indexer] Running");
    }

    /**
     * Stop the indexer gracefully.
     */
    stop(): void {
        if (!this.isRunning) {
            return;
        }

        console.log("[fee-indexer] Stopping...");
        this.isRunning = false;

        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }

        console.log("[fee-indexer] Stopped");
    }

    /**
     * Backfill historical events from a specific block.
     * Useful for initial indexing or recovery.
     */
    async backfill(fromBlock: number): Promise<void> {
        if (!this.feeVaultAddress) {
            throw new Error("SIGIL_FEE_VAULT_ADDRESS not configured");
        }

        console.log(`[fee-indexer] Backfilling from block ${fromBlock}...`);

        const currentBlock = await this.provider.getBlockNumber();
        let processedBlock = fromBlock;

        while (processedBlock < currentBlock) {
            const toBlock = Math.min(processedBlock + BACKFILL_BATCH_SIZE, currentBlock);

            console.log(`[fee-indexer] Backfill: blocks ${processedBlock} → ${toBlock}`);

            await this.processBlockRange(processedBlock, toBlock);
            processedBlock = toBlock + 1;

            // Update state after each batch
            await updateLastProcessedBlock(toBlock);
        }

        console.log(`[fee-indexer] Backfill complete. Processed to block ${currentBlock}`);
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
            const message = err instanceof Error ? err.message : String(err);
            console.error(`[fee-indexer] Poll error: ${message}`);
            this.lastError = message;

            // Exponential backoff
            this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_DELAY_MS);
        }
    }

    private async catchUp(): Promise<void> {
        const currentBlock = await this.provider.getBlockNumber();
        this.currentBlock = currentBlock;

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

        console.log(
            `[fee-indexer] Processing ${logs.length} events in blocks ${fromBlock}-${toBlock}`,
        );

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
                const created = await createFeeDistribution(distribution);
                if (created) {
                    this.eventsIndexed++;
                }
            }
        }
    }

    private parseLog(log: ethers.Log, blockTimestamp?: Date): FeeDistributionInsert | null {
        const timestamp = blockTimestamp || new Date();

        try {
            const parsed = FEE_VAULT_INTERFACE.parseLog({
                topics: log.topics as string[],
                data: log.data,
            });

            if (!parsed) return null;

            const base = {
                txHash: log.transactionHash,
                blockNumber: log.blockNumber,
                logIndex: log.index,
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
            console.error(`[fee-indexer] Failed to parse log: ${err}`);
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
