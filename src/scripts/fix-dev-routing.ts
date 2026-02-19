import { ethers } from "ethers";

const RPC = "https://base-rpc.publicnode.com";
const LP_LOCKER = "0x2fFffA6519cFFB738c0f017252384A8c5B18219F";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!DEPLOYER_KEY) {
    console.error("❌ Set DEPLOYER_PRIVATE_KEY env var");
    process.exit(1);
}

const LOCKER_ABI = [
    "function positions(uint256 tokenId) view returns (bytes32 poolId, address dev, address token0, address token1, bool locked)",
    "function updateDev(uint256 tokenId, address newDev) external",
];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC);
    const wallet = new ethers.Wallet(DEPLOYER_KEY, provider);
    const locker = new ethers.Contract(LP_LOCKER, LOCKER_ABI, wallet);

    const DEPLOYER_WALLET = wallet.address;
    console.log(`Deployer wallet: ${DEPLOYER_WALLET}`);

    // Pool 3: Conway-Research/automaton (tokenId=4659179)
    // Pool 5: szn.zone (tokenId=4660079)
    const positions = [
        { tokenId: 4659179, project: "Conway-Research/automaton" },
        { tokenId: 4660079, project: "szn.zone" },
    ];

    for (const { tokenId, project } of positions) {
        console.log(`\nPosition ${tokenId} (${project}):`);
        const [, dev] = await locker.positions(tokenId);
        console.log(`  Current dev: ${dev}`);

        if (dev === DEPLOYER_WALLET) {
            console.log(`  Already set to deployer ✅`);
            continue;
        }

        console.log(`  Updating to deployer wallet...`);
        try {
            const tx = await locker.updateDev(tokenId, DEPLOYER_WALLET);
            console.log(`  TX: ${tx.hash}`);
            await tx.wait(1);
            console.log(`  ✅ Done`);
        } catch (err: any) {
            console.log(`  ❌ ${err.shortMessage || err.message}`);
        }
    }

    console.log("\n🏁 Done — future fees for these pools route to deployer wallet");
}

main().catch(console.error);
