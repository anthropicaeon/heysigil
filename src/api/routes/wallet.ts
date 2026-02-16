/**
 * Wallet API Routes
 *
 * GET  /api/wallet/:sessionId        — Get wallet info (address + balance)
 * POST /api/wallet/:sessionId/create — Create wallet for session
 */

import { Hono } from "hono";
import {
    createWallet,
    hasWallet,
    getAddress,
    getBalance,
} from "../../services/wallet.js";
import {
    walletCreateRateLimit,
    sessionEnumerationRateLimit,
} from "../../middleware/rate-limit.js";

export const wallet = new Hono();

// Rate limit wallet lookups to prevent session ID enumeration
wallet.use("/:sessionId", sessionEnumerationRateLimit());

// Strict rate limit on wallet creation (5 per hour per IP)
wallet.use("/:sessionId/create", walletCreateRateLimit());

/**
 * GET /api/wallet/:sessionId
 * Returns wallet address and balance for a session.
 */
wallet.get("/:sessionId", async (c) => {
    const sessionId = c.req.param("sessionId");

    if (!hasWallet(sessionId)) {
        return c.json({ exists: false, address: null, balance: null });
    }

    const address = getAddress(sessionId);
    const balance = await getBalance(sessionId);

    return c.json({
        exists: true,
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
 * POST /api/wallet/:sessionId/create
 * Create a wallet for a session (idempotent).
 */
wallet.post("/:sessionId/create", async (c) => {
    const sessionId = c.req.param("sessionId");
    const walletInfo = createWallet(sessionId);

    return c.json({
        address: walletInfo.address,
        createdAt: walletInfo.createdAt,
    });
});
