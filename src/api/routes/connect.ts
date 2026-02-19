/**
 * Connect API Routes
 *
 * POST /api/connect/intent             — Issue one-time handshake intent token
 * POST /api/connect/handshake          — Proxy handshake to deployed bot (intent required)
 * POST /api/connect/quick-launch       — One-click provision + connect SigilBot via Railway
 * GET  /api/connect/quick-launch/:id   — Quick-launch provisioning status
 * GET  /api/connect/bots               — List connected bots for authenticated user
 * GET  /api/connect/bots/presence      — Presence-aware connected bot list
 * DELETE /api/connect/bots/:id         — Disconnect (soft-delete) a connected bot
 */

import { randomUUID } from "node:crypto";
import { OpenAPIHono } from "@hono/zod-openapi";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../../db/client.js";
import { getUserId, privyAuth } from "../../middleware/auth.js";
import { checkServiceRateLimit, getClientIp, rateLimit } from "../../middleware/rate-limit.js";
import { loggers } from "../../utils/logger.js";
import { listConnectedBotsPresence } from "../../services/connected-bots.js";
import {
    createConnectHandshakeIntent,
    consumeConnectHandshakeIntent,
} from "../../services/connect-intent.js";
import { validateConnectEndpoint } from "../../services/connect-security.js";
import { createMcpToken } from "../../services/mcp-token.js";
import {
    isRailwayProvisionerConfigured,
    provisionSigilBotRuntime,
} from "../../services/infra/railway-provisioner.js";
import { getErrorMessage } from "../../utils/errors.js";

const log = loggers.server;

export const connect = new OpenAPIHono();

// All connect routes require Privy auth
connect.use("*", privyAuth());
connect.use(
    "/quick-launch",
    rateLimit("connect-quick-launch-route", {
        limit: 5,
        windowMs: 60 * 60 * 1000,
        message: "Too many quick-launch requests from this IP. Try again later.",
    }),
);

// ————————————————————————————————————————————————
// Schemas
// ————————————————————————————————————————————————

const IntentRequestSchema = z.object({
    endpoint: z.string().url(),
    stack: z.enum(["sigilbot", "openclaw"]).default("sigilbot"),
});

const HandshakeRequestSchema = z.object({
    endpoint: z.string().url(),
    stack: z.enum(["sigilbot", "openclaw"]).default("sigilbot"),
    secret: z.string().optional(),
    intentToken: z.string().min(16),
});

const QuickLaunchRequestSchema = z.object({
    stack: z.enum(["sigilbot", "openclaw"]).default("sigilbot"),
    connectSecret: z.string().min(8).optional(),
});

const PresenceQuerySchema = z.object({
    windowMinutes: z.coerce.number().int().min(1).max(120).default(30),
});

const QuickLaunchIdParamSchema = z.object({
    id: z.string().uuid(),
});

// ————————————————————————————————————————————————
// Helpers
// ————————————————————————————————————————————————

async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHealth(endpoint: string): Promise<void> {
    const healthUrl = `${endpoint.replace(/\/$/, "")}/health`;
    const maxAttempts = 20;

    for (let i = 0; i < maxAttempts; i += 1) {
        try {
            const response = await fetch(healthUrl, {
                method: "GET",
                signal: AbortSignal.timeout(5_000),
            });
            if (response.ok) {
                return;
            }
        } catch {
            // Keep polling until timeout budget is exhausted.
        }
        await sleep(3_000);
    }

    throw new Error("Provisioned runtime did not become healthy in time");
}

