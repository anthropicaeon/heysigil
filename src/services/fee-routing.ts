import { ethers } from "ethers";
import { getEnv } from "../config/env.js";
import { loggers } from "../utils/logger.js";

const log = loggers.server;

const ASSIGN_ABI = [
    "function assignDev(bytes32 poolId, address dev) external",
    "function reassignDev(bytes32 poolId, address dev) external",
];

const FACTORY_HOOK_ABI = ["function hook() view returns (address)"];

const HOOK_ABI = [
    "function updatePoolDev(bytes32 poolId, address newDev) external",
    "function getPoolInfo(bytes32 poolId) view returns (bool registered, address dev, bool tokenIsToken0)",
];

const FACTORY_V3_LAUNCH_ABI = [
    "function getLaunchInfo(address token) view returns (tuple(address token, address dev, string projectId, bytes32 poolId, address pool, uint256 lpTokenId, uint256 launchedAt, address launchedBy))",
];

const LOCKER_ABI = ["function updateDev(uint256 tokenId, address newDev) external"];
const REASSIGN_DEV_SELECTOR = ethers.id("reassignDev(bytes32,address)").slice(2, 10).toLowerCase();
const vaultReassignSupportCache = new Map<string, boolean>();

function getErrorMessage(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
}

function isPoolId(value: string): boolean {
    return /^0x[0-9a-fA-F]{64}$/.test(value);
}

function hasPoolAlreadyAssignedError(msg: string): boolean {
    return msg.includes("PoolAlreadyAssigned");
}

function hasNoUnclaimedFeesError(msg: string): boolean {
    return msg.includes("NoUnclaimedFees");
}

function isHookRegisteredResult(
    value: unknown,
): value is { registered?: boolean } | [boolean, string, boolean] {
    return Array.isArray(value) || (!!value && typeof value === "object");
}

async function supportsReassignDev(provider: ethers.Provider, vaultAddress: string): Promise<boolean> {
    const key = vaultAddress.toLowerCase();
    const cached = vaultReassignSupportCache.get(key);
    if (cached !== undefined) return cached;

    const code = await provider.getCode(vaultAddress);
    const supported = !!code && code !== "0x" && code.toLowerCase().includes(REASSIGN_DEV_SELECTOR);
    vaultReassignSupportCache.set(key, supported);
    return supported;
}

async function getAdminWallet(): Promise<ethers.Wallet | null> {
    const env = getEnv();
    if (!env.DEPLOYER_PRIVATE_KEY) return null;
    const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL || "https://mainnet.base.org");
    return new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, provider);
}

async function tryResolveHookAddress(provider: ethers.Provider): Promise<string | null> {
    const env = getEnv();
    if (!env.SIGIL_FACTORY_ADDRESS) return null;

    try {
        const factory = new ethers.Contract(env.SIGIL_FACTORY_ADDRESS, FACTORY_HOOK_ABI, provider);
        const hookAddress = await factory.hook();
        return typeof hookAddress === "string" && ethers.isAddress(hookAddress)
            ? hookAddress
            : null;
    } catch {
        return null;
    }
}

async function trySyncV4HookDev(
    wallet: ethers.Wallet,
    poolId: string,
    walletAddress: string,
    projectId: string,
): Promise<{ updated: boolean; blockedByPoolAssigned: boolean }> {
    const provider = wallet.provider;
    if (!provider) {
        return { updated: false, blockedByPoolAssigned: false };
    }

    const hookAddress = await tryResolveHookAddress(provider);
    if (!hookAddress || hookAddress === ethers.ZeroAddress) {
        return { updated: false, blockedByPoolAssigned: false };
    }

    const hook = new ethers.Contract(hookAddress, HOOK_ABI, wallet);

    try {
        const poolInfo = await hook.getPoolInfo(poolId).catch(() => null);
        if (isHookRegisteredResult(poolInfo)) {
            const registered = Array.isArray(poolInfo)
                ? poolInfo[0]
                : (poolInfo.registered ?? false);
            if (!registered) {
                return { updated: false, blockedByPoolAssigned: false };
            }
        }
    } catch {
        // Best-effort precheck only.
    }

    try {
        const tx = await hook.updatePoolDev(poolId, walletAddress);
        await tx.wait(1);
        log.info(
            {
                projectId,
                poolId: `${poolId.slice(0, 18)}...`,
                hookAddress,
                walletAddress,
                txHash: tx.hash,
            },
            "Updated V4 hook dev routing",
        );
        return { updated: true, blockedByPoolAssigned: false };
    } catch (err) {
        const msg = getErrorMessage(err);
        if (hasPoolAlreadyAssignedError(msg)) {
            // SigilHook.updatePoolDev internally calls assignDev when oldDev == address(0).
            // If pool was already assigned, this blocks hook-side routing update.
            return { updated: false, blockedByPoolAssigned: true };
        }
        log.warn(
            { projectId, poolId: `${poolId.slice(0, 18)}...`, hookAddress, error: msg },
            "Failed to update V4 hook dev routing",
        );
        return { updated: false, blockedByPoolAssigned: false };
    }
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
    const lpTokenIdRaw =
        (launchInfo as { lpTokenId?: unknown })?.lpTokenId ??
        (Array.isArray(launchInfo) ? launchInfo[5] : null);

    if (typeof launchPoolId !== "string" || launchPoolId.toLowerCase() !== poolId.toLowerCase()) {
        return false;
    }

    const lpTokenId = typeof lpTokenIdRaw === "bigint" ? lpTokenIdRaw : BigInt(lpTokenIdRaw || 0);
    if (lpTokenId === 0n) return false;

    try {
        const locker = new ethers.Contract(env.SIGIL_LP_LOCKER_ADDRESS, LOCKER_ABI, wallet);
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
        return true;
    } catch (err) {
        log.warn(
            {
                projectId,
                poolId: `${poolId.slice(0, 18)}...`,
                lpTokenId: lpTokenId.toString(),
                error: getErrorMessage(err),
            },
            "Failed to update V3 locker dev routing",
        );
        return false;
    }
}

