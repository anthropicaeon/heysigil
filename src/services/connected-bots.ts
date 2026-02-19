import { and, eq, or } from "drizzle-orm";
import { getDb, schema } from "../db/client.js";

export interface ConnectedBotPresence {
    id: string;
    stack: string;
    endpoint: string;
    connectionId: string | null;
    botId: string | null;
    status: string;
    scopes: string[] | null;
    connectedAt: Date;
    disconnectedAt: Date | null;
    lastSeenAt: Date | null;
    presence: "online" | "offline";
    minutesSinceSeen: number | null;
}

export async function touchConnectedBotPresence(
    userId: string,
    agentRef?: string | null,
): Promise<number> {
    const db = getDb();
    const now = new Date();

    const where = agentRef
        ? and(
              eq(schema.connectedBots.userId, userId),
              or(
                  eq(schema.connectedBots.id, agentRef),
                  eq(schema.connectedBots.connectionId, agentRef),
                  eq(schema.connectedBots.botId, agentRef),
              ),
          )
        : eq(schema.connectedBots.userId, userId);

    const rows = await db
        .update(schema.connectedBots)
        .set({
            status: "connected",
            lastSeenAt: now,
        })
        .where(where)
        .returning({ id: schema.connectedBots.id });

    return rows.length;
}

export async function listConnectedBotsPresence(
    userId: string,
    windowMinutes = 30,
): Promise<ConnectedBotPresence[]> {
    const db = getDb();
    const bots = await db
        .select()
        .from(schema.connectedBots)
        .where(eq(schema.connectedBots.userId, userId));

    const nowMs = Date.now();

    return bots.map((bot) => {
        const seenMs = bot.lastSeenAt ? nowMs - bot.lastSeenAt.getTime() : null;
        const minutesSinceSeen = seenMs === null ? null : Math.max(0, Math.floor(seenMs / 60000));
        const isActive =
            bot.status === "connected" &&
            minutesSinceSeen !== null &&
            minutesSinceSeen <= windowMinutes;

        return {
            id: bot.id,
            stack: bot.stack,
            endpoint: bot.endpoint,
            connectionId: bot.connectionId,
            botId: bot.botId,
            status: bot.status,
            scopes: bot.scopes,
            connectedAt: bot.connectedAt,
            disconnectedAt: bot.disconnectedAt,
            lastSeenAt: bot.lastSeenAt,
            presence: isActive ? "online" : "offline",
            minutesSinceSeen,
        };
    });
}