async function proxyHandshakeToBot(input: {
    endpoint: string;
    stack: "sigilbot" | "openclaw";
    userId: string;
    secret?: string;
}): Promise<{
    handshake: {
        ok: boolean;
        connectionId?: string;
        bot?: { id: string; stack: string };
        scopes?: string[];
    };
}> {
    const nonce = randomUUID();
    const timestamp = new Date().toISOString();
    const handshakePayload = {
        nonce,
        timestamp,
        userId: input.userId,
        pluginId: input.stack,
    };

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (input.secret) {
        headers["x-sigil-connect-secret"] = input.secret;
    }

    let botResponse: Response;
    try {
        botResponse = await fetch(`${input.endpoint.replace(/\/$/, "")}/v1/handshake`, {
            method: "POST",
            headers,
            body: JSON.stringify(handshakePayload),
            signal: AbortSignal.timeout(10_000),
        });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        throw new Error(`Bot endpoint unreachable: ${message}`);
    }

    if (!botResponse.ok) {
        let detail = "Unknown error";
        try {
            const errBody = (await botResponse.json()) as { error?: string };
            detail = errBody.error || detail;
        } catch {
            // Ignore JSON parsing errors.
        }
        throw new Error(`Bot rejected handshake: ${detail}`);
    }

    const handshake = (await botResponse.json()) as {
        ok: boolean;
        connectionId?: string;
        bot?: { id: string; stack: string };
        scopes?: string[];
    };

    return { handshake };
}

async function persistConnectedBot(input: {
    userId: string;
    endpoint: string;
    stack: "sigilbot" | "openclaw";
    handshake: {
        connectionId?: string;
        bot?: { id: string; stack: string };
        scopes?: string[];
    };
    provision?: {
        provider: "railway";
        projectId: string;
        serviceId: string;
        deploymentId: string;
    };
}) {
    const db = getDb();
    const [record] = await db
        .insert(schema.connectedBots)
        .values({
            userId: input.userId,
            stack: input.stack,
            endpoint: input.endpoint,
            connectionId: input.handshake.connectionId || null,
            botId: input.handshake.bot?.id || null,
            status: "connected",
            scopes: input.handshake.scopes || [],
            lastSeenAt: new Date(),
            provisioner: input.provision?.provider ?? null,
            provisionStatus: input.provision ? "ready" : null,
            provisionProjectId: input.provision?.projectId ?? null,
            provisionServiceId: input.provision?.serviceId ?? null,
            provisionDeploymentId: input.provision?.deploymentId ?? null,
        })
        .returning();

    return record;
}

// ————————————————————————————————————————————————
// POST /intent
// ————————————————————————————————————————————————

connect.post("/intent", async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Authentication required" }, 401);

    const body = await c.req.json();
    const parsed = IntentRequestSchema.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
    }

    const { endpoint, stack } = parsed.data;

    let normalizedEndpoint: string;
    try {
        normalizedEndpoint = await validateConnectEndpoint(endpoint);
    } catch (err) {
        return c.json({ error: getErrorMessage(err, "Invalid endpoint") }, 400);
    }

    const limit = await checkServiceRateLimit("connect-intent", `${userId}:${normalizedEndpoint}`, {
        limit: 20,
        windowMs: 60 * 60 * 1000,
    });
    if (!limit.allowed) {
        return c.json(
            {
                error: "Too many connect intent attempts for this endpoint",
                retryAfter: Math.ceil(limit.resetInMs / 1000),
            },
            429,
        );
    }

    const intent = await createConnectHandshakeIntent({
        userId,
        endpoint: normalizedEndpoint,
        stack,
    });

    return c.json({
        intentToken: intent.token,
        expiresAt: intent.expiresAt.toISOString(),
        endpoint: normalizedEndpoint,
        stack,
    });
});

// ————————————————————————————————————————————————
// POST /handshake
// ————————————————————————————————————————————————

