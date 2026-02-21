/**
 * Migration Relayer Service
 *
 * Watches for V1 token transfers to the relayer hot wallet.
 * If sender is whitelisted (on-chain snapshot): sends V2 back.
 * If sender is NOT whitelisted: returns V1 immediately.
 *
 * Private key safety:
 * - Uses DEPLOYER_PRIVATE_KEY from env (never logged — pino redacts "privateKey")
 * - Key only enters ethers.Wallet constructor
 * - No key exposure in API responses, logs, or error messages
 */

import { ethers } from "ethers";
import { eq, sql } from "drizzle-orm";

import { getEnv } from "../config/env.js";
import { getDb, schema } from "../db/client.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("migration-relayer");

// ─── Constants ──────────────────────────────────────────

const POLL_INTERVAL_MS = 15_000; // Check every 15 seconds
const CONFIRMATIONS = 2; // Wait for 2 block confirmations
const MAX_BLOCKS_PER_POLL = 2000; // Don't scan too far back at once

// ─── ABIs (minimal) ─────────────────────────────────────

const ERC20_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
];

const MIGRATOR_ABI = [
    "function allocation(address) view returns (uint256)",
    "function claimed(address) view returns (uint256)",
];

// ─── Relayer Class ──────────────────────────────────────

export class MigrationRelayer {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private v1Token: ethers.Contract;
    private v2Token: ethers.Contract;
    private migrator: ethers.Contract;
    private relayerAddress: string;

    private isRunning = false;
    private pollTimer: ReturnType<typeof setTimeout> | null = null;
    private lastProcessedBlock = 0;
    private relayCount = 0;
    private returnCount = 0;
    private lastError: string | null = null;
    private startedAt: Date | null = null;

    constructor() {
        const env = getEnv();

        if (!env.MIGRATION_RELAYER_PRIVATE_KEY) {
            throw new Error("MIGRATION_RELAYER_PRIVATE_KEY required for migration relayer");
        }
        if (!env.V1_TOKEN_ADDRESS || !env.V2_TOKEN_ADDRESS || !env.MIGRATOR_ADDRESS) {
            throw new Error("V1_TOKEN_ADDRESS, V2_TOKEN_ADDRESS, and MIGRATOR_ADDRESS required");
        }
        if (!env.MIGRATION_RELAYER_ADDRESS) {
            throw new Error("MIGRATION_RELAYER_ADDRESS required for migration relayer");
        }

        this.relayerAddress = env.MIGRATION_RELAYER_ADDRESS;
        this.provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);
        this.wallet = new ethers.Wallet(env.MIGRATION_RELAYER_PRIVATE_KEY, this.provider);
        this.v1Token = new ethers.Contract(env.V1_TOKEN_ADDRESS, ERC20_ABI, this.wallet);
        this.v2Token = new ethers.Contract(env.V2_TOKEN_ADDRESS, ERC20_ABI, this.wallet);
        this.migrator = new ethers.Contract(env.MIGRATOR_ADDRESS, MIGRATOR_ABI, this.provider);

