/**
 * Fee Collector Service
 *
 * Periodically calls SigilLPLocker.collectFeesMulti() to harvest accrued V3 LP fees.
 * Dev assignment backfill is handled separately by runDevAssignmentBackfill() in fee-routing.ts.
 */

import { ethers } from "ethers";
import { getEnv } from "../config/env.js";
import { loggers } from "../utils/logger.js";

const log = loggers.server;

// ─── Constants ──────────────────────────────────────────

const COLLECT_INTERVAL_MS = 24 * 60 * 60_000; // Collect once per day

const LP_LOCKER_ABI = [
    "function lockedTokenIds(uint256 index) view returns (uint256)",
    "function getLockedCount() view returns (uint256)",
    "function collectFeesMulti(uint256[] calldata tokenIds) external",
    "function collectFees(uint256 tokenId) external",
    "function positions(uint256 tokenId) view returns (bytes32 poolId, address dev, address token0, address token1, bool locked)",
];

// ─── Fee Collector Class ────────────────────────────────

export class FeeCollector {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private locker: ethers.Contract;
    private lockerAddress: string;

    private isRunning = false;
    private pollTimer: ReturnType<typeof setTimeout> | null = null;
    private collectCount = 0;
    private lastError: string | null = null;
    private startedAt: Date | null = null;

    constructor() {
        const env = getEnv();

        if (!env.DEPLOYER_PRIVATE_KEY) {
            throw new Error("DEPLOYER_PRIVATE_KEY required for fee collector");
        }
        if (!env.SIGIL_LP_LOCKER_ADDRESS) {
            throw new Error("SIGIL_LP_LOCKER_ADDRESS required for fee collector");
        }

        this.lockerAddress = env.SIGIL_LP_LOCKER_ADDRESS;
        this.provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);
        this.wallet = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, this.provider);
        this.locker = new ethers.Contract(this.lockerAddress, LP_LOCKER_ABI, this.wallet);
    }

    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startedAt = new Date();

        log.info(
            { locker: this.lockerAddress, wallet: this.wallet.address },
            "Fee collector starting",
        );

        // Run fee collection immediately, then on interval
        await this.collect();
        this.schedulePoll();
    }

    stop(): void {
        this.isRunning = false;
        if (this.pollTimer) {
            clearTimeout(this.pollTimer);
            this.pollTimer = null;
        }
        log.info({ collectCount: this.collectCount }, "Fee collector stopped");
    }

    getStatus() {
        return {
            running: this.isRunning,
            collectCount: this.collectCount,
            lastError: this.lastError,
            startedAt: this.startedAt,
        };
    }

    private schedulePoll(): void {
        if (!this.isRunning) return;
        this.pollTimer = setTimeout(() => {
            this.collect()
                .catch((err) => {
                    this.lastError = err instanceof Error ? err.message : String(err);
                    log.error({ err: this.lastError }, "Fee collection failed");
                })
                .finally(() => this.schedulePoll());
        }, COLLECT_INTERVAL_MS);
    }

    // ─── Fee Collection ──────────────────────────────────

    private async collect(): Promise<void> {
        try {
            let totalCollected = 0;
            let totalSkipped = 0;

            const count = await this.locker.getLockedCount();
            const lockedCount = Number(count);

            if (lockedCount === 0) {
                this.collectCount++;
                return;
            }

            const tokenIds: bigint[] = [];
            for (let i = 0; i < lockedCount; i++) {
                const tokenId = await this.locker.lockedTokenIds(i);
                tokenIds.push(tokenId);
            }

            // Use collectFeesMulti for atomic batch collection (1 tx per locker)
            try {
                const tx = await this.locker.collectFeesMulti(tokenIds);
                await tx.wait(1);
                totalCollected += tokenIds.length;
            } catch (batchErr) {
                // Fallback: per-NFT collection if batch fails
                log.warn(
                    { err: String(batchErr) },
                    "collectFeesMulti failed, falling back to per-NFT",
                );
                for (const tokenId of tokenIds) {
                    try {
                        const tx = await this.locker.collectFees(tokenId);
                        await tx.wait(1);
                        totalCollected++;
                    } catch {
                        totalSkipped++;
                    }
                }
            }

            this.collectCount++;
            this.lastError = null;

            if (totalCollected > 0) {
                log.info(
                    {
                        collected: totalCollected,
                        skipped: totalSkipped,
                        totalRuns: this.collectCount,
                    },
                    "LP fees collected",
                );
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.lastError = msg;
            log.error({ err: msg }, "Fee collection cycle failed");
        }
    }
}

// ─── Singleton ──────────────────────────────────────────

let _collector: FeeCollector | null = null;

export function getFeeCollector(): FeeCollector {
    if (!_collector) {
        _collector = new FeeCollector();
    }
    return _collector;
}

export function isFeeCollectorConfigured(): boolean {
    const env = getEnv();
    return !!(env.DEPLOYER_PRIVATE_KEY && env.SIGIL_LP_LOCKER_ADDRESS);
}
