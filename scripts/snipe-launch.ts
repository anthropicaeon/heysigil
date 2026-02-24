/**
 * SIGIL Multi-Wallet Launch Sniper
 *
 * Derives 20 wallets from SNIPER_PRIVATE_KEY (funder), distributes USDC + ETH,
 * then fires 20 parallel swaps the instant liquidity is detected.
 *
 * Commands:
 *   npx tsx scripts/snipe-launch.ts                        # Snipe (distribute + watch + buy)
 *   npx tsx scripts/snipe-launch.ts --balances             # Show all wallet balances
 *   npx tsx scripts/snipe-launch.ts --sell 50              # Sell $50 worth of SIGIL from one wallet
 *   npx tsx scripts/snipe-launch.ts --sweep                # Consolidate all SIGIL + USDC to funder
 *
 * Env:
 *   SNIPER_PRIVATE_KEY   — funder wallet private key
 *   SNIPE_AMOUNT_USDC    — total USDC to distribute (default: 100)
 *   SNIPE_WALLETS        — number of wallets (default: 20)
 *
 * ⚠️  Private keys only used inside ethers.Wallet — never logged.
 */

import "dotenv/config";
import { ethers } from "ethers";

// ─── Config ─────────────────────────────────────────────

const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const FUNDER_KEY = process.env.SNIPER_PRIVATE_KEY;
const TOTAL_USDC = Number(process.env.SNIPE_AMOUNT_USDC || "100");
const NUM_WALLETS = Number(process.env.SNIPE_WALLETS || "20");
const GAS_PER_WALLET = ethers.parseEther("0.0005"); // ~$0.01 per wallet for gas

// ─── Base Mainnet Addresses ─────────────────────────────

const V2_TOKEN = "0xDacE999d08eA443E800996208dF40a6D13A9c1Bd";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH = "0x4200000000000000000000000000000000000006";
const V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const SWAP_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481";
const POOL_FEE = 10000;        // 1% — SIGIL/USDC
const WETH_USDC_FEE = 500;    // 0.05% — WETH/USDC (deepest Base pool)
const GAS_RESERVE = ethers.parseEther("0.0005"); // Reserve for ~22 swaps

// ─── ABIs ───────────────────────────────────────────────

const FACTORY_ABI = [
    "function getPool(address tokenA, address tokenB, uint24 fee) view returns (address)",
];

const POOL_ABI = [
    "function liquidity() view returns (uint128)",
    "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16, uint16, uint16, uint8, bool)",
    "event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)",
];

const SWAP_ROUTER_ABI = [
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)",
];

const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
];

// ─── Derive Wallets ─────────────────────────────────────

function deriveWallets(
    funderKey: string,
    count: number,
    provider: ethers.JsonRpcProvider,
): ethers.Wallet[] {
    const wallets: ethers.Wallet[] = [];
    for (let i = 0; i < count; i++) {
        const derivedKey = ethers.keccak256(
            ethers.solidityPacked(["bytes32", "uint256"], [funderKey, i]),
        );
        wallets.push(new ethers.Wallet(derivedKey, provider));
    }
    return wallets;
}

// ─── Randomize Amounts ──────────────────────────────────

function randomizeAmounts(totalUsdc: number, count: number): bigint[] {
    const avg = totalUsdc / count;
    const minMult = 0.5;
    const maxMult = 2.0;

    let seed = 42;
    const nextRand = () => {
        seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
        return seed / 0x7fffffff;
    };

    const rawAmounts: number[] = [];
    for (let i = 0; i < count; i++) {
        const mult = minMult + nextRand() * (maxMult - minMult);
        rawAmounts.push(avg * mult);
    }

    const rawSum = rawAmounts.reduce((a, b) => a + b, 0);
    const scale = totalUsdc / rawSum;
    const scaled = rawAmounts.map(a => Math.floor(a * scale * 1e6));

    const totalRaw = scaled.reduce((a, b) => a + b, 0);
    const targetRaw = Math.floor(totalUsdc * 1e6);
    const diff = targetRaw - totalRaw;
    const maxIdx = scaled.indexOf(Math.max(...scaled));
    scaled[maxIdx] += diff;

    return scaled.map(a => BigInt(a));
}

// ═══════════════════════════════════════════════════════════
//  COMMAND: Default — Snipe
// ═══════════════════════════════════════════════════════════

