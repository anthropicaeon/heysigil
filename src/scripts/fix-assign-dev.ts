/**
 * Retry: Fix remaining positions and pools.
 *
 * Previous run: updateDev succeeded for positions 1,2,4,5 (failed for 0,3)
 *               assignDev succeeded for pools 4,5 (failed for 0,3)
 *               Pool 2 has $1,680 escrowed but poolAssigned=true
 *               devFees[user][USDC] = 341.953009
 */
import { ethers } from "ethers";

const RPC = "https://base-rpc.publicnode.com";
const LP_LOCKER = "0x2fFffA6519cFFB738c0f017252384A8c5B18219F";
const FEE_VAULT = "0xc7A27840141C7e89cb39d58BED0E75689bb6f933";
const DEPLOYER_KEY = "0x9b5609e3d758b5ce2137db4ed97fddeeeb75d4968d1b20e01b99099ea46bafe9";
const DEV_WALLET = "0xfcf2D394aA196026981746608c3a66825502Ad0E";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const LOCKER_ABI = [
    "function positions(uint256 tokenId) view returns (bytes32 poolId, address dev, address token0, address token1, bool locked)",
    "function updateDev(uint256 tokenId, address newDev) external",
];

const VAULT_ABI = [
    "function assignDev(bytes32 poolId, address dev) external",
    "function poolAssigned(bytes32 poolId) view returns (bool)",
    "function devFees(address dev, address token) view returns (uint256)",
    "function unclaimedFees(bytes32 poolId, address token) view returns (uint256)",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);
    const locker = new ethers.Contract(LP_LOCKER, LOCKER_ABI, wallet);
    const vault = new ethers.Contract(FEE_VAULT, VAULT_ABI, wallet);

    // Current state
    const bal = await vault.devFees(DEV_WALLET, USDC);
    console.log(`devFees before: ${ethers.formatUnits(bal, 6)} USDC\n`);

    // ── 1. Retry updateDev for positions 0 and 3 ──
    const failedPositions = [
        {
            tokenId: 4647301,
            poolId: "0x202f5700c67486536dbb8dfe37a831184c6280f1e065b1a301e70f29ccc293ce",
        },
        {
            tokenId: 4659179,
            poolId: "0x27743c2233979df72fd7e993504fc1855b672b3f0ea864c8ac7c37e586a7b1c6",
        },
    ];

    for (const { tokenId } of failedPositions) {
        // Check current dev
        const [, dev] = await locker.positions(tokenId);
        if (dev !== ethers.ZeroAddress) {
            console.log(`Position ${tokenId}: dev already set to ${dev} ✅`);
            continue;
        }

        console.log(`Retrying locker.updateDev(${tokenId})...`);
        try {
            const tx = await locker.updateDev(tokenId, DEV_WALLET);
            console.log(`  TX: ${tx.hash}`);
            await tx.wait(1);
            console.log(`  ✅ Done`);
        } catch (err: any) {
            console.log(`  ❌ ${err.shortMessage || err.message}`);
        }
        await sleep(3000);
    }

    // ── 2. Retry assignDev for pools 0 and 3 ──
    const failedPools = [
        "0x202f5700c67486536dbb8dfe37a831184c6280f1e065b1a301e70f29ccc293ce",
        "0x27743c2233979df72fd7e993504fc1855b672b3f0ea864c8ac7c37e586a7b1c6",
    ];

    for (const poolId of failedPools) {
        const assigned = await vault.poolAssigned(poolId);
        if (assigned) {
            console.log(`Pool ${poolId.slice(0, 18)}...: already assigned ✅`);
            continue;
        }

        const escrowed = await vault.unclaimedFees(poolId, USDC);
        console.log(
            `Pool ${poolId.slice(0, 18)}...: ${ethers.formatUnits(escrowed, 6)} USDC escrowed`,
        );

        console.log(`Retrying vault.assignDev(${poolId.slice(0, 18)}...)...`);
        try {
            const tx = await vault.assignDev(poolId, DEV_WALLET);
            console.log(`  TX: ${tx.hash}`);
            await tx.wait(1);
            console.log(`  ✅ Done`);
        } catch (err: any) {
            console.log(`  ❌ ${err.shortMessage || err.message}`);
        }
        await sleep(3000);
    }

    // ── 3. Investigate pool 2: poolAssigned=true but $1,680 in unclaimedFees ──
    const pool2 = "0x09f6918681303610d9c56e84d37c770508dd631ca6459a5cc81e6c271626d802";
    const pool2Escrowed = await vault.unclaimedFees(pool2, USDC);
    const pool2Assigned = await vault.poolAssigned(pool2);
    console.log(`\nPool 2 investigation:`);
    console.log(`  poolAssigned: ${pool2Assigned}`);
    console.log(`  unclaimedFees[USDC]: ${ethers.formatUnits(pool2Escrowed, 6)}`);
    console.log(`  NOTE: If assigned=true but unclaimedFees>0, the assignDev may have`);
    console.log(`  been called but the fee transfer failed, or fees accumulated AFTER assignment.`);

    // Final
    await sleep(2000);
    const after = await vault.devFees(DEV_WALLET, USDC);
    console.log(`\n🏁 devFees after: ${ethers.formatUnits(after, 6)} USDC`);
    if (after > bal) {
        console.log(`   💰 Unlocked additional ${ethers.formatUnits(after - bal, 6)} USDC!`);
    }
}

main().catch(console.error);
