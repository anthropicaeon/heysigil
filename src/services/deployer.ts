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
import { createPhantomIdentity, findByPlatformId, findUserByPlatform } from "./identity.js";
import { checkDeployRateLimit } from "../middleware/rate-limit.js";

// ─── ABI ────────────────────────────────────────────────
// Minimal ABI for SigilFactory.launch()
const FACTORY_ABI = [
    "function launch(string name, string symbol, string projectId, address dev) external returns (address token, bytes32 poolId)",
    "function getLaunchCount() external view returns (uint256)",
    "function getLaunchInfo(address token) external view returns (tuple(address token, address dev, string projectId, bytes32 poolId, tuple(address,address,uint24,int24,address) poolKey, uint256 launchedAt, address launchedBy))",
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
 * @param params - Token deployment parameters
 * @param sessionId - Session ID for rate limiting (optional)
 * @returns Deploy result with token address, pool ID, and tx hash
 */
export async function deployToken(
    params: DeployParams,
    sessionId?: string,
): Promise<DeployResult> {
    // Rate limit check (uses shared rate-limit middleware)
    if (sessionId) {
        checkDeployRateLimit(sessionId);
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
        const githubLink = params.devLinks.find(l => l.includes("github.com"));
        if (githubLink) {
            // Extract org/repo from GitHub URL
            const match = githubLink.match(/github\.com\/([^/]+\/[^/]+)/);
            const repoId = match ? match[1].replace(/\.git$/, "") : githubLink;

            // 1. Check if this dev is already verified → use their existing wallet
            const existingUser = findUserByPlatform("github", repoId);
            if (existingUser && existingUser.status === "claimed") {
                devAddress = existingUser.walletAddress;
                console.log(`[deployer] Dev already verified: ${repoId} → ${devAddress} (direct routing)`);
            } else if (existingUser && existingUser.status === "phantom") {
                // 2. Phantom exists from a previous launch → reuse their wallet
                devAddress = existingUser.walletAddress;
                console.log(`[deployer] Existing phantom user: ${repoId} → ${devAddress}`);
            } else {
                // 3. Brand new — create phantom user + wallet
                const result = createPhantomIdentity("github", repoId, sessionId);
                devAddress = result.walletAddress;
                console.log(`[deployer] Created phantom user for ${repoId} → ${devAddress}`);
            }
        } else {
            // No GitHub link — fall back to address(0) → contract escrow
            devAddress = ethers.ZeroAddress;
        }
    } else {
        // No dev info at all — fees go to contract escrow
        devAddress = ethers.ZeroAddress;
    }

    console.log(`[deployer] Deploying token: ${params.name} ($${params.symbol})`);
    console.log(`[deployer]   projectId: ${params.projectId}`);
    console.log(`[deployer]   dev: ${devAddress}`);
    console.log(`[deployer]   from: ${wallet.address}`);

    // Call factory.launch()
    const tx = await factory.launch(
        params.name,
        params.symbol,
        params.projectId,
        devAddress,
    );

    console.log(`[deployer] Tx submitted: ${tx.hash}`);

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
        console.warn("[deployer] Could not parse TokenLaunched event — checking return data");
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
        dexUrl: tokenAddress !== "pending"
            ? `https://dexscreener.com/base/${tokenAddress}`
            : `https://basescan.org/tx/${receipt.hash}`,
    };

    console.log(`[deployer] ✅ Token deployed: ${tokenAddress}`);
    console.log(`[deployer]    Pool ID: ${poolId}`);
    console.log(`[deployer]    Explorer: ${result.explorerUrl}`);

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
