/**
 * claim-all-fees.ts
 *
 * Reads and claims:
 * 1. Protocol fees (across common tokens: WETH, USDC, + any pool tokens)
 * 2. Dev fees for the deployer wallet (if it's assigned as dev)
 *
 * Run:
 *   bun run src/scripts/claim-all-fees.ts
 *   bun run src/scripts/claim-all-fees.ts --dry-run   (read only)
 *
 * Env required:
 *   DEPLOYER_PRIVATE_KEY, SIGIL_FEE_VAULT_ADDRESS, BASE_RPC_URL
 */

import { ethers } from "ethers";
import { getEnv } from "../config/env.js";
import { getDb, schema } from "../db/client.js";
import { isNotNull } from "drizzle-orm";

const FEE_VAULT_ABI = [
    // Views
    "function owner() view returns (address)",
    "function protocolTreasury() view returns (address)",
    "function protocolFees(address token) view returns (uint256)",
    "function devFees(address dev, address token) view returns (uint256)",
    "function getDevFeeBalances(address dev) view returns (address[] tokens, uint256[] balances)",
    "function devFeeTokens(address dev, uint256 idx) view returns (address)",
    // Claims
    "function claimProtocolFees(address token) external",
    "function claimAllDevFees() external",
    "function claimDevFees(address token) external",
];

// Well-known tokens on Base
const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
    "0x4200000000000000000000000000000000000006": { symbol: "WETH", decimals: 18 },
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913": { symbol: "USDC", decimals: 6 },
    "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb": { symbol: "DAI", decimals: 18 },
};

function fmt(amount: bigint, decimals: number): string {
    const n = Number(amount) / 10 ** decimals;
    return n.toFixed(decimals <= 6 ? 2 : 6);
}

function tokenLabel(addr: string): string {
    const lower = addr.toLowerCase();
    for (const [a, t] of Object.entries(KNOWN_TOKENS)) {
        if (a.toLowerCase() === lower) return t.symbol;
    }
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
}

function tokenDecimals(addr: string): number {
    const lower = addr.toLowerCase();
    for (const [a, t] of Object.entries(KNOWN_TOKENS)) {
        if (a.toLowerCase() === lower) return t.decimals;
    }
    return 18; // default for ERC-20 tokens
}

