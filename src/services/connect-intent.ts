import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getEnv } from "../config/env.js";
import { getDb, schema } from "../db/client.js";

const INTENT_PREFIX_BASE = "sigil_hs";

function hashValue(value: string): string {
    return createHash("sha256").update(value).digest("hex");
}

function parseIntentPrefix(token: string): string | null {
    const parts = token.split("_");
    if (parts.length < 4) return null;
    if (parts[0] !== "sigil" || parts[1] !== "hs") return null;
    return `${parts[0]}_${parts[1]}_${parts[2]}`;
}

function buildIntentToken(): { tokenPrefix: string; token: string } {
    const tokenId = randomBytes(8).toString("hex");
    const secret = randomBytes(24).toString("base64url");
    const tokenPrefix = `${INTENT_PREFIX_BASE}_${tokenId}`;
    return {
        tokenPrefix,
        token: `${tokenPrefix}_${secret}`,
    };
}

function hashIp(ip: string): string {
    return hashValue(`${getEnv().QUICK_LAUNCH_IP_SALT}:${ip}`);
}

function constantTimeHashEquals(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
}

export async function createConnectHandshakeIntent(input: {
    userId: string;
    endpoint: string;
    stack: string;
}): Promise<{ token: string; expiresAt: Date }> {
    const db = getDb();
    const { tokenPrefix, token } = buildIntentToken();
    const tokenHash = hashValue(token);
    const expiresAt = new Date(Date.now() + getEnv().CONNECT_HANDSHAKE_INTENT_TTL_SECONDS * 1000);

    await db.insert(schema.connectHandshakeIntents).values({
        userId: input.userId,
        endpoint: input.endpoint,
        stack: input.stack,
        tokenPrefix,
        tokenHash,
        expiresAt,
    });

    return { token, expiresAt };
}

export async function consumeConnectHandshakeIntent(input: {
    token: string;
    userId: string;
    endpoint: string;
    stack: string;
    ip: string;
}): Promise<void> {
    const db = getDb();
    const tokenPrefix = parseIntentPrefix(input.token);
    if (!tokenPrefix) {
        throw new Error("Invalid handshake intent token");
    }

    const [stored] = await db
        .select()
        .from(schema.connectHandshakeIntents)
        .where(eq(schema.connectHandshakeIntents.tokenPrefix, tokenPrefix))
        .limit(1);

    if (!stored) {
        throw new Error("Handshake intent not found");
    }
    if (stored.consumedAt) {
        throw new Error("Handshake intent already used");
    }
    if (stored.expiresAt.getTime() <= Date.now()) {
        throw new Error("Handshake intent expired");
    }
    if (stored.userId !== input.userId) {
        throw new Error("Handshake intent user mismatch");
    }
    if (stored.endpoint !== input.endpoint || stored.stack !== input.stack) {
        throw new Error("Handshake intent does not match endpoint/stack");
    }

    const presentedHash = hashValue(input.token);
    if (!constantTimeHashEquals(presentedHash, stored.tokenHash)) {
        throw new Error("Invalid handshake intent");
    }

    const [consumed] = await db
        .update(schema.connectHandshakeIntents)
        .set({
            consumedAt: new Date(),
            consumedByIpHash: hashIp(input.ip),
        })
        .where(
            and(
                eq(schema.connectHandshakeIntents.id, stored.id),
                isNull(schema.connectHandshakeIntents.consumedAt),
                sql`${schema.connectHandshakeIntents.expiresAt} > now()`,
            ),
        )
        .returning({ id: schema.connectHandshakeIntents.id });

    if (!consumed) {
        throw new Error("Handshake intent already consumed");
    }
}
