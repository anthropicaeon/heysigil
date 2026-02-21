/**
 * Migration API Routes
 *
 * GET /api/migration/status?address=0x... — Get migration status for a wallet
 */

import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { ethers } from "ethers";
import { sql, eq } from "drizzle-orm";

import { getEnv } from "../../config/env.js";
import { getDb, schema } from "../../db/client.js";
import { createLogger } from "../../utils/logger.js";
import {
    getMigrationRelayer,
    isMigrationRelayerConfigured,
} from "../../services/migration-relayer.js";

const log = createLogger("migration-api");

export const migration = new OpenAPIHono();

// ─── ABIs (read-only) ───────────────────────────────────

const MIGRATOR_ABI = [
    "function allocation(address) view returns (uint256)",
    "function claimed(address) view returns (uint256)",
    "function claimable(address) view returns (uint256)",
    "function paused() view returns (bool)",
];

// ─── Status endpoint ───────────────────────────────────

const MigrationStatusSchema = z
    .object({
        address: z.string(),
        allocation: z.string(),
        claimed: z.string(),
        relayed: z.string(),
        remaining: z.string(),
        paused: z.boolean(),
        relayerAddress: z.string(),
        history: z.array(
            z.object({
                txIn: z.string(),
                txOut: z.string().nullable(),
                amount: z.string(),
                status: z.string(),
                reason: z.string().nullable(),
                createdAt: z.string(),
            }),
        ),
    })
    .openapi("MigrationStatus");

const statusRoute = createRoute({
    method: "get",
    path: "/status",
    tags: ["Migration"],
    summary: "Get migration status for a wallet",
    description: "Returns allocation, claimed, relayed amounts, and relay history.",
    request: {
        query: z.object({
            address: z.string().openapi({ example: "0x1234..." }),
        }),
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: MigrationStatusSchema,
                },
            },
            description: "Migration status",
        },
        400: {
            content: {
                "application/json": {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: "Invalid address",
        },
        503: {
            content: {
                "application/json": {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: "Migration relayer not configured",
        },
        500: {
            content: {
                "application/json": {
                    schema: z.object({ error: z.string() }),
                },
            },
            description: "Internal server error",
        },
    },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
migration.openapi(statusRoute, (async (c: any) => {
    const { address } = c.req.valid("query");

    if (!address || !ethers.isAddress(address)) {
        return c.json({ error: "Invalid Ethereum address" }, 400);
    }

    const env = getEnv();

    if (!env.MIGRATOR_ADDRESS || !env.MIGRATION_RELAYER_ADDRESS) {
        return c.json({ error: "Migration not configured" }, 503);
    }

    try {
        // Read on-chain data
        const provider = new ethers.JsonRpcProvider(env.BASE_RPC_URL);
        const migrator = new ethers.Contract(env.MIGRATOR_ADDRESS, MIGRATOR_ABI, provider);

        const [allocation, claimed, paused] = await Promise.all([
            migrator.allocation(address) as Promise<bigint>,
            migrator.claimed(address) as Promise<bigint>,
            migrator.paused() as Promise<boolean>,
        ]);

        // Read relayed amounts from DB
        let relayed = BigInt(0);
        let history: Array<{
            txIn: string;
            txOut: string | null;
            amount: string;
            status: string;
            reason: string | null;
            createdAt: string;
        }> = [];

        try {
            const db = getDb();

            // Sum relayed amounts
            const result = await db
                .select({
                    total: sql<string>`COALESCE(SUM(CAST(${schema.migrationRelays.v2AmountSent} AS NUMERIC)), 0)`,
                })
                .from(schema.migrationRelays)
                .where(
                    sql`${schema.migrationRelays.senderAddress} = ${address.toLowerCase()} AND ${schema.migrationRelays.status} = 'sent'`,
                );

            if (result[0]?.total) {
                relayed = BigInt(result[0].total);
            }

            // Get history
            const rows = await db
                .select()
                .from(schema.migrationRelays)
                .where(eq(schema.migrationRelays.senderAddress, address.toLowerCase()))
                .orderBy(sql`${schema.migrationRelays.createdAt} DESC`)
                .limit(50);

            history = rows.map((r) => ({
                txIn: r.txHashIn,
                txOut: r.txHashOut,
                amount: r.v1Amount,
                status: r.status,
                reason: r.reason,
                createdAt: r.createdAt.toISOString(),
            }));
        } catch (err) {
            log.warn({ err: String(err) }, "Failed to query relay DB");
        }

        const remaining = allocation - claimed - relayed;

        return c.json({
            address: address.toLowerCase(),
            allocation: allocation.toString(),
            claimed: claimed.toString(),
            relayed: relayed.toString(),
            remaining: (remaining > BigInt(0) ? remaining : BigInt(0)).toString(),
            paused,
            relayerAddress: env.MIGRATION_RELAYER_ADDRESS,
            history,
        });
    } catch (err) {
        log.error({ err: String(err) }, "Failed to fetch migration status");
        return c.json({ error: "Failed to fetch migration data" }, 500);
    }
}) as any);

// ─── Relayer status (admin) ─────────────────────────────

const relayerStatusRoute = createRoute({
    method: "get",
    path: "/relayer-status",
    tags: ["Migration"],
    summary: "Get relayer service status",
    description: "Returns whether the relayer is running, counts, etc.",
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: z.object({
                        configured: z.boolean(),
                        running: z.boolean().optional(),
                        relayerAddress: z.string().optional(),
                        relayCount: z.number().optional(),
                        returnCount: z.number().optional(),
                        lastError: z.string().nullable().optional(),
                    }),
                },
            },
            description: "Relayer status",
        },
    },
});

migration.openapi(relayerStatusRoute, (c) => {
    if (!isMigrationRelayerConfigured()) {
        return c.json({ configured: false });
    }

    const relayer = getMigrationRelayer();
    const status = relayer.getStatus();

    return c.json({
        configured: true,
        ...status,
    });
});