async function snipe() {
    if (!FUNDER_KEY) {
        console.error("❌ SNIPER_PRIVATE_KEY not set");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const funder = new ethers.Wallet(FUNDER_KEY, provider);
    const usdc = new ethers.Contract(USDC, ERC20_ABI, funder);
    const walletAmounts = randomizeAmounts(TOTAL_USDC, NUM_WALLETS);

    const minAmt = (Number(walletAmounts.reduce((a, b) => a < b ? a : b, walletAmounts[0])) / 1e6).toFixed(2);
    const maxAmt = (Number(walletAmounts.reduce((a, b) => a > b ? a : b, walletAmounts[0])) / 1e6).toFixed(2);

    console.log("═══════════════════════════════════════════");
    console.log("  SIGIL Multi-Wallet Launch Sniper");
    console.log("═══════════════════════════════════════════");
    console.log(`Funder:       ${funder.address}`);
    console.log(`Wallets:      ${NUM_WALLETS}`);
    console.log(`Total USDC:   ${TOTAL_USDC}`);
    console.log(`Range:        ${minAmt} – ${maxAmt} USDC`);
    console.log(`ETH/wallet:   ${ethers.formatEther(GAS_PER_WALLET)}`);
    console.log("");

    // Derive wallets
    const wallets = deriveWallets(FUNDER_KEY, NUM_WALLETS, provider);

    // Check if wallets are already funded (from --convert or manual)
    const firstWalletUsdc = await usdc.balanceOf(wallets[0].address);
    const walletsAlreadyFunded = firstWalletUsdc > 0n;

    if (walletsAlreadyFunded) {
        console.log("✅ Wallets already funded with USDC — skipping distribution\n");
    } else {
        // Funder-based distribution
        const funderUsdc = await usdc.balanceOf(funder.address);
        const funderEth = await provider.getBalance(funder.address);
        const totalUsdcNeeded = walletAmounts.reduce((a, b) => a + b, 0n);
        const totalEthNeeded = GAS_PER_WALLET * BigInt(NUM_WALLETS);

        if (funderUsdc < totalUsdcNeeded) {
            console.error(`❌ Not enough USDC. Have ${Number(funderUsdc) / 1e6}, need ${Number(totalUsdcNeeded) / 1e6}`);
            console.error("   Fund wallets with ETH first, then run --convert");
            process.exit(1);
        }
        if (funderEth < totalEthNeeded + ethers.parseEther("0.001")) {
            console.error("❌ Not enough ETH for gas distribution + own gas");
            process.exit(1);
        }

        console.log("─── Distributing funds ───");
        let nonce = await provider.getTransactionCount(funder.address);

        for (let i = 0; i < wallets.length; i++) {
            const bal = await provider.getBalance(wallets[i].address);
            if (bal >= GAS_PER_WALLET) {
                console.log(`  [${i}] Already has ETH, skipping`);
                continue;
            }
            const tx = await funder.sendTransaction({
                to: wallets[i].address,
                value: GAS_PER_WALLET,
                nonce: nonce++,
            });
            await tx.wait(1);
            console.log(`  [${i}] Sent ${ethers.formatEther(GAS_PER_WALLET)} ETH`);
        }

        for (let i = 0; i < wallets.length; i++) {
            const bal = await usdc.balanceOf(wallets[i].address);
            if (bal >= walletAmounts[i]) {
                console.log(`  [${i}] Already has USDC, skipping`);
                continue;
            }
            const tx = await usdc.transfer(wallets[i].address, walletAmounts[i], { nonce: nonce++ });
            await tx.wait(1);
            console.log(`  [${i}] Sent ${(Number(walletAmounts[i]) / 1e6).toFixed(2)} USDC`);
        }
        console.log("✅ All wallets funded\n");
    }

    // ─── Pre-approve USDC ───────────────────────────────

    console.log("─── Pre-approving USDC ───");
    const approvePromises = wallets.map(async (w, i) => {
        const wUsdc = new ethers.Contract(USDC, ERC20_ABI, w);
        const allowance = await wUsdc.allowance(w.address, SWAP_ROUTER);
        if (allowance >= walletAmounts[i]) {
            console.log(`  [${i}] Already approved`);
            return;
        }
        const tx = await wUsdc.approve(SWAP_ROUTER, ethers.MaxUint256);
        await tx.wait(1);
        console.log(`  [${i}] Approved`);
    });
    await Promise.all(approvePromises);
    console.log("✅ All wallets approved\n");

    // ─── Pre-cache USDC balances (before watch loop) ─────
    //     Round to whole USDC to avoid dust issues

    console.log("─── Pre-reading USDC balances ───");
    const swapAmounts: bigint[] = [];
    for (let i = 0; i < wallets.length; i++) {
        const wUsdc = new ethers.Contract(USDC, ERC20_ABI, wallets[i]);
        const rawBal = await wUsdc.balanceOf(wallets[i].address);
        // Floor to whole USDC (remove sub-dollar decimals)
        const wholeUsdc = (rawBal / 1000000n) * 1000000n;
        swapAmounts.push(wholeUsdc);
        console.log(`  [${String(i).padStart(2)}] ${(Number(wholeUsdc) / 1e6).toFixed(0)} USDC`);
    }
    const totalSwap = swapAmounts.reduce((a, b) => a + b, 0n);
    console.log(`  Total: ${(Number(totalSwap) / 1e6).toFixed(0)} USDC\n`);

    // ─── Watch for pool + liquidity ─────────────────────

    const factory = new ethers.Contract(V3_FACTORY, FACTORY_ABI, provider);
    console.log("─── Watching for pool ───");
    let poolAddress = ethers.ZeroAddress;

    while (poolAddress === ethers.ZeroAddress) {
        try {
            poolAddress = await factory.getPool(V2_TOKEN, USDC, POOL_FEE);
        } catch { /* retry */ }

        if (poolAddress === ethers.ZeroAddress) {
            process.stdout.write(".");
            await sleep(500);
        }
    }
    console.log(`\n🎯 Pool detected: ${poolAddress}`);

    console.log("Watching for liquidity (single-sided or in-range)...");
    while (true) {
        const readyType = await checkPoolReady(poolAddress, provider);
        if (readyType) {
            console.log(`\n🎯 Liquidity detected (${readyType})!`);
            break;
        }
        process.stdout.write(".");
        await sleep(500);
    }

    // ─── FIRE ALL SWAPS (zero delay — amounts pre-cached) ─

    console.log("\n═══════════════════════════════════════════");
    console.log(`  🚀 FIRING ${NUM_WALLETS} PARALLEL SWAPS`);
    console.log("═══════════════════════════════════════════\n");

    const feeData = await provider.getFeeData();
    const maxPriorityFee = (feeData.maxPriorityFeePerGas ?? 100000000n) * 3n;
    const maxFee = (feeData.maxFeePerGas ?? 1000000000n) * 2n;

    const swapPromises = wallets.map(async (w, i) => {
        if (swapAmounts[i] === 0n) {
            console.log(`  [${i}] No USDC, skipping`);
            return { wallet: i, success: false, error: "no USDC" };
        }

        const router = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, w);
        try {
            const tx = await router.exactInputSingle(
                {
                    tokenIn: USDC,
                    tokenOut: V2_TOKEN,
                    fee: POOL_FEE,
                    recipient: w.address,
                    amountIn: swapAmounts[i],
                    amountOutMinimum: 0n,
                    sqrtPriceLimitX96: 0n,
                },
                {
                    maxPriorityFeePerGas: maxPriorityFee,
                    maxFeePerGas: maxFee,
                    gasLimit: 300000n,
                },
            );
            console.log(`  [${i}] Tx: ${tx.hash}`);
            const receipt = await tx.wait(1);
            console.log(`  [${i}] ✅ Block ${receipt!.blockNumber}`);
            return { wallet: i, success: true, hash: tx.hash };
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error(`  [${i}] ❌ ${msg.slice(0, 80)}`);
            return { wallet: i, success: false, error: msg };
        }
    });

    const results = await Promise.all(swapPromises);

    // ─── Results ────────────────────────────────────────

    console.log("\n═══════════════════════════════════════════");
    console.log("  RESULTS");
    console.log("═══════════════════════════════════════════");

    const v2 = new ethers.Contract(V2_TOKEN, ERC20_ABI, provider);
    let totalSigil = 0n;

    for (let i = 0; i < wallets.length; i++) {
        const bal = await v2.balanceOf(wallets[i].address);
        totalSigil += bal;
        const status = results[i].success ? "✅" : "❌";
        console.log(`  [${i}] ${status} ${ethers.formatEther(bal)} SIGIL`);
    }

    console.log("");
    console.log(`Total SIGIL:  ${ethers.formatEther(totalSigil)}`);
    console.log(`Succeeded:    ${results.filter(r => r.success).length}/${NUM_WALLETS}`);
    console.log("\nSIGIL stays in each wallet. Use --sell <USDC> to sell, --balances to check.");
}

