import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull } from "drizzle-orm";
import { DatabaseUnavailableError, getDb, schema } from "../db/client.js";
import { DEFAULT_MCP_SCOPES, MCP_SCOPES, type McpScope } from "../mcp/scopes.js";

const TOKEN_PREFIX_BASE = "sigil_pat";
const DEFAULT_TOKEN_DAYS = 30;
const MAX_TOKEN_DAYS = 365;

export interface CreateMcpTokenInput {
    userId: string;
    name?: string;
    scopes?: string[];
    expiresInDays?: number;
}

export interface McpTokenView {
    id: string;
    name: string;
    tokenPrefix: string;
    scopes: string[];
    expiresAt: string | null;
    lastUsedAt: string | null;
    revokedAt: string | null;
    createdAt: string;
}

export interface CreatedMcpToken {
    token: string;
    metadata: McpTokenView;
}

export interface VerifiedMcpToken {
    userId: string;
    scopes: string[];
    tokenId: string;
}

function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

function parseTokenPrefix(token: string): string | null {
    const parts = token.split("_");
    if (parts.length < 4) return null;
    if (parts[0] !== "sigil" || parts[1] !== "pat") return null;
    return `${parts[0]}_${parts[1]}_${parts[2]}`;
}

function toView(token: typeof schema.mcpTokens.$inferSelect): McpTokenView {
    return {
        id: token.id,
        name: token.name,
        tokenPrefix: token.tokenPrefix,
        scopes: token.scopes,
        expiresAt: token.expiresAt?.toISOString() ?? null,
        lastUsedAt: token.lastUsedAt?.toISOString() ?? null,
        revokedAt: token.revokedAt?.toISOString() ?? null,
        createdAt: token.createdAt.toISOString(),
    };
}

function normalizeScopes(scopes?: string[]): McpScope[] {
    if (!scopes || scopes.length === 0) {
        return DEFAULT_MCP_SCOPES;
    }
    const deduped = Array.from(new Set(scopes));
    const invalid = deduped.filter((scope) => !MCP_SCOPES.includes(scope as McpScope));
    if (invalid.length > 0) {
        throw new Error(`Invalid scopes: ${invalid.join(", ")}`);
    }
    return deduped as McpScope[];
}

function resolveExpiryDate(expiresInDays?: number): Date {
    const days =
        typeof expiresInDays === "number" && Number.isFinite(expiresInDays)
            ? Math.max(1, Math.min(MAX_TOKEN_DAYS, Math.floor(expiresInDays)))
            : DEFAULT_TOKEN_DAYS;
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function buildTokenValue(): { tokenPrefix: string; token: string } {
    const tokenId = randomBytes(8).toString("hex");
    const secret = randomBytes(24).toString("base64url");
    const tokenPrefix = `${TOKEN_PREFIX_BASE}_${tokenId}`;
    const token = `${tokenPrefix}_${secret}`;
    return { tokenPrefix, token };
}

function constantTimeHashEquals(a: string, b: string): boolean {
    const aBuf = Buffer.from(a);
    const bBuf = Buffer.from(b);
    if (aBuf.length !== bBuf.length) return false;
    return timingSafeEqual(aBuf, bBuf);
}

export async function createMcpToken(input: CreateMcpTokenInput): Promise<CreatedMcpToken> {
    const db = getDb();
    const { tokenPrefix, token } = buildTokenValue();
    const tokenHash = hashToken(token);
    const scopes = normalizeScopes(input.scopes);
    const expiresAt = resolveExpiryDate(input.expiresInDays);

    const [created] = await db
        .insert(schema.mcpTokens)
        .values({
            userId: input.userId,
            name: input.name?.trim() || "Default MCP Token",
            tokenPrefix,
            tokenHash,
            scopes,
            expiresAt,
        })
        .returning();

    return {
        token,
        metadata: toView(created),
    };
}

export async function listMcpTokens(userId: string): Promise<McpTokenView[]> {
    const db = getDb();
    const rows = await db
        .select()
        .from(schema.mcpTokens)
        .where(eq(schema.mcpTokens.userId, userId))
        .orderBy(desc(schema.mcpTokens.createdAt));
    return rows.map(toView);
}

export async function findMcpTokenById(
    userId: string,
    tokenId: string,
): Promise<McpTokenView | null> {
    const db = getDb();
    const [token] = await db
        .select()
        .from(schema.mcpTokens)
        .where(and(eq(schema.mcpTokens.userId, userId), eq(schema.mcpTokens.id, tokenId)))
        .limit(1);
    return token ? toView(token) : null;
}

export async function revokeMcpToken(userId: string, tokenId: string): Promise<boolean> {
    const db = getDb();
    const [updated] = await db
        .update(schema.mcpTokens)
        .set({ revokedAt: new Date() })
        .where(
            and(
                eq(schema.mcpTokens.userId, userId),
                eq(schema.mcpTokens.id, tokenId),
                isNull(schema.mcpTokens.revokedAt),
            ),
        )
        .returning({ id: schema.mcpTokens.id });
    return !!updated;
}

export async function touchMcpToken(tokenId: string): Promise<void> {
    try {
        const db = getDb();
        await db
            .update(schema.mcpTokens)
            .set({ lastUsedAt: new Date() })
            .where(eq(schema.mcpTokens.id, tokenId));
    } catch {
        // Last-used updates are best-effort only.
    }
}

export async function verifyMcpAccessToken(token: string): Promise<VerifiedMcpToken | null> {
    const tokenPrefix = parseTokenPrefix(token);
    if (!tokenPrefix) return null;

    try {
        const db = getDb();
        const [stored] = await db
            .select()
            .from(schema.mcpTokens)
            .where(
                and(
                    eq(schema.mcpTokens.tokenPrefix, tokenPrefix),
                    isNull(schema.mcpTokens.revokedAt),
                ),
            )
            .limit(1);

        if (!stored) return null;
        if (stored.expiresAt && stored.expiresAt.getTime() <= Date.now()) return null;

        const presentedHash = hashToken(token);
        if (!constantTimeHashEquals(presentedHash, stored.tokenHash)) return null;

        void touchMcpToken(stored.id);

        return {
            userId: stored.userId,
            scopes: stored.scopes,
            tokenId: stored.id,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            return null;
        }
        throw err;
    }
}
