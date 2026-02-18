/**
 * Retry: collect fees for HeySigil position #4659103 only.
 */
import { ethers } from "ethers";

const LP_LOCKER_ADDRESS = "0x2fFffA6519cFFB738c0f017252384A8c5B18219F";
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const HEYSIGIL_TOKEN_ID = 4659103n;

if (!DEPLOYER_KEY) {
    console.error("❌ Set DEPLOYER_PRIVATE_KEY");
    process.exit(1);
}

const ABI = ["function collectFees(uint256 tokenId) external"];

async function main() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_KEY!, provider);
    const locker = new ethers.Contract(LP_LOCKER_ADDRESS, ABI, wallet);

    console.log(`Wallet: ${wallet.address}`);
    console.log(`Collecting fees for HeySigil position #${HEYSIGIL_TOKEN_ID}...\n`);

    const tx = await locker.collectFees(HEYSIGIL_TOKEN_ID);
    console.log(`TX: ${tx.hash}`);
    console.log(`https://basescan.org/tx/${tx.hash}\n`);

    const receipt = await tx.wait(1);
    console.log(`✅ Confirmed in block ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed}`);
}

main().catch((err) => {
    console.error(`❌ Failed: ${err.shortMessage || err.reason || err.message}`);
});
