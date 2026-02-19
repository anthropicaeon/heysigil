/**
 * Fee Collector Service
 *
 * Two responsibilities:
 * 1. Periodically calls SigilLPLocker.collectFees() to harvest accrued V3 LP fees
 * 2. On startup, backfills assignDev() on SigilFeeVault for verified projects
 *    whose escrowed fees haven't been assigned to a dev wallet yet
 */

import { ethers } from "ethers";
import { eq } from "drizzle-orm";
import { getEnv } from "../config/env.js";
import { loggers } from "../utils/logger.js";
import { getDb, schema, DatabaseUnavailableError } from "../db/client.js";

const log = loggers.server;

// ─── Constants ──────────────────────────────────────────

const COLLECT_INTERVAL_MS = 60_000; // Collect every 60 seconds

const LP_LOCKER_ABI = [
    "function lockedTokenIds(uint256 index) view returns (uint256)",
    "function getLockedCount() view returns (uint256)",
    "function collectFeesMulti(uint256[] calldata tokenIds) external",
    "function collectFees(uint256 tokenId) external",
    "function positions(uint256 tokenId) view returns (bytes32 poolId, address dev, address token0, address token1, bool locked)",
];

const FEE_VAULT_ABI = [
    "function assignDev(bytes32 poolId, address dev) external",
    "function poolAssigned(bytes32 poolId) view returns (bool)",
];

// ─── Fee Collector Class ────────────────────────────────

export class FeeCollector {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private locker: ethers.Contract;
    private vault: ethers.Contract;
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

        const feeVaultAddress = env.SIGIL_FEE_VAULT_ADDRESS;
        this.vault = new ethers.Contract(feeVaultAddress, FEE_VAULT_ABI, this.wallet);
    }

    async start(): Promise<void> {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startedAt = new Date();

        log.info(
            { locker: this.lockerAddress, wallet: this.wallet.address },
            "Fee collector starting",
        );

        // Backfill: assign dev wallets for verified projects with escrowed fees
        await this.assignDevBackfill();

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

    // ─── Assign Dev Backfill ─────────────────────────────

    /**
     * On startup, find all verified projects with poolIds and call
     * vault.assignDev(poolId, devWallet) for any that haven't been
     * assigned yet. This moves escrowed fees into the dev's claimable balance.
     */
    private async assignDevBackfill(): Promise<void> {
        try {
            const db = getDb();

            // Get all projects that have a poolId
            const projects = await db
                .select({
                    projectId: schema.projects.projectId,
                    poolId: schema.projects.poolId,
                    name: schema.projects.name,
                })
                .from(schema.projects);

            let assigned = 0;
            let skipped = 0;

            for (const project of projects) {
                if (!project.poolId) continue;

                // Find the verification wallet for this project
                // projectId in projects is "github:owner/repo", in verifications it's "owner/repo"
                const normalizedId = project.projectId.replace("github:", "");

                log.info(
                    { project: project.name, projectId: project.projectId, normalizedId },
                    "assignDev: looking up verification",
                );

                // Try normalized first, then original
                let verification = await db
                    .select({ walletAddress: schema.verifications.walletAddress })
                    .from(schema.verifications)
                    .where(eq(schema.verifications.projectId, normalizedId))
                    .then((rows) => rows[0] || null);

                if (!verification) {
                    // Try original projectId format
                    verification = await db
                        .select({ walletAddress: schema.verifications.walletAddress })
                        .from(schema.verifications)
                        .where(eq(schema.verifications.projectId, project.projectId))
                        .then((rows) => rows[0] || null);
                }

                if (!verification) {
                    log.info(
                        { project: project.name, normalizedId },
                        "assignDev: no verification found",
                    );
                    skipped++;
                    continue;
                }

                log.info(
                    { project: project.name, dev: verification.walletAddress },
                    "assignDev: verification found",
                );

                try {
                    // Wait before RPC calls to avoid rate limiting
                    await new Promise((r) => setTimeout(r, 2000));

                    // Call assignDev directly — contract reverts are handled below
                    const nonce = await this.provider.getTransactionCount(
                        this.wallet.address,
                        "latest",
                    );

                    await new Promise((r) => setTimeout(r, 1000));

                    const tx = await this.vault.assignDev(
                        project.poolId,
                        verification.walletAddress,
                        { nonce },
                    );
                    await tx.wait(1);
                    assigned++;

                    // Wait for nonce to propagate before next tx
                    await new Promise((r) => setTimeout(r, 3000));

                    log.info(
                        {
                            project: project.name,
                            poolId: project.poolId.slice(0, 18) + "...",
                            dev: verification.walletAddress,
                        },
                        "Dev assigned on fee vault",
                    );
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    // Only PoolAlreadyAssigned or NoUnclaimedFees are truly expected
                    if (msg.includes("PoolAlreadyAssigned") || msg.includes("NoUnclaimedFees")) {
                        log.info(
                            { project: project.name },
                            "assignDev: already assigned or no fees",
                        );
                        skipped++;
                    } else {
                        // Log the full error including revert data for debugging
                        const errData =
                            (err as any)?.data || (err as any)?.error?.data || "no data";
                        log.warn(
                            { project: project.name, err: msg.slice(0, 300), revertData: errData },
                            "assignDev: FAILED — investigate this revert",
                        );
                    }
                }
            }

            if (assigned > 0) {
                log.info({ assigned, skipped }, "Dev assignment backfill complete");
            }
        } catch (err) {
            if (err instanceof DatabaseUnavailableError) return;
            const msg = err instanceof Error ? err.message : String(err);
            log.warn({ err: msg }, "Dev assignment backfill failed");
        }
    }

    // ─── Fee Collection ──────────────────────────────────

    private async collect(): Promise<void> {
        try {
            // 1. Get all locked token IDs
            const count = await this.locker.getLockedCount();
            const lockedCount = Number(count);

            if (lockedCount === 0) {
                log.debug("No locked positions — skipping fee collection");
                return;
            }

            // 2. Read all token IDs
            const tokenIds: bigint[] = [];
            for (let i = 0; i < lockedCount; i++) {
                const tokenId = await this.locker.lockedTokenIds(i);
                tokenIds.push(tokenId);
            }

            log.info({ positionCount: tokenIds.length }, "Collecting LP fees");

            // 3. Collect fees one position at a time
            //    (collectFeesMulti reverts entirely if ANY position fails)
            let collected = 0;
            let skipped = 0;

            for (const tokenId of tokenIds) {
                try {
                    const nonce = await this.provider.getTransactionCount(
                        this.wallet.address,
                        "latest",
                    );
                    const tx = await this.locker.collectFees(tokenId, { nonce });
                    await tx.wait(1);
                    collected++;
                } catch {
                    skipped++;
                }
            }

            this.collectCount++;
            this.lastError = null;

            if (collected > 0) {
                log.info({ collected, skipped, totalRuns: this.collectCount }, "LP fees collected");
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