connect.post("/handshake", async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Authentication required" }, 401);

    const body = await c.req.json();
    const parsed = HandshakeRequestSchema.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
    }

    const { endpoint, stack, secret, intentToken } = parsed.data;
    const ip = getClientIp(c) || "unknown";

    let normalizedEndpoint: string;
    try {
        normalizedEndpoint = await validateConnectEndpoint(endpoint);
    } catch (err) {
        return c.json({ error: getErrorMessage(err, "Invalid endpoint") }, 400);
    }

    const limit = await checkServiceRateLimit(
        "connect-handshake",
        `${userId}:${normalizedEndpoint}`,
        {
            limit: 10,
            windowMs: 60 * 60 * 1000,
        },
    );
    if (!limit.allowed) {
        return c.json(
            {
                error: "Too many handshake attempts for this endpoint",
                retryAfter: Math.ceil(limit.resetInMs / 1000),
            },
            429,
        );
    }

    try {
        await consumeConnectHandshakeIntent({
            token: intentToken,
            userId,
            endpoint: normalizedEndpoint,
            stack,
            ip,
        });
    } catch (err) {
        return c.json({ error: getErrorMessage(err, "Invalid handshake intent") }, 400);
    }

    let handshakeResult: Awaited<ReturnType<typeof proxyHandshakeToBot>>;
    try {
        handshakeResult = await proxyHandshakeToBot({
            endpoint: normalizedEndpoint,
            stack,
            userId,
            secret,
        });
    } catch (err) {
        log.warn(
            { endpoint: normalizedEndpoint, userId, error: getErrorMessage(err) },
            "connect handshake failed",
        );
        return c.json({ error: getErrorMessage(err, "Handshake failed") }, 502);
    }

    const record = await persistConnectedBot({
        userId,
        endpoint: normalizedEndpoint,
        stack,
        handshake: handshakeResult.handshake,
    });

    log.info(
        { connectionId: record.connectionId, botId: record.botId, userId },
        "connect handshake: success",
    );

    return c.json({
        ok: true,
        bot: record,
        handshake: handshakeResult.handshake,
    });
});

// ————————————————————————————————————————————————
// POST /quick-launch
// ————————————————————————————————————————————————

