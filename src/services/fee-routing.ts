import { ethers } from "ethers";
import { getEnv } from "../config/env.js";
import { loggers } from "../utils/logger.js";
import { getDb, schema, DatabaseUnavailableError } from "../db/client.js";

const log = loggers.server;

const SET_DEV_ABI = ["function setDevForPool(bytes32 poolId, address dev) external"];

const FACTORY_V3_LAUNCH_ABI = [
    "function getLaunchInfo(address token) view returns (tuple(address token, address dev, string projectId, bytes32 poolId, address pool, uint256[] lpTokenIds, uint256 launchedAt, address launchedBy))",
];

const LOCKER_ABI = ["function updateDev(uint256 tokenId, address newDev) external"];

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

function isPoolId(value: string): boolean {
    return /^0x[0-9a-fA-F]{64}$/.test(value);
}

async function getAdminWallet(): Promise<ethers.Wallet | null> {
    const env = getEnv();
    if (!env.DEPLOYER_PRIVATE_KEY) return null;
    const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL || "https://mainnet.base.org");
    return new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, provider);
}

async function trySyncV3LockerDev(
    wallet: ethers.Wallet,
    poolId: string,
    walletAddress: string,
    poolTokenAddress: string | undefined,
    projectId: string,
): Promise<boolean> {
    const env = getEnv();
    if (!poolTokenAddress || !ethers.isAddress(poolTokenAddress)) return false;
    if (!env.SIGIL_FACTORY_ADDRESS || !env.SIGIL_LP_LOCKER_ADDRESS) return false;

    let launchInfo: unknown;
    try {
        const factory = new ethers.Contract(
            env.SIGIL_FACTORY_ADDRESS,
            FACTORY_V3_LAUNCH_ABI,
            wallet.provider,
        );
        launchInfo = await factory.getLaunchInfo(poolTokenAddress);
    } catch {
        return false;
    }

    const launchPoolId =
        (launchInfo as { poolId?: unknown })?.poolId ??
        (Array.isArray(launchInfo) ? launchInfo[3] : null);

    if (typeof launchPoolId !== "string" || launchPoolId.toLowerCase() !== poolId.toLowerCase()) {
        return false;
    }

    // Support both old single lpTokenId and new lpTokenIds array
    const lpTokenIdsRaw =
        (launchInfo as { lpTokenIds?: unknown })?.lpTokenIds ??
        (launchInfo as { lpTokenId?: unknown })?.lpTokenId ??
        (Array.isArray(launchInfo) ? launchInfo[5] : null);

    // Normalize to array
    let lpTokenIds: bigint[];
    if (Array.isArray(lpTokenIdsRaw)) {
        lpTokenIds = lpTokenIdsRaw
            .map((v: unknown) => (typeof v === "bigint" ? v : BigInt(String(v ?? 0))))
            .filter((id: bigint) => id !== 0n);
    } else {
        const single =
            typeof lpTokenIdsRaw === "bigint" ? lpTokenIdsRaw : BigInt(String(lpTokenIdsRaw ?? 0));
        lpTokenIds = single !== 0n ? [single] : [];
    }

    if (lpTokenIds.length === 0) return false;

    const locker = new ethers.Contract(env.SIGIL_LP_LOCKER_ADDRESS, LOCKER_ABI, wallet);
    let anyUpdated = false;

    for (const lpTokenId of lpTokenIds) {
        try {
            const tx = await locker.updateDev(lpTokenId, walletAddress);
            await tx.wait(1);
            log.info(
                {
                    projectId,
                    poolId: `${poolId.slice(0, 18)}...`,
                    lpTokenId: lpTokenId.toString(),
                    walletAddress,
                    txHash: tx.hash,
                },
                "Updated V3 locker dev routing",
            );
            anyUpdated = true;
        } catch (err) {
            log.warn(
                {
                    projectId,
                    poolId: `${poolId.slice(0, 18)}...`,
                    lpTokenId: lpTokenId.toString(),
                    error: getErrorMessage(err),
                },
                "Failed to update V3 locker dev routing for position",
            );
        }
    }

    return anyUpdated;
}

