/**
 * DeployerService — Server-side hot wallet that deploys tokens on behalf of users.
 *
 * This is the core of wallet-free launches. Users say "launch a token" in chat,
 * and this service handles the on-chain transaction using the protocol's deployer wallet.
 *
 * The deployer pays gas (~$0.01-0.05 on Base). Tokens are immediately live and tradeable.
 */

import { ethers } from "ethers";
import { getEnv } from "../config/env.js";
import { createPhantomUser, findUserByPlatform } from "./identity.js";
import { checkDeployRateLimit } from "../middleware/rate-limit.js";
import { linkPoolToProject } from "../db/repositories/index.js";
import { loggers } from "../utils/logger.js";

const log = loggers.deployer;

// ─── ABI ────────────────────────────────────────────────
// Minimal ABI for SigilFactoryV3.launch()
const FACTORY_ABI = [
    "function launch(string name, string symbol, string projectId, address dev) external returns (address token, bytes32 poolId)",
    "function getLaunchCount() external view returns (uint256)",
    "function getLaunchInfo(address token) external view returns (tuple(address token, address dev, string projectId, bytes32 poolId, address pool, uint256 lpTokenId, uint256 launchedAt, address launchedBy))",
    "event TokenLaunched(address indexed token, address indexed dev, string projectId, bytes32 poolId, address launchedBy, uint256 supply)",
];

// ─── Types ──────────────────────────────────────────────

export interface DeployParams {
    name: string;
    symbol: string;
    projectId: string;
    devAddress?: string;
    isSelfLaunch?: boolean;
    devLinks?: string[]; // GitHub URLs, etc. Used to create phantom identity
}

export interface DeployOptions {
    /** Privy user ID for authenticated rate limiting (takes priority) */
    privyUserId?: string;
    /** Session ID for anonymous rate limiting (fallback) */
    sessionId?: string;
}

export interface DeployResult {
    tokenAddress: string;
    poolId: string;
    txHash: string;
    blockNumber: number;
    deployer: string;
    explorerUrl: string;
    dexUrl: string;
}

// ─── Service ────────────────────────────────────────────
// Rate limiting is handled by checkDeployRateLimit() from middleware/rate-limit.ts

let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;
let _factory: ethers.Contract | null = null;

function getProvider(): ethers.JsonRpcProvider {
    if (!_provider) {
        const env = getEnv();
        _provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);
    }
    return _provider;
}

function getWallet(): ethers.Wallet {
    if (!_wallet) {
        const env = getEnv();
        if (!env.DEPLOYER_PRIVATE_KEY) {
            throw new Error("DEPLOYER_PRIVATE_KEY not configured — cannot deploy tokens");
        }
        _wallet = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, getProvider());
    }
    return _wallet;
}

function getFactory(): ethers.Contract {
    if (!_factory) {
        const env = getEnv();
        if (!env.SIGIL_FACTORY_ADDRESS) {
            throw new Error("SIGIL_FACTORY_ADDRESS not configured — cannot deploy tokens");
        }
        _factory = new ethers.Contract(env.SIGIL_FACTORY_ADDRESS, FACTORY_ABI, getWallet());
    }
    return _factory;
}

/**
 * Deploy a token on-chain via the SigilFactory.
 *
 * This is the main entry point for wallet-free launches.
 * The deployer wallet pays gas and calls factory.launch().
 *
 * Rate limiting prioritizes authenticated users (privyUserId) over anonymous (sessionId).
 * This prevents a single developer from bypassing limits by creating multiple sessions.
 *
 * @param params - Token deployment parameters
 * @param options - Rate limiting options (privyUserId takes priority over sessionId)
 * @returns Deploy result with token address, pool ID, and tx hash
 */
