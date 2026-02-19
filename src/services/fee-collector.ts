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
import { ensureDevFeeRoutingAndEscrowRelease } from "./fee-routing.js";

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

// ─── Fee Collector Class ────────────────────────────────

export class FeeCollector {
    private provider: ethers.JsonRpcProvider;
    private wallet: ethers.Wallet;
    private locker: ethers.Contract;
    private lockerAddress: string;
    // V1 legacy contracts (old positions)
    private lockerV1: ethers.Contract | null = null;

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

        // Wire up V1 legacy contracts if configured
        if (env.SIGIL_LP_LOCKER_ADDRESS_V1) {
            this.lockerV1 = new ethers.Contract(
                env.SIGIL_LP_LOCKER_ADDRESS_V1,
                LP_LOCKER_ABI,
                this.wallet,
            );
        }
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
                    poolTokenAddress: schema.projects.poolTokenAddress,
                    name: schema.projects.name,
                    ownerWallet: schema.projects.ownerWallet,
                })
                .from(schema.projects);

            let assigned = 0;
            let skipped = 0;

            for (const project of projects) {
                if (!project.poolId) continue;

                let walletAddress = project.ownerWallet;
                const normalizedId = project.projectId.replace("github:", "");

                if (!walletAddress) {
                    log.info(
                        { project: project.name, projectId: project.projectId, normalizedId },
                        "assignDev: looking up verification fallback",
                    );

                    // Try normalized first, then original.
                    const verification = await db
                        .select({ walletAddress: schema.verifications.walletAddress })
                        .from(schema.verifications)
                        .where(eq(schema.verifications.projectId, normalizedId))
                        .then((rows) => rows[0] || null);

                    if (verification?.walletAddress) {
                        walletAddress = verification.walletAddress;
                    } else {
                        const verificationOriginal = await db
                            .select({ walletAddress: schema.verifications.walletAddress })
                            .from(schema.verifications)
                            .where(eq(schema.verifications.projectId, project.projectId))
                            .then((rows) => rows[0] || null);
                        walletAddress = verificationOriginal?.walletAddress ?? null;
                    }
                }

                if (!walletAddress) {
                    log.info(
                        { project: project.name, normalizedId },
                        "assignDev: no owner wallet found",
                    );
                    skipped++;
                    continue;
                }

                log.info(
                    { project: project.name, dev: walletAddress },
                    "assignDev: owner wallet resolved",
                );

                try {
                    // Wait before RPC calls to avoid rate limiting
                    await new Promise((r) => setTimeout(r, 2000));
                    const result = await ensureDevFeeRoutingAndEscrowRelease({
                        poolId: project.poolId,
                        walletAddress,
                        projectId: project.projectId,
                        poolTokenAddress: project.poolTokenAddress,
                    });

                    if (
                        result.escrowAction === "assigned" ||
                        result.escrowAction === "reassigned"
                    ) {
                        assigned++;
                    } else {
                        skipped++;
                    }

                    log.info(
                        {
                            project: project.name,
                            poolId: project.poolId.slice(0, 18) + "...",
                            dev: walletAddress,
                            hookRoutingUpdated: result.hookRoutingUpdated,
                            hookRoutingBlockedByPoolAssigned:
                                result.hookRoutingBlockedByPoolAssigned,
                            lockerRoutingUpdated: result.lockerRoutingUpdated,
                            escrowAction: result.escrowAction,
                        },
                        "assignDev backfill completed for project",
                    );
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    log.warn(
                        { project: project.name, err: msg.slice(0, 300) },
                        "assignDev: FAILED — investigate this revert",
                    );
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
            let totalCollected = 0;
            let totalSkipped = 0;

            // Collect from all lockers (V2 + V1)
            const lockers = [
                { label: "V2", contract: this.locker },
                ...(this.lockerV1 ? [{ label: "V1", contract: this.lockerV1 }] : []),
            ];

            for (const { label, contract } of lockers) {
                try {
                    const count = await contract.getLockedCount();
                    const lockedCount = Number(count);

                    if (lockedCount === 0) continue;

                    const tokenIds: bigint[] = [];
                    for (let i = 0; i < lockedCount; i++) {
                        const tokenId = await contract.lockedTokenIds(i);
                        tokenIds.push(tokenId);
                    }

                    for (const tokenId of tokenIds) {
                        try {
                            const nonce = await this.provider.getTransactionCount(
                                this.wallet.address,
                                "latest",
                            );
                            const tx = await contract.collectFees(tokenId, { nonce });
                            await tx.wait(1);
                            totalCollected++;
                        } catch {
                            totalSkipped++;
                        }
                    }
                } catch (err) {
                    log.warn({ label, err: String(err) }, "Skipping locker during collection");
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
