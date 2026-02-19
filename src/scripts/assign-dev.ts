/**
 * Backfill: assign dev wallets on SigilFeeVault for all verified projects.
 *
 * Reads verified projects from the DB, finds their poolIds, and calls
 * vault.assignDev(poolId, walletAddress) for any pools with unclaimed fees.
 *
 * Run via Railway: npx -y @railway/cli run -- bun run src/scripts/assign-dev.ts
 */
import { ethers } from "ethers";
import { getDb, schema } from "../db/client.js";
import { getEnv } from "../config/env.js";
import { eq } from "drizzle-orm";

// Load env
const env = getEnv();

const FEE_VAULT_ADDRESS = env.SIGIL_FEE_VAULT_ADDRESS;
const RPC_URL = env.BASE_RPC_URL;
const DEPLOYER_KEY = env.DEPLOYER_PRIVATE_KEY;

if (!DEPLOYER_KEY || !FEE_VAULT_ADDRESS) {
    console.error("❌ Need DEPLOYER_PRIVATE_KEY and SIGIL_FEE_VAULT_ADDRESS");
    process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const FEE_VAULT_ABI = [
    "function assignDev(bytes32 poolId, address dev) external",
    "function reassignDev(bytes32 poolId, address dev) external",
    "function poolAssigned(bytes32 poolId) view returns (bool)",
    "function getUnclaimedFeeBalances(bytes32 poolId) view returns (address[] tokens, uint256[] balances, uint256 depositedAt, bool expired, bool assigned)",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_KEY!, provider);
    const vault = new ethers.Contract(FEE_VAULT_ADDRESS, FEE_VAULT_ABI, wallet);

    const db = getDb();

    console.log(`Wallet: ${wallet.address}`);
    console.log(`Fee Vault: ${FEE_VAULT_ADDRESS}\n`);

    // Get all verified projects with poolId and their associated wallet from verifications
    const projects = await db
        .select({
            projectId: schema.projects.projectId,
            poolId: schema.projects.poolId,
            name: schema.projects.name,
        })
        .from(schema.projects);

    console.log(`Found ${projects.length} projects\n`);

    for (const project of projects) {
        if (!project.poolId) {
            console.log(`  ${project.name}: no poolId, skipping`);
            continue;
        }

        // Find the verification wallet for this project
        const [verification] = await db
            .select({ walletAddress: schema.verifications.walletAddress })
            .from(schema.verifications)
            .where(eq(schema.verifications.projectId, project.projectId.replace("github:", "")))
            .limit(1);

        if (!verification) {
            console.log(`  ${project.name}: no verification found, skipping`);
            continue;
        }

        const devWallet = verification.walletAddress;

        console.log(`── ${project.name} ──`);
        console.log(`   poolId: ${project.poolId.slice(0, 18)}...`);
        console.log(`   dev wallet: ${devWallet}`);

        await sleep(500);

        // Check if already assigned
        let assigned = false;
        try {
            assigned = await vault.poolAssigned(project.poolId);
        } catch (err: any) {
            console.log(`   ⚠️ Could not check: ${err.shortMessage || err.message}`);
            continue;
        }

        await sleep(500);

        // Check if there are unclaimed fees
        try {
            const [tokens, balances] = await vault.getUnclaimedFeeBalances(project.poolId);
            let hasFees = false;
            for (let i = 0; i < tokens.length; i++) {
                if (balances[i] > 0n) {
                    console.log(`   unclaimed ${tokens[i]}: ${balances[i]}`);
                    hasFees = true;
                }
            }

            if (!hasFees) {
                console.log(`   No unclaimed fees\n`);
                continue;
            }
        } catch (err: any) {
            // getUnclaimedFeeBalances may revert if no tokens stored — try assigning anyway
            console.log(`   Could not read unclaimed balances, trying assignDev anyway...`);
        }

        await sleep(500);

        // Call assignDev
        try {
            const nonce = await provider.getTransactionCount(wallet.address, "latest");
            await sleep(500);
            const tx = assigned
                ? await vault.reassignDev(project.poolId, devWallet, { nonce })
                : await vault.assignDev(project.poolId, devWallet, { nonce });
            console.log(`   TX: ${tx.hash}`);
            const receipt = await tx.wait(1);
            console.log(
                `   ✅ Dev ${assigned ? "reassigned" : "assigned"}! Gas: ${receipt.gasUsed}\n`,
            );
        } catch (err: any) {
            const msg = err.shortMessage || err.reason || err.message || String(err);
            console.log(`   ❌ assignDev failed: ${msg.slice(0, 120)}\n`);
        }
    }

    console.log("🎉 Done!");
    process.exit(0);
}

main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
});