// ═══════════════════════════════════════════════════════════
//  COMMAND: --balances
// ═══════════════════════════════════════════════════════════

async function showBalances() {
    if (!FUNDER_KEY) { console.error("❌ SNIPER_PRIVATE_KEY not set"); process.exit(1); }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallets = deriveWallets(FUNDER_KEY, NUM_WALLETS, provider);
    const v2 = new ethers.Contract(V2_TOKEN, ERC20_ABI, provider);
    const usdcContract = new ethers.Contract(USDC, ERC20_ABI, provider);

    console.log("═══════════════════════════════════════════");
    console.log("  Wallet Balances");
    console.log("═══════════════════════════════════════════\n");

    let totalSigil = 0n;
    let totalUsdc = 0n;

    for (let i = 0; i < wallets.length; i++) {
        const sigilBal = await v2.balanceOf(wallets[i].address);
        const usdcBal = await usdcContract.balanceOf(wallets[i].address);
        const ethBal = await provider.getBalance(wallets[i].address);
        totalSigil += sigilBal;
        totalUsdc += usdcBal;

        const sigil = Number(ethers.formatEther(sigilBal)).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const usdc = (Number(usdcBal) / 1e6).toFixed(2);
        const eth = Number(ethers.formatEther(ethBal)).toFixed(4);

        console.log(`  [${String(i).padStart(2)}] ${wallets[i].address}  ${sigil.padStart(15)} SIGIL  ${usdc.padStart(8)} USDC  ${eth} ETH`);
    }

    // Also show funder
    const funder = new ethers.Wallet(FUNDER_KEY, provider);
    const funderSigil = await v2.balanceOf(funder.address);
    const funderUsdc = await usdcContract.balanceOf(funder.address);
    const funderEth = await provider.getBalance(funder.address);

    console.log("");
    console.log(`  Funder:  ${funder.address}  ${Number(ethers.formatEther(funderSigil)).toLocaleString(undefined, { maximumFractionDigits: 0 }).padStart(15)} SIGIL  ${(Number(funderUsdc) / 1e6).toFixed(2).padStart(8)} USDC  ${Number(ethers.formatEther(funderEth)).toFixed(4)} ETH`);
    console.log("");
    console.log(`Total SIGIL: ${Number(ethers.formatEther(totalSigil)).toLocaleString()}`);
    console.log(`Total USDC:  ${(Number(totalUsdc) / 1e6).toFixed(2)}`);
}

