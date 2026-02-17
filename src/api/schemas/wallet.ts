/**
 * Wallet API Schemas
 *
 * Zod schemas for custodial wallet management endpoints.
 */

import { z } from "@hono/zod-openapi";
import {
    SessionIdSchema,
    WalletAddressSchema,
    TokenAddressSchema,
    TimestampSchema,
} from "./common.js";

// ─── Request Schemas ─────────────────────────────────────

/**
 * Path parameter for session ID
 */
export const WalletSessionIdParamSchema = z.object({
    sessionId: SessionIdSchema,
});

// ─── Response Schemas ────────────────────────────────────

/**
 * Token balance entry
 */
export const TokenBalanceSchema = z
    .object({
        symbol: z.string().openapi({
            example: "USDC",
            description: "Token symbol",
        }),
        balance: z.string().openapi({
            example: "100.50",
            description: "Formatted token balance",
        }),
        address: TokenAddressSchema,
    })
    .openapi("TokenBalance");

/**
 * Wallet balance information
 */
export const WalletBalanceSchema = z
    .object({
        eth: z.string().openapi({
            example: "0.5",
            description: "Formatted ETH balance",
        }),
        tokens: z.array(TokenBalanceSchema).openapi({
            description: "ERC-20 token balances",
        }),
    })
    .openapi("WalletBalance");

/**
 * GET /api/wallet/:sessionId response (wallet exists)
 */
export const WalletExistsResponseSchema = z
    .object({
        exists: z.literal(true),
        address: WalletAddressSchema,
        balance: WalletBalanceSchema.nullable().openapi({
            description: "Wallet balance, null if unavailable",
        }),
    })
    .openapi("WalletExistsResponse");

/**
 * GET /api/wallet/:sessionId response (no wallet)
 */
export const WalletNotExistsResponseSchema = z
    .object({
        exists: z.literal(false),
        address: z.null(),
        balance: z.null(),
    })
    .openapi("WalletNotExistsResponse");

/**
 * Combined wallet info response (discriminated union)
 */
export const WalletInfoResponseSchema = z.union([
    WalletExistsResponseSchema,
    WalletNotExistsResponseSchema,
]);

/**
 * POST /api/wallet/:sessionId/create response
 */
export const WalletCreateResponseSchema = z
    .object({
        address: WalletAddressSchema.openapi({
            description: "Created wallet address",
        }),
        createdAt: TimestampSchema.openapi({
            description: "Wallet creation timestamp",
        }),
    })
    .openapi("WalletCreateResponse");
