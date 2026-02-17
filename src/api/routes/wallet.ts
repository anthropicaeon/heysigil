/**
 * Wallet API Routes
 *
 * GET  /api/wallet/:sessionId        — Get wallet info (address + balance)
 * POST /api/wallet/:sessionId/create — Create wallet for session
 */

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getParams } from "../helpers/request.js";
import { createWallet, hasWallet, getAddress, getBalance } from "../../services/wallet.js";
import { walletCreateRateLimit, sessionEnumerationRateLimit } from "../../middleware/rate-limit.js";
import {
    WalletSessionIdParamSchema,
    WalletInfoResponseSchema,
    WalletCreateResponseSchema,
} from "../schemas/wallet.js";
import { handler } from "../helpers/route.js";
import { jsonResponse, rateLimitResponse } from "../openapi.js";

export const wallet = new OpenAPIHono();

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