// ═══════════════════════════════════════════════════════════
//  COMMAND: --sell <USDC amount>
// ═══════════════════════════════════════════════════════════

async function sell(sellAmountUsdc: number) {
    if (!FUNDER_KEY) { console.error("❌ SNIPER_PRIVATE_KEY not set"); process.exit(1); }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallets = deriveWallets(FUNDER_KEY, NUM_WALLETS, provider);
    const v2Read = new ethers.Contract(V2_TOKEN, ERC20_ABI, provider);
    const factory = new ethers.Contract(V3_FACTORY, FACTORY_ABI, provider);

    console.log("═══════════════════════════════════════════");
    console.log(`  Selling ~$${sellAmountUsdc} worth of SIGIL`);
    console.log("═══════════════════════════════════════════\n");

    // Get pool and current price to estimate how much SIGIL = $sellAmountUsdc
    const poolAddress = await factory.getPool(V2_TOKEN, USDC, POOL_FEE);
    if (poolAddress === ethers.ZeroAddress) {
        console.error("❌ Pool not found");
        process.exit(1);
    }

    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    const [sqrtPriceX96] = await pool.slot0();

    // Calculate price: USDC per SIGIL
    // Sort tokens to know which is token0
    const tokenIsToken0 = V2_TOKEN.toLowerCase() < USDC.toLowerCase();
    let priceUsdcPerSigil: number;

    if (tokenIsToken0) {
        // price = (sqrtPriceX96 / 2^96)^2 * 10^(18-6) [SIGIL 18 dec, USDC 6 dec]
        const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2;
        priceUsdcPerSigil = price * 1e12; // adjust for decimal difference
    } else {
        const price = (Number(sqrtPriceX96) / 2 ** 96) ** 2;
        priceUsdcPerSigil = 1 / (price * 1e12);
    }

    // How many SIGIL tokens to sell
    const sigilToSell = ethers.parseEther(String(Math.floor(sellAmountUsdc / priceUsdcPerSigil)));
    console.log(`Price:     ~$${priceUsdcPerSigil.toExponential(4)} per SIGIL`);
    console.log(`Selling:   ~${Number(ethers.formatEther(sigilToSell)).toLocaleString()} SIGIL`);
    console.log("");

    // Find a wallet with enough SIGIL balance
    let chosenIdx = -1;
    let chosenBal = 0n;

    // Shuffle wallet order so we don't always pick the same one
    const indices = Array.from({ length: NUM_WALLETS }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (const i of indices) {
        const bal = await v2Read.balanceOf(wallets[i].address);
        if (bal >= sigilToSell) {
            chosenIdx = i;
            chosenBal = bal;
            break;
        }
    }

    if (chosenIdx === -1) {
        console.error("❌ No single wallet has enough SIGIL for this sell amount");
        console.log("Check --balances and try a smaller amount");
        process.exit(1);
    }

    const w = wallets[chosenIdx];
    console.log(`Using wallet [${chosenIdx}]: ${w.address}`);
    console.log(`Balance: ${Number(ethers.formatEther(chosenBal)).toLocaleString()} SIGIL\n`);

    // Approve SIGIL for SwapRouter
    const v2Token = new ethers.Contract(V2_TOKEN, ERC20_ABI, w);
    const allowance = await v2Token.allowance(w.address, SWAP_ROUTER);
    if (allowance < sigilToSell) {
        console.log("Approving SIGIL for SwapRouter...");
        const approveTx = await v2Token.approve(SWAP_ROUTER, ethers.MaxUint256);
        await approveTx.wait(1);
        console.log("✅ Approved\n");
    }

    // Execute swap: SIGIL → USDC
    const router = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, w);
    try {
        const tx = await router.exactInputSingle({
            tokenIn: V2_TOKEN,
            tokenOut: USDC,
            fee: POOL_FEE,
            recipient: w.address,
            amountIn: sigilToSell,
            amountOutMinimum: 0n, // Accept any output
            sqrtPriceLimitX96: 0n,
        });

        console.log(`Tx: ${tx.hash}`);
        console.log("Waiting for confirmation...");
        const receipt = await tx.wait(1);
        console.log(`✅ Confirmed in block ${receipt!.blockNumber}`);

        // Check balances after
        const newSigilBal = await v2Read.balanceOf(w.address);
        const usdcContract = new ethers.Contract(USDC, ERC20_ABI, provider);
        const newUsdcBal = await usdcContract.balanceOf(w.address);

        console.log("");
        console.log("═══════════════════════════════════════════");
        console.log(`  Wallet [${chosenIdx}] after sell:`);
        console.log(`  SIGIL: ${Number(ethers.formatEther(newSigilBal)).toLocaleString()}`);
        console.log(`  USDC:  ${(Number(newUsdcBal) / 1e6).toFixed(2)}`);
        console.log(`  Tx:    https://basescan.org/tx/${tx.hash}`);
        console.log("═══════════════════════════════════════════");
    } catch (err) {
        console.error("❌ Sell failed:", err instanceof Error ? err.message : String(err));
    }
}