async function main() {
    const dryRun = process.argv.includes("--dry-run");
    if (dryRun) console.log("🔍 DRY RUN — read-only, no claims will be sent\n");

    const env = getEnv();
    if (!env.DEPLOYER_PRIVATE_KEY || !env.SIGIL_FEE_VAULT_ADDRESS) {
        console.error("Missing DEPLOYER_PRIVATE_KEY or SIGIL_FEE_VAULT_ADDRESS");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);
    const deployer = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, provider);
    const vault = new ethers.Contract(env.SIGIL_FEE_VAULT_ADDRESS, FEE_VAULT_ABI, deployer);

    console.log(`💰 FeeVault: ${env.SIGIL_FEE_VAULT_ADDRESS}`);
    console.log(`🔑 Deployer: ${deployer.address}`);

    const owner = await vault.owner();
    const treasury = await vault.protocolTreasury();
    console.log(`👑 Owner: ${owner}`);
    console.log(`🏦 Treasury: ${treasury}`);
    console.log();

    // ─── Discover all token addresses from DB projects ───
    const tokenAddresses = new Set<string>();
    for (const addr of Object.keys(KNOWN_TOKENS)) {
        tokenAddresses.add(addr);
    }

    try {
        const db = getDb();
        const projects = await db
            .select({ poolTokenAddress: schema.projects.poolTokenAddress })
            .from(schema.projects)
            .where(isNotNull(schema.projects.poolTokenAddress));
        for (const p of projects) {
            if (p.poolTokenAddress) tokenAddresses.add(p.poolTokenAddress);
        }
        console.log(`📋 Found ${projects.length} launched tokens in DB\n`);
    } catch {
        console.log("⚠️  DB unavailable — scanning known tokens only\n");
    }

    // ─── 1. Protocol Fees ───────────────────────────────
    console.log("═══════════════════════════════════════════");
    console.log("  PROTOCOL FEES (20% cut)");
    console.log("═══════════════════════════════════════════");

    let protocolClaimCount = 0;
    for (const token of tokenAddresses) {
        const balance: bigint = await vault.protocolFees(token);
        if (balance > 0n) {
            const dec = tokenDecimals(token);
            console.log(`  ${tokenLabel(token)}: ${fmt(balance, dec)} (${balance.toString()} wei)`);
            protocolClaimCount++;

            if (!dryRun) {
                try {
                    const tx = await vault.claimProtocolFees(token);
                    console.log(`    ✅ TX: ${tx.hash}`);
                    await tx.wait();
                    console.log(`    ✅ Confirmed`);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    console.log(`    ❌ Failed: ${msg.slice(0, 200)}`);
                }
            }
        }
    }
    if (protocolClaimCount === 0) {
        console.log("  (no protocol fees to claim)");
    }
    console.log();

    // ─── 2. Dev Fees for deployer wallet ────────────────
    console.log("═══════════════════════════════════════════");
    console.log("  DEV FEES for deployer wallet");
    console.log(`  ${deployer.address}`);
    console.log("═══════════════════════════════════════════");

    try {
        const [devTokens, devBalances] = await vault.getDevFeeBalances(deployer.address);
        let hasDevFees = false;
        for (let i = 0; i < devTokens.length; i++) {
            const bal: bigint = devBalances[i];
            if (bal > 0n) {
                hasDevFees = true;
                const dec = tokenDecimals(devTokens[i]);
                console.log(`  ${tokenLabel(devTokens[i])}: ${fmt(bal, dec)} (${bal.toString()} wei)`);
            }
        }

        if (hasDevFees && !dryRun) {
            try {
                const tx = await vault.claimAllDevFees();
                console.log(`  ✅ TX: ${tx.hash}`);
                await tx.wait();
                console.log(`  ✅ Confirmed`);
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.log(`  ❌ Failed: ${msg.slice(0, 200)}`);
            }
        }

        if (!hasDevFees) {
            console.log("  (no dev fees for deployer)");
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`  ❌ Error reading dev fees: ${msg.slice(0, 200)}`);
    }
    console.log();

    // ─── 3. Scan all dev wallets from projects ──────────
    console.log("═══════════════════════════════════════════");
    console.log("  ALL DEV WALLETS WITH FEES");
    console.log("═══════════════════════════════════════════");

    try {
        const db = getDb();
        const projects = await db
            .select({
                projectId: schema.projects.projectId,
                ownerWallet: schema.projects.ownerWallet,
            })
            .from(schema.projects)
            .where(isNotNull(schema.projects.ownerWallet));

        const devWallets = new Map<string, string[]>();
        for (const p of projects) {
            if (!p.ownerWallet) continue;
            const existing = devWallets.get(p.ownerWallet) || [];
            existing.push(p.projectId);
            devWallets.set(p.ownerWallet, existing);
        }

        for (const [wallet, projectIds] of devWallets) {
            if (wallet.toLowerCase() === deployer.address.toLowerCase()) continue; // Already printed above

            const [devTokens, devBalances] = await vault.getDevFeeBalances(wallet);
            let hasAny = false;
            for (let i = 0; i < devTokens.length; i++) {
                if (devBalances[i] > 0n) {
                    if (!hasAny) {
                        console.log(`\n  📍 ${wallet} (${projectIds.join(", ")})`);
                        hasAny = true;
                    }
                    const dec = tokenDecimals(devTokens[i]);
                    console.log(`     ${tokenLabel(devTokens[i])}: ${fmt(devBalances[i], dec)}`);
                }
            }
        }
    } catch {
        console.log("  ⚠️  DB unavailable — cannot scan dev wallets");
    }

    console.log("\n═══════════════════════════════════════════");
    console.log(dryRun ? "  DRY RUN COMPLETE" : "  ✅ ALL CLAIMS COMPLETE");
    console.log("═══════════════════════════════════════════\n");
}

main().catch((err) => {
    console.error(`[FATAL] ${err}`);
    process.exit(1);
});