export async function deployToken(
    params: DeployParams,
    options?: DeployOptions,
): Promise<DeployResult> {
    // Rate limit check — authenticated users get user-based limiting
    // Anonymous users fall back to session-based limiting
    const rateLimitKey = options?.privyUserId || options?.sessionId;
    if (rateLimitKey) {
        const prefix = options?.privyUserId ? "user" : "session";
        await checkDeployRateLimit(`${prefix}:${rateLimitKey}`);
    }

    const wallet = getWallet();
    const factory = getFactory();

    // Determine dev address based on launch type
    let devAddress: string;

    if (params.devAddress) {
        // Explicit dev address provided (self-launch with known wallet)
        devAddress = params.devAddress;
    } else if (params.isSelfLaunch === false && params.devLinks?.length) {
        // Third-party launch: check if dev already exists in our system
        const githubLink = params.devLinks.find((l) => l.includes("github.com"));
        if (githubLink) {
            // Extract org/repo from GitHub URL
            const match = githubLink.match(/github\.com\/([^/]+\/[^/]+)/);
            const repoId = match ? match[1].replace(/\.git$/, "") : githubLink;

            // 1. Check if this dev is already verified → use their existing wallet
            const existingUser = await findUserByPlatform("github", repoId);
            if (existingUser && existingUser.status === "claimed") {
                devAddress = existingUser.walletAddress;
                log.info({ repoId, devAddress }, "Dev already verified (direct routing)");
            } else if (existingUser && existingUser.status === "phantom") {
                // 2. Phantom exists from a previous launch → reuse their wallet
                devAddress = existingUser.walletAddress;
                log.info({ repoId, devAddress }, "Existing phantom user");
            } else {
                // 3. Brand new — create phantom user + wallet
                const result = await createPhantomUser("github", repoId, options?.sessionId);
                devAddress = result.walletAddress;
                log.info({ repoId, devAddress }, "Created phantom user");
            }
        } else {
            // No GitHub link — fall back to address(0) → contract escrow
            devAddress = ethers.ZeroAddress;
        }
    } else {
        // No dev info at all — fees go to contract escrow
        devAddress = ethers.ZeroAddress;
    }

    log.info(
        {
            name: params.name,
            symbol: params.symbol,
            projectId: params.projectId,
            dev: devAddress,
            from: wallet.address,
        },
        "Deploying token",
    );

    // Approve USDC for seed swap (factory pulls up to 1 USDC to activate pool liquidity)
    const env = getEnv();
    const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const usdcContract = new ethers.Contract(
        USDC_ADDRESS,
        [
            "function approve(address,uint256) external returns (bool)",
            "function balanceOf(address) view returns (uint256)",
        ],
        wallet,
    );
    const usdcBalance = await usdcContract.balanceOf(wallet.address);
    if (usdcBalance > 0n) {
        const seedAmount = usdcBalance > 1_000_000n ? 1_000_000n : usdcBalance;
        const approveTx = await usdcContract.approve(env.SIGIL_FACTORY_ADDRESS, seedAmount);
        await approveTx.wait(1);
        log.debug({ seedAmount: seedAmount.toString() }, "Approved USDC for seed swap");
    } else {
        log.debug("No USDC — pool will launch without seed swap (may need manual activation)");
    }

    // Call factory.launch()
    const tx = await factory.launch(params.name, params.symbol, params.projectId, devAddress);

    log.debug({ txHash: tx.hash }, "Transaction submitted");

    // Wait for confirmation
    const receipt = await tx.wait(1);

    // Parse the TokenLaunched event to get token address and poolId
    const iface = new ethers.Interface(FACTORY_ABI);
    let tokenAddress = "";
    let poolId = "";

    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
            if (parsed && parsed.name === "TokenLaunched") {
                tokenAddress = parsed.args[0]; // token address
                poolId = parsed.args[3]; // poolId
                break;
            }
        } catch {
            // Not our event, skip
        }
    }

    // Fallback: try to decode return data if event parsing failed
    if (!tokenAddress) {
        log.warn(
            { txHash: receipt.hash },
            "Could not parse TokenLaunched event — checking return data",
        );
        // The return values are the token address and poolId
        // We can get them from the transaction receipt logs
        tokenAddress = "pending"; // Will be populated by DB query later
    }

    const result: DeployResult = {
        tokenAddress,
        poolId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        deployer: wallet.address,
        explorerUrl: `https://basescan.org/tx/${receipt.hash}`,
        dexUrl:
            tokenAddress !== "pending"
                ? `https://dexscreener.com/base/${tokenAddress}`
                : `https://basescan.org/tx/${receipt.hash}`,
    };

    log.info(
        { tokenAddress, poolId, explorerUrl: result.explorerUrl },
        "Token deployed successfully",
    );

    // Link fee distributions to this project (async, fire-and-forget)
    if (poolId && params.projectId) {
        linkPoolToProject(poolId, params.projectId)
            .then((count) => {
                if (count > 0) {
                    log.debug(
                        { count, projectId: params.projectId },
                        "Linked fee distributions to project",
                    );
                }
            })
            .catch((err) => {
                log.error({ err, projectId: params.projectId }, "Failed to link fee distributions");
            });
    }

    return result;
}

/**
 * Check the deployer wallet balance.
 * Useful for monitoring and alerts.
 */
export async function getDeployerBalance(): Promise<{
    address: string;
    balanceEth: string;
    hasEnoughGas: boolean;
}> {
    const wallet = getWallet();
    const balance = await getProvider().getBalance(wallet.address);
    const balanceEth = ethers.formatEther(balance);

    return {
        address: wallet.address,
        balanceEth,
        hasEnoughGas: balance > ethers.parseEther("0.001"), // ~20 deploys on Base
    };
}

/**
 * Check if the deployer service is properly configured.
 */
export function isDeployerConfigured(): boolean {
    const env = getEnv();
    return !!(env.DEPLOYER_PRIVATE_KEY && env.SIGIL_FACTORY_ADDRESS);
}

/**
 * Auto-generate a token symbol from a project name.
 * "next.js" → "sNEXT", "cool-project" → "sCOOL"
 */
export function generateSymbol(projectName: string): string {
    const cleaned = projectName
        .replace(/[^a-zA-Z0-9]/g, " ")
        .trim()
        .split(/\s+/)[0]
        .toUpperCase()
        .slice(0, 6);
    return `s${cleaned || "TOKEN"}`;
}

/**
 * Auto-generate a token name from a project ID.
 * "vercel/next.js" → "Sigil: next.js"
 */
export function generateName(projectId: string): string {
    const parts = projectId.split("/");
    const name = parts[parts.length - 1] || projectId;
    return `Sigil: ${name}`;
}