// ═══════════════════════════════════════════════════════════
//  COMMAND: --sweep
// ═══════════════════════════════════════════════════════════

async function sweep() {
    if (!FUNDER_KEY) { console.error("❌ SNIPER_PRIVATE_KEY not set"); process.exit(1); }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const funder = new ethers.Wallet(FUNDER_KEY, provider);
    const wallets = deriveWallets(FUNDER_KEY, NUM_WALLETS, provider);

    console.log("─── Sweeping to funder ───\n");

    for (let i = 0; i < wallets.length; i++) {
        const v2 = new ethers.Contract(V2_TOKEN, ERC20_ABI, wallets[i]);
        const bal = await v2.balanceOf(wallets[i].address);
        if (bal > 0n) {
            const tx = await v2.transfer(funder.address, bal);
            await tx.wait(1);
            console.log(`  [${i}] Swept ${Number(ethers.formatEther(bal)).toLocaleString()} SIGIL`);
        }

        const usdcContract = new ethers.Contract(USDC, ERC20_ABI, wallets[i]);
        const usdcBal = await usdcContract.balanceOf(wallets[i].address);
        if (usdcBal > 0n) {
            const tx = await usdcContract.transfer(funder.address, usdcBal);
            await tx.wait(1);
            console.log(`  [${i}] Swept ${(Number(usdcBal) / 1e6).toFixed(2)} USDC`);
        }
    }

    const v2Final = new ethers.Contract(V2_TOKEN, ERC20_ABI, provider);
    const finalBal = await v2Final.balanceOf(funder.address);
    console.log(`\n✅ Funder SIGIL: ${Number(ethers.formatEther(finalBal)).toLocaleString()}`);
}

