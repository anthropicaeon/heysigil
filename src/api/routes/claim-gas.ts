/**
 * Fee Claim API
 *
 * POST /api/fees/claim-gas — Sends gas ETH to the user's server-side wallet
 * POST /api/fees/claim     — Executes claimDevFees() server-side with the user's wallet
 */

import { OpenAPIHono } from "@hono/zod-openapi";
import { ethers } from "ethers";
import { getEnv } from "../../config/env.js";
import { getUserId, privyAuth } from "../../middleware/auth.js";
import { getUserAddress, getSignerWallet } from "../../services/wallet.js";
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
const GAS_AMOUNT = ethers.parseEther("0.0002");

// ─── Fee vault ABI (minimal — just claim functions) ─────

const CLAIM_ABI = ["function claimDevFees(address token)", "function claimAllDevFees()"];

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

        // Get the user's SERVER-SIDE wallet address (not Privy embedded)
        const walletAddress = await getUserAddress(privyUserId);
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

// ─── POST /api/fees/claim ───────────────────────────────

claimGas.post(
    "/claim",
    privyAuth(),
    handler(async (c) => {
        const privyUserId = getUserId(c);
        if (!privyUserId) {
            return c.json({ error: "Not authenticated" }, 401);
        }

        const env = getEnv();
        const feeVaultAddress = env.SIGIL_FEE_VAULT_ADDRESS;
        const feeVaultAddressV1 = env.SIGIL_FEE_VAULT_ADDRESS_V1;
        if (!feeVaultAddress && !feeVaultAddressV1) {
            return c.json({ error: "Fee vault not configured" }, 503);
        }

        // Get the user's server-side wallet signer
        const walletKey = `user:${privyUserId}`;
        const signer = await getSignerWallet(walletKey);
        if (!signer) {
            return c.json({ error: "No wallet found — visit the chat to create one" }, 400);
        }

        try {
            // Auto-fund gas if needed
            const provider = getProvider();
            const balance = await provider.getBalance(signer.address);
            if (balance < GAS_AMOUNT) {
                log.info(
                    { wallet: signer.address, balance: balance.toString() },
                    "Auto-funding gas for claim",
                );
                const deployer = getDeployerWallet();
                const gasTx = await deployer.sendTransaction({
                    to: signer.address,
                    value: GAS_AMOUNT,
                });
                await gasTx.wait();
                log.info({ wallet: signer.address, txHash: gasTx.hash }, "Gas funded for claim");
            }

            // Parse optional token address from body
            let body: { token?: string } = {};
            try {
                body = await c.req.json();
            } catch {
                // No body is fine — defaults to claimAll
            }

            // Try claiming from both V2 and V1 vaults
            const vaults = [feeVaultAddress, feeVaultAddressV1].filter(Boolean) as string[];
            const txHashes: string[] = [];

            for (const vaultAddr of vaults) {
                const feeVault = new ethers.Contract(vaultAddr, CLAIM_ABI, signer);
                try {
                    let tx: ethers.TransactionResponse;
                    if (body.token) {
                        tx = await feeVault.claimDevFees(body.token);
                    } else {
                        tx = await feeVault.claimAllDevFees();
                    }
                    log.info(
                        { wallet: signer.address, vault: vaultAddr, txHash: tx.hash },
                        "Claiming dev fees",
                    );
                    await tx.wait();
                    txHashes.push(tx.hash);
                } catch (err) {
                    // NothingToClaim is expected for vaults with no fees — skip silently
                    const msg = err instanceof Error ? err.message : String(err);
                    if (!msg.includes("NothingToClaim") && !msg.includes("revert")) {
                        log.warn({ vault: vaultAddr, error: msg }, "Claim attempt failed");
                    }
                }
            }

            if (txHashes.length === 0) {
                return c.json({ error: "No claimable fees found in any vault" }, 400);
            }

            return c.json({
                success: true,
                txHash: txHashes[0],
                txHashes,
                walletAddress: signer.address,
                message: "Fees claimed successfully",
            });
        } catch (err) {
            log.error({ error: err, wallet: signer.address }, "Fee claim failed");
            const message = err instanceof Error ? err.message : "Claim transaction failed";
            return c.json({ error: message }, 500);
        }
    }),
);

export { claimGas };