async function assignEscrowToDev(
    wallet: ethers.Wallet,
    poolId: string,
    walletAddress: string,
    projectId: string,
): Promise<"assigned" | "noop"> {
    const env = getEnv();
    const vaultAddress = env.SIGIL_FEE_VAULT_ADDRESS;
    if (!vaultAddress) return "noop";

    const vault = new ethers.Contract(vaultAddress, SET_DEV_ABI, wallet);

    try {
        const tx = await vault.setDevForPool(poolId, walletAddress);
        await tx.wait(1);
        log.info(
            {
                projectId,
                poolId: `${poolId.slice(0, 18)}...`,
                walletAddress,
                txHash: tx.hash,
            },
            "Escrow assigned to dev (idempotent)",
        );
        return "assigned";
    } catch (err) {
        log.warn(
            { projectId, poolId: `${poolId.slice(0, 18)}...`, error: getErrorMessage(err) },
            "setDevForPool failed",
        );
        return "noop";
    }
}

export interface EnsureDevFeeRoutingInput {
    poolId: string;
    walletAddress: string;
    projectId: string;
    poolTokenAddress?: string | null;
}

export interface EnsureDevFeeRoutingResult {
    lockerRoutingUpdated: boolean;
    escrowAction: "assigned" | "noop";
}

/**
 * Sync V3 Locker dev routing and then recover escrowed fees via the vault.
 * This is the single entry point for all dev fee routing operations.
 */
export async function ensureDevFeeRoutingAndEscrowRelease(
    input: EnsureDevFeeRoutingInput,
): Promise<EnsureDevFeeRoutingResult> {
    if (!isPoolId(input.poolId)) {
        throw new Error(`Invalid poolId for fee routing: ${input.poolId}`);
    }
    if (!ethers.isAddress(input.walletAddress) || input.walletAddress === ethers.ZeroAddress) {
        throw new Error(`Invalid walletAddress for fee routing: ${input.walletAddress}`);
    }

    const wallet = await getAdminWallet();
    if (!wallet) {
        log.warn(
            { projectId: input.projectId },
            "Fee routing skipped: DEPLOYER_PRIVATE_KEY not configured",
        );
        return {
            lockerRoutingUpdated: false,
            escrowAction: "noop",
        };
    }

    const lockerRoutingUpdated = await trySyncV3LockerDev(
        wallet,
        input.poolId,
        input.walletAddress,
        input.poolTokenAddress ?? undefined,
        input.projectId,
    );

    const escrowAction = await assignEscrowToDev(
        wallet,
        input.poolId,
        input.walletAddress,
        input.projectId,
    );

    return {
        lockerRoutingUpdated,
        escrowAction,
    };
}

// ─── Startup Backfill ───────────────────────────────────

/**
 * Startup backfill: assign dev wallets for verified projects with escrowed fees.
 * Run once at server boot — separate from the fee collection loop.
 */
export async function runDevAssignmentBackfill(): Promise<void> {
    try {
        const db = getDb();
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
            if (!project.poolId || !project.ownerWallet) {
                skipped++;
                continue;
            }

            try {
                await new Promise((r) => setTimeout(r, 2000));
                const result = await ensureDevFeeRoutingAndEscrowRelease({
                    poolId: project.poolId,
                    walletAddress: project.ownerWallet,
                    projectId: project.projectId,
                    poolTokenAddress: project.poolTokenAddress,
                });

                if (result.escrowAction === "assigned") {
                    assigned++;
                } else {
                    skipped++;
                }

                log.info(
                    {
                        project: project.name,
                        poolId: project.poolId.slice(0, 18) + "...",
                        dev: project.ownerWallet,
                        lockerRoutingUpdated: result.lockerRoutingUpdated,
                        escrowAction: result.escrowAction,
                    },
                    "Backfill completed for project",
                );
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                log.warn(
                    { project: project.name, err: msg.slice(0, 300) },
                    "Backfill: assignment failed",
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