// ─── Pool Check ─────────────────────────────────────────

async function checkPoolReady(
    poolAddress: string,
    provider: ethers.JsonRpcProvider,
): Promise<string | null> {
    const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
    try {
        const liquidity = await pool.liquidity();
        if (liquidity > 0n) return "in-range";

        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 50);
        const mintFilter = pool.filters.Mint();
        const mintEvents = await pool.queryFilter(mintFilter, fromBlock, currentBlock);
        if (mintEvents.length > 0) return "single-sided";

        return null;
    } catch {
        return null;
    }
}

// ═════════════════════════════════════════════════════════════
//  COMMAND: --convert (ETH → USDC on each wallet)
// ═════════════════════════════════════════════════════════════

async function convert() {
    if (!FUNDER_KEY) { console.error("❌ SNIPER_PRIVATE_KEY not set"); process.exit(1); }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallets = deriveWallets(FUNDER_KEY, NUM_WALLETS, provider);

    console.log("═══════════════════════════════════════════");
    console.log("  Convert ETH → USDC on all wallets");
    console.log(`  Gas reserve: ${ethers.formatEther(GAS_RESERVE)} ETH (~22 swaps)`);
    console.log("═══════════════════════════════════════════\n");

    // SwapRouter02 accepts native ETH when you set value and tokenIn = WETH
    for (let i = 0; i < wallets.length; i++) {
        const w = wallets[i];
        const ethBal = await provider.getBalance(w.address);

        if (ethBal <= GAS_RESERVE) {
            console.log(`  [${String(i).padStart(2)}] ${w.address}  ${ethers.formatEther(ethBal)} ETH — not enough, skipping`);
            continue;
        }

        // Swap everything above gas reserve
        const swapAmount = ethBal - GAS_RESERVE;

        const router = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, w);

        try {
            const tx = await router.exactInputSingle(
                {
                    tokenIn: WETH,
                    tokenOut: USDC,
                    fee: WETH_USDC_FEE,
                    recipient: w.address,
                    amountIn: swapAmount,
                    amountOutMinimum: 0n,
                    sqrtPriceLimitX96: 0n,
                },
                {
                    value: swapAmount, // Send native ETH (router wraps to WETH)
                    gasLimit: 200000n,
                },
            );

            const receipt = await tx.wait(1);

            const usdcContract = new ethers.Contract(USDC, ERC20_ABI, provider);
            const usdcBal = await usdcContract.balanceOf(w.address);

            console.log(`  [${String(i).padStart(2)}] ✅ ${ethers.formatEther(swapAmount)} ETH → ${(Number(usdcBal) / 1e6).toFixed(2)} USDC  (block ${receipt!.blockNumber})`);
        } catch (err) {
            console.error(`  [${String(i).padStart(2)}] ❌ ${err instanceof Error ? err.message.slice(0, 60) : String(err)}`);
        }
    }

    console.log("\n✅ Done. Run --balances to verify.");
}

// ─── Helpers ────────────────────────────────────────

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Entry ──────────────────────────────────────────

const args = process.argv.slice(2);

if (args.includes("--balances")) {
    showBalances().catch(console.error);
} else if (args.includes("--convert")) {
    convert().catch(console.error);
} else if (args.includes("--sweep")) {
    sweep().catch(console.error);
} else if (args.includes("--sell")) {
    const sellIdx = args.indexOf("--sell");
    const amount = Number(args[sellIdx + 1]);
    if (!amount || amount <= 0) {
        console.error("Usage: --sell <USDC amount>  (e.g. --sell 50)");
        process.exit(1);
    }
    sell(amount).catch(console.error);
} else {
    snipe().catch((err) => {
        console.error("Fatal:", err);
        process.exit(1);
    });
}
