/**
 * Connect API Routes
 *
 * POST /api/connect/handshake — Proxy handshake to a deployed SigilBot, persist connection
 * GET  /api/connect/bots      — List connected bots for the authenticated user
 * DELETE /api/connect/bots/:id — Disconnect (soft-delete) a connected bot
 */

import { randomUUID } from "node:crypto";
import { OpenAPIHono } from "@hono/zod-openapi";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../../db/client.js";
import { privyAuth, getUserId } from "../../middleware/auth.js";
import { loggers } from "../../utils/logger.js";
import { listConnectedBotsPresence } from "../../services/connected-bots.js";

const log = loggers.server;

export const connect = new OpenAPIHono();

// All connect routes require Privy auth
connect.use("*", privyAuth());

// ─── Schemas ────────────────────────────────────────────

const HandshakeRequestSchema = z.object({
    endpoint: z.string().url(),
    stack: z.enum(["sigilbot", "openclaw"]).default("sigilbot"),
    secret: z.string().optional(),
});

const PresenceQuerySchema = z.object({
    windowMinutes: z.coerce.number().int().min(1).max(120).default(30),
});

// ─── POST /handshake ────────────────────────────────────

connect.post("/handshake", async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Authentication required" }, 401);

    const body = await c.req.json();
    const parsed = HandshakeRequestSchema.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
    }

    const { endpoint, stack, secret } = parsed.data;

    // Build handshake payload for the bot
    const nonce = randomUUID();
    const timestamp = new Date().toISOString();
    const handshakePayload = {
        nonce,
        timestamp,
        userId,
        pluginId: stack,
    };

    // Proxy the handshake to the deployed bot endpoint
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (secret) {
        headers["x-sigil-connect-secret"] = secret;
    }

    let botResponse: Response;
    try {
        botResponse = await fetch(`${endpoint.replace(/\/$/, "")}/v1/handshake`, {
            method: "POST",
            headers,
            body: JSON.stringify(handshakePayload),
            signal: AbortSignal.timeout(10_000),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        log.warn({ endpoint, error: message }, "connect handshake: bot unreachable");
        return c.json({ error: "Bot endpoint unreachable", detail: message }, 502);
    }

    if (!botResponse.ok) {
        let detail = "Unknown error";
        try {
            const errBody = (await botResponse.json()) as { error?: string };
            detail = errBody.error || detail;
        } catch {
            /* ignore parse errors */
        }

        log.warn(
            { endpoint, status: botResponse.status, detail },
            "connect handshake: bot rejected",
        );
        return c.json({ error: "Bot rejected handshake", detail, status: botResponse.status }, 502);
    }

    // Parse bot's handshake response
    const result = (await botResponse.json()) as {
        ok: boolean;
        connectionId?: string;
        bot?: { id: string; stack: string };
        scopes?: string[];
    };

    // Persist the connection
    const db = getDb();
    const [record] = await db
        .insert(schema.connectedBots)
        .values({
            userId,
            stack,
            endpoint,
            connectionId: result.connectionId || null,
            botId: result.bot?.id || null,
            status: "connected",
            scopes: result.scopes || [],
            lastSeenAt: new Date(),
        })
        .returning();

    log.info(
        { connectionId: result.connectionId, botId: result.bot?.id, userId },
        "connect handshake: success",
    );

    return c.json({
        ok: true,
        bot: record,
        handshake: result,
    });
});

// ─── GET /bots ──────────────────────────────────────────

connect.get("/bots", async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Authentication required" }, 401);

    const db = getDb();
    const bots = await db
        .select()
        .from(schema.connectedBots)
        .where(
            and(
                eq(schema.connectedBots.userId, userId),
                eq(schema.connectedBots.status, "connected"),
            ),
        );

    return c.json({ bots });
});

// ─── GET /bots/presence ─────────────────────────────────

connect.get("/bots/presence", async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Authentication required" }, 401);

    const parsed = PresenceQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
        return c.json({ error: "Invalid query", details: parsed.error.flatten() }, 400);
    }

    const { windowMinutes } = parsed.data;
    const bots = await listConnectedBotsPresence(userId, windowMinutes);

    const online = bots.filter((bot) => bot.presence === "online").length;
    const offline = bots.length - online;

    return c.json({
        windowMinutes,
        summary: {
            total: bots.length,
            online,
            offline,
        },
        bots,
    });
});

// ─── DELETE /bots/:id ───────────────────────────────────

connect.delete("/bots/:id", async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Authentication required" }, 401);

    const botId = c.req.param("id");
    if (!botId) return c.json({ error: "Bot ID required" }, 400);

    const db = getDb();
    const [updated] = await db
        .update(schema.connectedBots)
        .set({
            status: "disconnected",
            disconnectedAt: new Date(),
        })
        .where(and(eq(schema.connectedBots.id, botId), eq(schema.connectedBots.userId, userId)))
        .returning();

    if (!updated) {
        return c.json({ error: "Bot not found" }, 404);
    }

    log.info({ botId, userId }, "connect: bot disconnected");
    return c.json({ ok: true, bot: updated });
});