async function assignOrReassignEscrow(
    wallet: ethers.Wallet,
    poolId: string,
    walletAddress: string,
    projectId: string,
): Promise<"assigned" | "reassigned" | "noop"> {
    const env = getEnv();
    const vaultAddresses = [env.SIGIL_FEE_VAULT_ADDRESS, env.SIGIL_FEE_VAULT_ADDRESS_V1].filter(
        Boolean,
    ) as string[];

    if (vaultAddresses.length === 0) return "noop";
    const provider = wallet.provider;
    if (!provider) return "noop";

    let lastUnexpected: unknown = null;
    for (const vaultAddress of vaultAddresses) {
        const vault = new ethers.Contract(vaultAddress, ASSIGN_ABI, wallet);

        try {
            const tx = await vault.assignDev(poolId, walletAddress);
            await tx.wait(1);
            log.info(
                {
                    projectId,
                    poolId: `${poolId.slice(0, 18)}...`,
                    vaultAddress,
                    walletAddress,
                    txHash: tx.hash,
                },
                "Escrow assigned to dev",
            );
            return "assigned";
        } catch (assignErr) {
            const assignMsg = getErrorMessage(assignErr);
            if (!hasPoolAlreadyAssignedError(assignMsg) && !hasNoUnclaimedFeesError(assignMsg)) {
                lastUnexpected = assignErr;
                continue;
            }

            if (hasPoolAlreadyAssignedError(assignMsg)) {
                const canReassign = await supportsReassignDev(provider, vaultAddress);
                if (!canReassign) {
                    log.warn(
                        {
                            projectId,
                            poolId: `${poolId.slice(0, 18)}...`,
                            vaultAddress,
                        },
                        "Legacy vault detected: reassignDev not supported; post-assignment escrow cannot be recovered on this vault",
                    );
                    continue;
                }

                try {
                    const tx = await vault.reassignDev(poolId, walletAddress);
                    await tx.wait(1);
                    log.info(
                        {
                            projectId,
                            poolId: `${poolId.slice(0, 18)}...`,
                            vaultAddress,
                            walletAddress,
                            txHash: tx.hash,
                        },
                        "Escrow re-assigned to dev after prior assignment",
                    );
                    return "reassigned";
                } catch (reassignErr) {
                    const reassignMsg = getErrorMessage(reassignErr);
                    if (!hasNoUnclaimedFeesError(reassignMsg)) {
                        lastUnexpected = reassignErr;
                    }
                }
            }
        }
    }

    if (lastUnexpected) {
        throw lastUnexpected;
    }
    return "noop";
}

export interface EnsureDevFeeRoutingInput {
    poolId: string;
    walletAddress: string;
    projectId: string;
    poolTokenAddress?: string | null;
}

export interface EnsureDevFeeRoutingResult {
    hookRoutingUpdated: boolean;
    hookRoutingBlockedByPoolAssigned: boolean;
    lockerRoutingUpdated: boolean;
    escrowAction: "assigned" | "reassigned" | "noop";
}

/**
 * Sync upstream routing sources (V4 Hook / V3 Locker) and then recover escrowed fees.
 * This closes the loop where escrow could continue reappearing after an initial assignment.
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
            hookRoutingUpdated: false,
            hookRoutingBlockedByPoolAssigned: false,
            lockerRoutingUpdated: false,
            escrowAction: "noop",
        };
    }

    const hookSync = await trySyncV4HookDev(
        wallet,
        input.poolId,
        input.walletAddress,
        input.projectId,
    );

    const lockerRoutingUpdated = await trySyncV3LockerDev(
        wallet,
        input.poolId,
        input.walletAddress,
        input.poolTokenAddress ?? undefined,
        input.projectId,
    );

    const escrowAction = await assignOrReassignEscrow(
        wallet,
        input.poolId,
        input.walletAddress,
        input.projectId,
    );

    return {
        hookRoutingUpdated: hookSync.updated,
        hookRoutingBlockedByPoolAssigned: hookSync.blockedByPoolAssigned,
        lockerRoutingUpdated,
        escrowAction,
    };
}
