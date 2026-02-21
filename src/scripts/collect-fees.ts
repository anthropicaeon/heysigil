/**
 * Check both dev wallets' claimable USDC on the FeeVault
 */
import { ethers } from "ethers";

const FEE_VAULT = process.env.SIGIL_FEE_VAULT_ADDRESS as string;
if (!FEE_VAULT) throw new Error("SIGIL_FEE_VAULT_ADDRESS env var is required");
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const ABI = [
    "function devFees(address dev, address token) view returns (uint256)",
    "function getDevFeeBalances(address dev) view returns (address[] tokens, uint256[] balances)",
    "function poolAssigned(bytes32 poolId) view returns (bool)",
    "function getUnclaimedFeeBalances(bytes32 poolId) view returns (address[] tokens, uint256[] balances, uint256 depositedAt, bool expired, bool assigned)",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const vault = new ethers.Contract(FEE_VAULT, ABI, provider);

    const devWallets = [
        { name: "Testicular dev", address: "0x107E3Bf2361C9a93f842e9d148D5827d6D9C50d7" },
        { name: "HeySigil dev", address: "0xfcF2d394aA19602698174E608c3a66825502ad0e" },
    ];

    for (const w of devWallets) {
        await sleep(1000);
        try {
            const [tokens, balances] = await vault.getDevFeeBalances(w.address);
            console.log(`\n${w.name} (${w.address}):`);
            for (let i = 0; i < tokens.length; i++) {
                const isUsdc = tokens[i].toLowerCase() === USDC.toLowerCase();
                const formatted = isUsdc
                    ? `${Number(balances[i]) / 1e6} USDC`
                    : `${balances[i]} wei (token ${tokens[i]})`;
                console.log(`  ${formatted}`);
            }
            if (tokens.length === 0) {
                console.log("  No fee balances");
            }
        } catch (e: any) {
            console.log(`${w.name}: error - ${e.shortMessage || e.message}`);
        }
    }

    // Also check the orphaned pool
    console.log("\n── Orphaned pool 0x202f... ──");
    await sleep(1000);
    try {
        const poolId = "0x202f5700c67486536dbb8dfe37a831184c6280f1e065b1a301e70f29ccc293ce";
        const assigned = await vault.poolAssigned(poolId);
        console.log(`  assigned: ${assigned}`);

        if (!assigned) {
            await sleep(500);
            const [tokens, balances] = await vault.getUnclaimedFeeBalances(poolId);
            for (let i = 0; i < tokens.length; i++) {
                if (balances[i] > 0n) {
                    const isUsdc = tokens[i].toLowerCase() === USDC.toLowerCase();
                    const formatted = isUsdc
                        ? `${Number(balances[i]) / 1e6} USDC`
                        : `${balances[i]} wei`;
                    console.log(`  unclaimed: ${formatted}`);
                }
            }
        }
    } catch (e: any) {
        console.log(`  error: ${e.shortMessage || e.message}`);
    }
}

main().catch(console.error);
