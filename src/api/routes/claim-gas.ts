/**
 * Gas Sponsorship API for Fee Claims
 *
 * Sends a small amount of ETH from the deployer wallet to the
 * user's Privy embedded wallet so they can call claimDevFees()
 * without needing to own any ETH themselves.
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { ethers } from "ethers";
import { getEnv } from "../../config/env.js";
import { getUserId, privyAuth, getPrivyWalletAddress } from "../../middleware/auth.js";
import { loggers } from "../../utils/logger.js";
import { handler } from "../helpers/route.js";

const log = loggers.deployer;

const claimGas = new OpenAPIHono();

// ─── Singleton deployer wallet ──────────────────────────

let _provider: ethers.JsonRpcProvider | null = null;
let _wallet: ethers.Wallet | null = null;

function getDeployerWallet(): ethers.Wallet {
    if (!_wallet) {
        const env = getEnv();
        if (!env.DEPLOYER_PRIVATE_KEY) {
            throw new Error("DEPLOYER_PRIVATE_KEY not configured");
        }
        if (!env.BASE_RPC_URL) {
            throw new Error("BASE_RPC_URL not configured");
        }
        _provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);
        _wallet = new ethers.Wallet(env.DEPLOYER_PRIVATE_KEY, _provider);
    }
    return _wallet;
}

function getProvider(): ethers.JsonRpcProvider {
    if (!_provider) {
        const env = getEnv();
        _provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);
    }
    return _provider;
}

// ─── Rate limit: in-memory per-user cooldown ────────────

const lastFunded = new Map<string, number>();
const COOLDOWN_MS = 60 * 60 * 1000; // 1 hour between fundings

// Amount of ETH to send — enough for ~2-3 claim txs on Base
// Base gas is very cheap (~0.000001 ETH per tx), so 0.0002 ETH is generous
const GAS_AMOUNT = ethers.parseEther("0.0002");

// ─── POST /api/fees/claim-gas ───────────────────────────

claimGas.post(
    "/claim-gas",
    privyAuth(),
    handler(async (c) => {
        const privyUserId = getUserId(c);
        if (!privyUserId) {
            return c.json({ error: "Not authenticated" }, 401);
        }

        // Rate limit: 1 funding per user per hour
        const lastTime = lastFunded.get(privyUserId);
        if (lastTime && Date.now() - lastTime < COOLDOWN_MS) {
            const minutesLeft = Math.ceil((COOLDOWN_MS - (Date.now() - lastTime)) / 60000);
            return c.json(
                { error: `Gas already funded. Try again in ${minutesLeft} minutes.` },
                429,
            );
        }

        // Get the user's Privy embedded wallet address
        const walletAddress = await getPrivyWalletAddress(privyUserId);
        if (!walletAddress) {
            return c.json({ error: "No wallet found for user" }, 400);
        }

        // Check if the wallet already has enough gas
        const provider = getProvider();
        const balance = await provider.getBalance(walletAddress);
        if (balance >= GAS_AMOUNT) {
            return c.json({
                funded: true,
                alreadyFunded: true,
                walletAddress,
                balanceWei: balance.toString(),
                message: "Wallet already has sufficient gas",
            });
        }

        // Send gas ETH from deployer
        try {
            const wallet = getDeployerWallet();
            const tx = await wallet.sendTransaction({
                to: walletAddress,
                value: GAS_AMOUNT,
            });

            log.info(
                { walletAddress, txHash: tx.hash, amountWei: GAS_AMOUNT.toString() },
                "Gas funded for fee claim",
            );

            // Wait for confirmation
            await tx.wait();

            // Record cooldown
            lastFunded.set(privyUserId, Date.now());

            return c.json({
                funded: true,
                alreadyFunded: false,
                walletAddress,
                txHash: tx.hash,
                amountWei: GAS_AMOUNT.toString(),
                message: "Gas sent successfully",
            });
        } catch (err) {
            log.error({ error: err, walletAddress }, "Failed to fund gas");
            return c.json({ error: "Failed to fund gas for claim. Please try again." }, 500);
        }
    }),
);

export { claimGas };
