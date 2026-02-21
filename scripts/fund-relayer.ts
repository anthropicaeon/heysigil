/**
 * Withdraw V2 tokens from SigilMigrator to the relayer wallet.
 *
 * Usage:
 *   npx tsx scripts/fund-relayer.ts
 *
 * Reads DEPLOYER_PRIVATE_KEY from .env (owner of the migrator).
 * Transfers V2 tokens from migrator → relayer address.
 *
 * ⚠️  Private key only used inside ethers.Wallet — never logged.
 */

import "dotenv/config";
import { ethers } from "ethers";

// ─── Config ─────────────────────────────────────────────

const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const MIGRATOR_ADDRESS = "0xaec9018407aDB3dD8BC9A58f66934F7F80199214";
const RELAYER_ADDRESS = "0x47B1688DddF1f9916d54cb1FE28fd67b243eF36a";
const V2_TOKEN_ADDRESS = "0xDacE999d08eA443E800996208dF40a6D13A9c1Bd";

if (!DEPLOYER_KEY) {
    console.error("❌ DEPLOYER_PRIVATE_KEY not set in .env");
    process.exit(1);
}

// ─── ABIs ───────────────────────────────────────────────

const MIGRATOR_ABI = [
    "function withdrawV2(uint256 amount, address to) external",
    "function owner() view returns (address)",
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
];

// ─── Main ───────────────────────────────────────────────

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_KEY!, provider);
    const migrator = new ethers.Contract(MIGRATOR_ADDRESS, MIGRATOR_ABI, wallet);
    const v2Token = new ethers.Contract(V2_TOKEN_ADDRESS, ERC20_ABI, provider);

    // Verify we're the owner
    const owner = await migrator.owner();
    console.log("Migrator owner:", owner);
    console.log("Our wallet:", wallet.address);

    if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
        console.error("❌ Wallet is not the migrator owner!");
        process.exit(1);
    }

    // Check current balances
    const migratorBalance = await v2Token.balanceOf(MIGRATOR_ADDRESS);
    const relayerBalance = await v2Token.balanceOf(RELAYER_ADDRESS);

    console.log("\n── Current Balances ──");
    console.log("Migrator V2:", ethers.formatEther(migratorBalance));
    console.log("Relayer V2:", ethers.formatEther(relayerBalance));

    // Transfer ALL V2 from migrator to relayer
    const amount = migratorBalance;
    if (amount === 0n) {
        console.log("\n✅ Migrator has no V2 tokens to transfer.");
        return;
    }

    console.log(`\n→ Withdrawing ${ethers.formatEther(amount)} V2 to relayer...`);

    const tx = await migrator.withdrawV2(amount, RELAYER_ADDRESS);
    console.log("Tx hash:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait(1);
    console.log("✅ Confirmed in block:", receipt.blockNumber);

    // Verify
    const newRelayerBalance = await v2Token.balanceOf(RELAYER_ADDRESS);
    console.log("Relayer V2 balance:", ethers.formatEther(newRelayerBalance));
}

main().catch((err) => {
    console.error("❌ Failed:", err.message || err);
    process.exit(1);
});
