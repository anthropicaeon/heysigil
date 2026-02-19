/**
 * assign-dev.ts
 *
 * Purpose
 * - Backfill fee routing for projects that already launched but still have escrowed fees.
 * - For each project with a poolId, resolve a dev wallet and call one of:
 *   - assignDev(poolId, devWallet) when pool is unassigned
 *   - reassignDev(poolId, devWallet) when pool is already assigned
 *
 * What this script can do
 * - Move unclaimed escrowed fees to a dev wallet claimable balance.
 * - Recover projects where assignment happened previously but wallet routing needs correction.
 * - Print a per-project action log and final summary for incident audits.
 *
 * What this script does not do
 * - It does not claim dev fees to a wallet. Claiming is handled by /api/fees/claim.
 * - It does not create or verify projects.
 * - It does not modify contract config outside assign/reassign calls on the fee vault.
 *
 * Safety model
 * - Uses on-chain checks before action:
 *   - poolAssigned(poolId)
 *   - getUnclaimedFeeBalances(poolId)
 * - Continues safely on individual project errors (best-effort batch behavior).
 * - Prints explicit SKIP/OK/FAIL status lines for operational review.
 *
 * Required env vars
 * - DEPLOYER_PRIVATE_KEY         signer for fee vault assignment txs
 * - SIGIL_FEE_VAULT_ADDRESS      target fee vault contract
 * - BASE_RPC_URL                 Base RPC endpoint
 * - DATABASE_URL                 project/verification lookup (via getDb)
 *
 * Suggested execution
 * - Local:
 *   bun run src/scripts/assign-dev.ts
 * - Railway:
 *   npx -y @railway/cli run -- bun run src/scripts/assign-dev.ts
 * - Help:
 *   bun run src/scripts/assign-dev.ts --help
 *
 * Related files
 * - src/services/fee-routing.ts
 *   Canonical runtime routing+escrow recovery logic used by API flows.
 * - src/services/fee-collector.ts
 *   Startup backfill service that retries assign/reassign automatically.
 * - src/api/routes/claim.ts
 *   Runs non-blocking routing recovery after successful claim flows.
 * - src/api/routes/scan.ts
 *   Runs non-blocking routing recovery after scan/attestation flow.
 * - src/api/routes/claim-gas.ts
 *   Claims already-assigned dev fees from vaults to the user's wallet.
 *
 * Example output (trimmed)
 * [INFO] Wallet: 0xabc...123
 * [INFO] Fee Vault: 0xdef...456
 * [INFO] Found 42 projects
 *
 * [PROJECT] My Agent
 * [DETAIL] projectId: github:org/repo
 * [DETAIL] poolId: 0x1234abcd...
 * [DETAIL] dev wallet: 0x999...888
 * [DETAIL] unclaimed 0x8335...2913: 1600000000
 * [ACTION] calling reassignDev...
 * [TX] 0x5e4f...
 * [OK] dev reassigned, gasUsed=121337
 *
 * [SUMMARY] scanned=42 updated=9 skippedNoPool=3 skippedNoVerification=4 skippedNoFees=22 failed=4
 */
import { ethers } from "ethers";
import { eq } from "drizzle-orm";
import { getEnv } from "../config/env.js";
import { getDb, schema } from "../db/client.js";

const HELP_TEXT = `
assign-dev.ts - escrow assignment backfill helper

Usage:
  bun run src/scripts/assign-dev.ts
  bun run src/scripts/assign-dev.ts --help

Exit codes:
  0 success
  1 fatal error (env/rpc/db failure)

Operator checklist:
1. Confirm DEPLOYER_PRIVATE_KEY and SIGIL_FEE_VAULT_ADDRESS are set.
2. Confirm BASE_RPC_URL points to the intended network.
3. Run the script and save stdout to incident notes.
4. For failures, inspect tx reverts and re-run after fixing env/contract conditions.
5. If assignment succeeds, use /api/fees/claim to pull funds to wallet.
`.trim();

interface ScriptStats {
    scanned: number;
    updated: number;
    skippedNoPool: number;
    skippedNoVerification: number;
    skippedNoFees: number;
    failed: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const FEE_VAULT_ABI = [
    "function assignDev(bytes32 poolId, address dev) external",
    "function reassignDev(bytes32 poolId, address dev) external",
    "function poolAssigned(bytes32 poolId) view returns (bool)",
    "function getUnclaimedFeeBalances(bytes32 poolId) view returns (address[] tokens, uint256[] balances, uint256 depositedAt, bool expired, bool assigned)",
] as const;

function shortError(err: unknown): string {
    if (!err || typeof err !== "object") return String(err);
    const maybe = err as { shortMessage?: string; reason?: string; message?: string };
    return (maybe.shortMessage || maybe.reason || maybe.message || String(err)).slice(0, 180);
}

function logDivider(): void {
    console.log("----------------------------------------------------------------");
}

function printSummary(stats: ScriptStats): void {
    logDivider();
    console.log(
        `[SUMMARY] scanned=${stats.scanned} updated=${stats.updated} ` +
            `skippedNoPool=${stats.skippedNoPool} ` +
            `skippedNoVerification=${stats.skippedNoVerification} ` +
            `skippedNoFees=${stats.skippedNoFees} failed=${stats.failed}`,
    );
    logDivider();
}

async function resolveDevWallet(projectId: string): Promise<string | null> {
    const db = getDb();
    const normalizedProjectId = projectId.replace(/^github:/, "");

    const [normalized] = await db
        .select({ walletAddress: schema.verifications.walletAddress })
        .from(schema.verifications)
        .where(eq(schema.verifications.projectId, normalizedProjectId))
        .limit(1);
    if (normalized?.walletAddress) return normalized.walletAddress;

    const [original] = await db
        .select({ walletAddress: schema.verifications.walletAddress })
        .from(schema.verifications)
        .where(eq(schema.verifications.projectId, projectId))
        .limit(1);
    return original?.walletAddress ?? null;
}

async function main(): Promise<void> {
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
        console.log(HELP_TEXT);
        process.exit(0);
    }