        // Sanity check: wallet must match relayer address
        if (this.wallet.address.toLowerCase() !== this.relayerAddress.toLowerCase()) {
            throw new Error(
                `Wallet address ${this.wallet.address} does not match MIGRATION_RELAYER_ADDRESS ${this.relayerAddress}`,
            );
        }
    }

    // ─── Lifecycle ───────────────────────────────────────

    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startedAt = new Date();

        // Start from recent blocks (last ~5 minutes)
        const currentBlock = await this.provider.getBlockNumber();
        this.lastProcessedBlock = currentBlock - 20; // ~1 minute of blocks on Base

        log.info(
            { relayerAddress: this.relayerAddress, startBlock: this.lastProcessedBlock },
            "Migration relayer starting",
        );

        // Poll immediately, then on interval
        await this.poll();
        this.schedulePoll();
    }

    stop(): void {
        this.isRunning = false;
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        log.info(
            { relayCount: this.relayCount, returnCount: this.returnCount },
            "Migration relayer stopped",
        );
    }

    getStatus() {
        return {
            running: this.isRunning,
            relayerAddress: this.relayerAddress,
            relayCount: this.relayCount,
            returnCount: this.returnCount,
            lastProcessedBlock: this.lastProcessedBlock,
            lastError: this.lastError,
            startedAt: this.startedAt,
        };
    }

    private schedulePoll(): void {
        if (!this.isRunning) return;
        this.pollTimer = setTimeout(() => {
            this.poll()
                .catch((err) => {
                    this.lastError = err instanceof Error ? err.message : String(err);
                    log.error({ err: this.lastError }, "Migration relayer poll failed");
                })
                .finally(() => this.schedulePoll());
        }, POLL_INTERVAL_MS);
    }

    // ─── Poll for V1 Transfers ──────────────────────────

    private async poll(): Promise<void> {
        try {
            const currentBlock = await this.provider.getBlockNumber();
            const safeBlock = currentBlock - CONFIRMATIONS;

            if (safeBlock <= this.lastProcessedBlock) return;

            const fromBlock = this.lastProcessedBlock + 1;
            const toBlock = Math.min(safeBlock, fromBlock + MAX_BLOCKS_PER_POLL - 1);

            // Query Transfer events TO our relayer address
            const transferFilter = this.v1Token.filters.Transfer(null, this.relayerAddress);
            const events = await this.v1Token.queryFilter(transferFilter, fromBlock, toBlock);

            if (events.length > 0) {
                log.info(
                    { count: events.length, fromBlock, toBlock },
                    "Found V1 transfers to relayer",
                );
            }

            for (const event of events) {
                const parsedEvent = event as ethers.EventLog;
                await this.processTransfer(parsedEvent);
            }

            this.lastProcessedBlock = toBlock;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.lastError = msg;
            log.error({ err: msg }, "Poll cycle failed");
        }
    }

    // ─── Process a Single V1 Transfer ───────────────────

    private async processTransfer(event: ethers.EventLog): Promise<void> {
        const sender = event.args[0] as string;
        const amount = event.args[2] as bigint;
        const txHash = event.transactionHash;
        const blockNumber = event.blockNumber;

        // 1. Deduplicate
        try {
            const db = getDb();
            const existing = await db
                .select()
                .from(schema.migrationRelays)
                .where(eq(schema.migrationRelays.txHashIn, txHash))
                .limit(1);

            if (existing.length > 0) {
                log.debug({ txHash }, "Transfer already processed, skipping");
                return;
            }
        } catch {
            log.warn({ txHash }, "DB check failed, proceeding with caution");
        }

        log.info(
            { sender, amount: amount.toString(), txHash, blockNumber },
            "Processing V1 transfer",
        );

        // 2. Check on-chain allocation
        let allocation: bigint;
        let claimed: bigint;
        try {
            [allocation, claimed] = await Promise.all([
                this.migrator.allocation(sender) as Promise<bigint>,
                this.migrator.claimed(sender) as Promise<bigint>,
            ]);
        } catch (err) {
            log.error({ sender, err: String(err) }, "Failed to read migrator state");
            await this.recordRelay(
                sender,
                amount,
                txHash,
                blockNumber,
                "failed",
                null,
                null,
                String(err),
            );
            return;
        }

        // 3. Check already-relayed amount from DB
        let alreadyRelayed = BigInt(0);
        try {
            const db = getDb();
            const result = await db
                .select({
                    total: sql<string>`COALESCE(SUM(CAST(${schema.migrationRelays.v2AmountSent} AS NUMERIC)), 0)`,
                })
                .from(schema.migrationRelays)
                .where(
                    sql`${schema.migrationRelays.senderAddress} = ${sender.toLowerCase()} AND ${schema.migrationRelays.status} = 'sent'`,
                );

            if (result[0]?.total) {
                alreadyRelayed = BigInt(result[0].total);
            }
        } catch {
            log.warn({ sender }, "Failed to query relayed amounts from DB");
        }

        // 4. Compute remaining
        const remaining = allocation - claimed - alreadyRelayed;

        // 5a. Not whitelisted → return V1
        if (allocation === BigInt(0)) {
            log.info({ sender, txHash }, "Sender not whitelisted, returning V1");
            await this.returnV1(sender, amount, txHash, blockNumber, "not_whitelisted");
            return;
        }

        // 5b. Over allocation → return V1
        if (amount > remaining) {
            log.info(
                { sender, amount: amount.toString(), remaining: remaining.toString(), txHash },
                "Amount exceeds remaining allocation, returning V1",
            );
            await this.returnV1(sender, amount, txHash, blockNumber, "over_allocation");
            return;
        }

        // 5c. Valid → send V2
        await this.sendV2(sender, amount, txHash, blockNumber);
    }

    // ─── Return V1 to sender ────────────────────────────

    private async returnV1(
        sender: string,
        amount: bigint,
        txHashIn: string,
        blockNumber: number,
        reason: string,
    ): Promise<void> {
        try {
            const tx = await this.v1Token.transfer(sender, amount);
            const receipt = await tx.wait(1);
            const txHashOut = receipt.hash;

            this.returnCount++;

            log.info(
                { sender, amount: amount.toString(), txHashOut, reason },
                "V1 tokens returned to sender",
            );

            await this.recordRelay(
                sender,
                amount,
                txHashIn,
                blockNumber,
                "returned",
                null,
                txHashOut,
                null,
                reason,
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            log.error({ sender, amount: amount.toString(), err: msg }, "Failed to return V1");
            await this.recordRelay(
                sender,
                amount,
                txHashIn,
                blockNumber,
                "failed",
                null,
                null,
                msg,
                reason,
            );
        }
    }

    // ─── Send V2 to sender ──────────────────────────────

    private async sendV2(
        sender: string,
        amount: bigint,
        txHashIn: string,
        blockNumber: number,
    ): Promise<void> {
        try {
            // Verify we have enough V2 balance
            const v2Balance = (await this.v2Token.balanceOf(this.relayerAddress)) as bigint;
            if (v2Balance < amount) {
                log.error(
                    { needed: amount.toString(), available: v2Balance.toString() },
                    "Insufficient V2 balance to relay",
                );
                // Return V1 instead of failing silently
                await this.returnV1(sender, amount, txHashIn, blockNumber, "insufficient_v2");
                return;
            }

            const tx = await this.v2Token.transfer(sender, amount);
            const receipt = await tx.wait(1);
            const txHashOut = receipt.hash;

            this.relayCount++;

            log.info({ sender, amount: amount.toString(), txHashOut }, "V2 tokens sent to sender");

            await this.recordRelay(
                sender,
                amount,
                txHashIn,
                blockNumber,
                "sent",
                amount.toString(),
                txHashOut,
            );
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            log.error({ sender, amount: amount.toString(), err: msg }, "Failed to send V2");
            await this.recordRelay(
                sender,
                amount,
                txHashIn,
                blockNumber,
                "failed",
                null,
                null,
                msg,
            );
        }
    }

    // ─── Record to DB ───────────────────────────────────

    private async recordRelay(
        sender: string,
        v1Amount: bigint,
        txHashIn: string,
        blockNumber: number,
        status: string,
        v2AmountSent: string | null = null,
        txHashOut: string | null = null,
        error: string | null = null,
        reason: string | null = null,
    ): Promise<void> {
        try {
            const db = getDb();
            await db
                .insert(schema.migrationRelays)
                .values({
                    senderAddress: sender.toLowerCase(),
                    v1Amount: v1Amount.toString(),
                    v2AmountSent: v2AmountSent,
                    v1Returned: status === "returned" ? 1 : 0,
                    txHashIn,
                    txHashOut,
                    blockNumber,
                    status,
                    reason,
                    error,
                    processedAt: status !== "pending" ? new Date() : null,
                })
                .onConflictDoNothing();
        } catch (err) {
            log.error(
                { txHashIn, err: err instanceof Error ? err.message : String(err) },
                "Failed to record relay in DB",
            );
        }
    }
}

// ─── Singleton ──────────────────────────────────────────

let _relayer: MigrationRelayer | null = null;

export function getMigrationRelayer(): MigrationRelayer {
    if (!_relayer) {
        _relayer = new MigrationRelayer();
    }
    return _relayer;
}

export function isMigrationRelayerConfigured(): boolean {
    const env = getEnv();
    return !!(
        env.MIGRATION_RELAYER_PRIVATE_KEY &&
        env.MIGRATION_RELAYER_ADDRESS &&
        env.V1_TOKEN_ADDRESS &&
        env.V2_TOKEN_ADDRESS &&
        env.MIGRATOR_ADDRESS
    );
}
