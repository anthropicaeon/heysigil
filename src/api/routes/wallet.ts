/**
 * Wallet API Routes
 *
 * GET  /api/wallet/me             — Get wallet for authenticated user
 * POST /api/wallet/me             — Create wallet for authenticated user
 * GET  /api/wallet/:sessionId     — Get wallet info (address + balance)
 * POST /api/wallet/:sessionId/create — Create wallet for session
 */

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";
import { getParams } from "../helpers/request.js";
import {
    createWallet,
    createWalletForUser,
    hasWallet,
    hasUserWallet,
    getAddress,
    getUserAddress,
    getBalance,
    getSignerWallet,
} from "../../services/wallet.js";
import { walletCreateRateLimit, sessionEnumerationRateLimit } from "../../middleware/rate-limit.js";
import {
    WalletSessionIdParamSchema,
    WalletInfoResponseSchema,
    WalletCreateResponseSchema,
} from "../schemas/wallet.js";
import { handler } from "../helpers/route.js";
import { jsonResponse, rateLimitResponse } from "../openapi.js";
import { privyAuth, getUserId } from "../../middleware/auth.js";

export const wallet = new OpenAPIHono();

// ─── Identity-based wallet routes (Privy auth) ─────────

/**
 * GET /api/wallet/me
 * Get wallet for the authenticated Privy user.
 */
wallet.get("/me", privyAuth(), async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Not authenticated" }, 401);

    if (!(await hasUserWallet(userId))) {
        return c.json({ exists: false as const, address: null, balance: null });
    }

    const address = await getUserAddress(userId);
    const balance = await getBalance(`user:${userId}`);

    return c.json({
        exists: true as const,
        address,
        balance: balance
            ? {
                  eth: balance.ethFormatted,
                  tokens: balance.tokens.map((t) => ({
                      symbol: t.symbol,
                      balance: t.formatted,
                      address: t.address,
                  })),
              }
            : null,
    });
});

/**
 * POST /api/wallet/me
 * Create a wallet for the authenticated Privy user (idempotent).
 */
wallet.post("/me", privyAuth(), async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Not authenticated" }, 401);

    const walletInfo = await createWalletForUser(userId);

    return c.json({
        exists: true as const,
        address: walletInfo.address,
        createdAt: walletInfo.createdAt,
    });
});

/**
 * POST /api/wallet/me/withdraw
 * Withdraw ETH or ERC-20 tokens to an external address.
 */
wallet.post("/me/withdraw", privyAuth(), async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Not authenticated" }, 401);

    const body = await c.req.json();
    const parsed = z
        .object({
            to: z.string().regex(/^0x[0-9a-fA-F]{40}$/, "Invalid destination address"),
            amount: z.string().min(1, "Amount is required"),
            token: z.enum(["ETH", "USDC", "WETH", "DAI", "USDT"]).default("ETH"),
        })
        .safeParse(body);

    if (!parsed.success) {
        return c.json({ error: parsed.error.issues[0]?.message || "Invalid request" }, 400);
    }

    const { to, amount, token } = parsed.data;

    const signer = await getSignerWallet(`user:${userId}`);
    if (!signer) {
        return c.json({ error: "Wallet not found" }, 404);
    }

    try {
        const { ethers } = await import("ethers");

        if (token === "ETH") {
            // Native ETH transfer
            const value = ethers.parseEther(amount);
            const tx = await signer.sendTransaction({ to, value });
            const receipt = await tx.wait(1);

            return c.json({
                success: true,
                txHash: tx.hash,
                blockNumber: receipt?.blockNumber,
                token: "ETH",
                amount,
                to,
            });
        }

        // ERC-20 transfer
        const { resolveToken } = await import("../../config/tokens.js");
        const tokenInfo = resolveToken(token);
        if (!tokenInfo) {
            return c.json({ error: `Unsupported token: ${token}` }, 400);
        }

        const erc20 = new ethers.Contract(
            tokenInfo.address,
            ["function transfer(address to, uint256 amount) returns (bool)"],
            signer,
        );

        const value = ethers.parseUnits(amount, tokenInfo.decimals);
        const tx = await erc20.transfer(to, value);
        const receipt = await tx.wait(1);

        return c.json({
            success: true,
            txHash: tx.hash,
            blockNumber: receipt?.blockNumber,
            token,
            amount,
            to,
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("insufficient funds")) {
            return c.json({ error: "Insufficient balance for this transfer" }, 400);
        }
        return c.json({ error: `Transfer failed: ${msg.slice(0, 200)}` }, 500);
    }
});

// ─── Session-based wallet routes ────────────────────────

// Rate limit wallet lookups to prevent session ID enumeration
wallet.use("/:sessionId", sessionEnumerationRateLimit());

// Strict rate limit on wallet creation (5 per hour per IP)
wallet.use("/:sessionId/create", walletCreateRateLimit());

/**
 * GET /api/wallet/:sessionId
 * Returns wallet address and balance for a session.
 */
const getWalletRoute = createRoute({
    method: "get",
    path: "/{sessionId}",
    tags: ["Wallet"],
    summary: "Get wallet info",
    description:
        "Get wallet address and balance for a chat session. Returns exists: false if no wallet created.",
    request: {
        params: WalletSessionIdParamSchema,
    },
    responses: {
        200: jsonResponse(
            WalletInfoResponseSchema,
            "Wallet information (exists: true with address/balance, or exists: false)",
        ),
        429: rateLimitResponse("Rate limit exceeded (10 requests per minute)"),
    },
});

wallet.openapi(
    getWalletRoute,
    handler(async (c) => {
        const { sessionId } = getParams(c, WalletSessionIdParamSchema);

        if (!(await hasWallet(sessionId))) {
            return c.json({ exists: false as const, address: null, balance: null });
        }

        const address = await getAddress(sessionId);
        const balance = await getBalance(sessionId);

        return c.json({
            exists: true as const,
            address,
            balance: balance
                ? {
                      eth: balance.ethFormatted,
                      tokens: balance.tokens.map((t) => ({
                          symbol: t.symbol,
                          balance: t.formatted,
                          address: t.address,
                      })),
                  }
                : null,
        });
    }),
);

/**
 * POST /api/wallet/:sessionId/create
 * Create a wallet for a session (idempotent).
 */
const createWalletRoute = createRoute({
    method: "post",
    path: "/{sessionId}/create",
    tags: ["Wallet"],
    summary: "Create session wallet",
    description:
        "Create a custodial wallet for a chat session. Idempotent - returns existing wallet if already created.",
    request: {
        params: WalletSessionIdParamSchema,
    },
    responses: {
        200: jsonResponse(WalletCreateResponseSchema, "Wallet created or already exists"),
        429: rateLimitResponse("Rate limit exceeded (5 requests per hour)"),
    },
});

wallet.openapi(
    createWalletRoute,
    handler(async (c) => {
        const { sessionId } = getParams(c, WalletSessionIdParamSchema);
        const walletInfo = await createWallet(sessionId);

        return c.json({
            address: walletInfo.address,
            createdAt: walletInfo.createdAt,
        });
    }),
);