    const env = getEnv();
    const feeVaultAddress = env.SIGIL_FEE_VAULT_ADDRESS;
    const rpcUrl = env.BASE_RPC_URL;
    const deployerKey = env.DEPLOYER_PRIVATE_KEY;

    if (!deployerKey || !feeVaultAddress) {
        console.error(
            "[FATAL] Missing required env: DEPLOYER_PRIVATE_KEY and/or SIGIL_FEE_VAULT_ADDRESS",
        );
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(deployerKey, provider);
    const vault = new ethers.Contract(feeVaultAddress, FEE_VAULT_ABI, wallet);
    const db = getDb();

    const stats: ScriptStats = {
        scanned: 0,
        updated: 0,
        skippedNoPool: 0,
        skippedNoVerification: 0,
        skippedNoFees: 0,
        failed: 0,
    };

    console.log(`[INFO] Wallet: ${wallet.address}`);
    console.log(`[INFO] Fee Vault: ${feeVaultAddress}`);
    console.log(`[INFO] RPC: ${rpcUrl}`);
    logDivider();

    const projects = await db
        .select({
            projectId: schema.projects.projectId,
            poolId: schema.projects.poolId,
            name: schema.projects.name,
        })
        .from(schema.projects);

    console.log(`[INFO] Found ${projects.length} projects`);
    logDivider();

    for (const project of projects) {
        stats.scanned += 1;

        const projectName = project.name || "(unnamed)";
        if (!project.poolId) {
            stats.skippedNoPool += 1;
            console.log(`[SKIP] ${projectName} no poolId`);
            continue;
        }

        console.log(`[PROJECT] ${projectName}`);
        console.log(`[DETAIL] projectId: ${project.projectId}`);
        console.log(`[DETAIL] poolId: ${project.poolId.slice(0, 18)}...`);

        const devWallet = await resolveDevWallet(project.projectId);
        if (!devWallet) {
            stats.skippedNoVerification += 1;
            console.log("[SKIP] no verification wallet found for project");
            logDivider();
            continue;
        }
        console.log(`[DETAIL] dev wallet: ${devWallet}`);

        await sleep(500);

        let alreadyAssigned = false;
        try {
            alreadyAssigned = await vault.poolAssigned(project.poolId);
            console.log(`[DETAIL] poolAssigned: ${alreadyAssigned}`);
        } catch (err) {
            stats.failed += 1;
            console.log(`[FAIL] could not read poolAssigned: ${shortError(err)}`);
            logDivider();
            continue;
        }

        await sleep(500);

        let hasUnclaimedFees = false;
        try {
            const [tokens, balances] = await vault.getUnclaimedFeeBalances(project.poolId);
            for (let i = 0; i < tokens.length; i += 1) {
                if (balances[i] > 0n) {
                    hasUnclaimedFees = true;
                    console.log(`[DETAIL] unclaimed ${tokens[i]}: ${balances[i].toString()}`);
                }
            }
        } catch (err) {
            // Some pools may revert here even when assign/reassign is still useful.
            console.log(
                `[WARN] could not read unclaimed balances (${shortError(err)}), still attempting assignment`,
            );
            hasUnclaimedFees = true;
        }

        if (!hasUnclaimedFees) {
            stats.skippedNoFees += 1;
            console.log("[SKIP] no unclaimed fees");
            logDivider();
            continue;
        }

        await sleep(500);

        try {
            const nonce = await provider.getTransactionCount(wallet.address, "latest");
            const action = alreadyAssigned ? "reassignDev" : "assignDev";
            console.log(`[ACTION] calling ${action}...`);

            const tx = alreadyAssigned
                ? await vault.reassignDev(project.poolId, devWallet, { nonce })
                : await vault.assignDev(project.poolId, devWallet, { nonce });

            console.log(`[TX] ${tx.hash}`);
            const receipt = await tx.wait(1);
            stats.updated += 1;
            console.log(
                `[OK] dev ${alreadyAssigned ? "reassigned" : "assigned"}, gasUsed=${receipt.gasUsed}`,
            );
        } catch (err) {
            stats.failed += 1;
            console.log(`[FAIL] assign/reassign failed: ${shortError(err)}`);
        }

        logDivider();
    }

    printSummary(stats);
    process.exit(0);
}

main().catch((err) => {
    console.error(`[FATAL] ${shortError(err)}`);
    process.exit(1);
});