connect.post("/quick-launch", async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Authentication required" }, 401);
    const ip = getClientIp(c) || "unknown";

    const body = await c.req.json().catch(() => null);
    if (!body || typeof body !== "object") {
        return c.json({ error: "Invalid JSON body" }, 400);
    }
    const parsed = QuickLaunchRequestSchema.safeParse(body);
    if (!parsed.success) {
        return c.json({ error: "Invalid request", details: parsed.error.flatten() }, 400);
    }

    if (!isRailwayProvisionerConfigured()) {
        return c.json(
            {
                error: "Railway provisioner is not configured on backend",
            },
            503,
        );
    }

    const { stack, connectSecret } = parsed.data;
    const db = getDb();

    const inFlightLimit = await checkServiceRateLimit(
        "connect-quick-launch-inflight",
        `${userId}:${stack}`,
        {
            limit: 1,
            windowMs: 5 * 60 * 1000,
        },
    );
    if (!inFlightLimit.allowed) {
        return c.json(
            {
                error: "A quick-launch request is already being processed. Please wait before retrying.",
                retryAfter: Math.ceil(inFlightLimit.resetInMs / 1000),
            },
            429,
        );
    }

    const userLimit = await checkServiceRateLimit("connect-quick-launch-user", userId, {
        limit: 2,
        windowMs: 60 * 60 * 1000,
    });
    if (!userLimit.allowed) {
        return c.json(
            {
                error: "Too many connect quick-launch attempts for this account",
                retryAfter: Math.ceil(userLimit.resetInMs / 1000),
            },
            429,
        );
    }

    const ipLimit = await checkServiceRateLimit("connect-quick-launch-ip", ip, {
        limit: 5,
        windowMs: 60 * 60 * 1000,
    });
    if (!ipLimit.allowed) {
        return c.json(
            {
                error: "Too many connect quick-launch attempts from this IP",
                retryAfter: Math.ceil(ipLimit.resetInMs / 1000),
            },
            429,
        );
    }

    const [existingPending] = await db
        .select()
        .from(schema.connectQuickLaunches)
        .where(
            and(
                eq(schema.connectQuickLaunches.userId, userId),
                eq(schema.connectQuickLaunches.stack, stack),
                eq(schema.connectQuickLaunches.status, "pending"),
            ),
        )
        .limit(1);
    if (existingPending) {
        return c.json(
            {
                error: "A quick-launch is already in progress for this stack",
                quickLaunchId: existingPending.id,
                status: existingPending.status,
            },
            409,
        );
    }

    const [launchRow] = await db
        .insert(schema.connectQuickLaunches)
        .values({
            userId,
            stack,
            status: "pending",
        })
        .returning();

    try {
        const tokenName = `SigilBot runtime ${new Date().toISOString().slice(0, 19)}`;
        const createdToken = await createMcpToken({
            userId,
            name: tokenName,
            scopes: [
                "chat:write",
                "launch:read",
                "launch:write",
                "dashboard:read",
                "verify:write",
                "developers:read",
                "governance:read",
                "claim:write",
            ],
            expiresInDays: 30,
        });

        const provisioned = await provisionSigilBotRuntime({
            userId,
            stack,
            mcpToken: createdToken.token,
            connectSecret,
        });

        await waitForHealth(provisioned.endpoint);
        const handshake = await proxyHandshakeToBot({
            endpoint: provisioned.endpoint,
            stack,
            userId,
            secret: connectSecret,
        });

        const bot = await persistConnectedBot({
            userId,
            endpoint: provisioned.endpoint,
            stack,
            handshake: handshake.handshake,
            provision: {
                provider: "railway",
                projectId: provisioned.projectId,
                serviceId: provisioned.serviceId,
                deploymentId: provisioned.deploymentId,
            },
        });

        await db
            .update(schema.connectQuickLaunches)
            .set({
                status: "ready",
                endpoint: provisioned.endpoint,
                mcpTokenId: createdToken.metadata.id,
                railwayProjectId: provisioned.projectId,
                railwayServiceId: provisioned.serviceId,
                railwayDeploymentId: provisioned.deploymentId,
                updatedAt: new Date(),
            })
            .where(eq(schema.connectQuickLaunches.id, launchRow.id));

        return c.json({
            ok: true,
            quickLaunchId: launchRow.id,
            endpoint: provisioned.endpoint,
            runtimeToken: createdToken.token,
            runtimeTokenPrefix: createdToken.metadata.tokenPrefix,
            resourceProfile: provisioned.minimumResources,
            bot,
            handshake: handshake.handshake,
        });
    } catch (err) {
        await db
            .update(schema.connectQuickLaunches)
            .set({
                status: "failed",
                error: getErrorMessage(err, "Provisioning failed"),
                updatedAt: new Date(),
            })
            .where(eq(schema.connectQuickLaunches.id, launchRow.id));

        return c.json({ error: getErrorMessage(err, "Connect quick-launch failed") }, 500);
    }
});

// ————————————————————————————————————————————————
// GET /quick-launch/:id
// ————————————————————————————————————————————————

connect.get("/quick-launch/:id", async (c) => {
    const userId = getUserId(c);
    if (!userId) return c.json({ error: "Authentication required" }, 401);

    const parsed = QuickLaunchIdParamSchema.safeParse({ id: c.req.param("id") });
    if (!parsed.success) {
        return c.json({ error: "Invalid quick-launch ID" }, 400);
    }

    const db = getDb();
    const [row] = await db
        .select()
        .from(schema.connectQuickLaunches)
        .where(
            and(
                eq(schema.connectQuickLaunches.id, parsed.data.id),
                eq(schema.connectQuickLaunches.userId, userId),
            ),
        )
        .limit(1);

    if (!row) {
        return c.json({ error: "Quick-launch not found" }, 404);
    }

    return c.json({
        quickLaunchId: row.id,
        status: row.status,
        endpoint: row.endpoint,
        error: row.error,
        railwayProjectId: row.railwayProjectId,
        railwayServiceId: row.railwayServiceId,
        railwayDeploymentId: row.railwayDeploymentId,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    });
});

// ————————————————————————————————————————————————
// GET /bots
// ————————————————————————————————————————————————

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

// ————————————————————————————————————————————————
// GET /bots/presence
// ————————————————————————————————————————————————

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

// ————————————————————————————————————————————————
// DELETE /bots/:id
// ————————————————————————————————————————————————

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
