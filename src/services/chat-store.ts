import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "../db/client.js";

export type StoredChatRole = "user" | "assistant";
export type StoredChatSource = "user" | "assistant" | "agent";

export interface ChatHistoryQuery {
    limit: number;
    offset: number;
    includeDeleted?: boolean;
    actorKey?: string;
}

export interface StoredChatSession {
    id: string;
    platform: string;
    ownerUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
    lastMessageAt: Date | null;
}

export interface StoredChatMessage {
    id: string;
    sessionId: string;
    role: StoredChatRole;
    source: StoredChatSource;
    content: string;
    createdByUserId: string | null;
    createdAt: Date;
    deletedAt: Date | null;
    deletedBy: string | null;
    upvotes: number;
    downvotes: number;
    myVote: 1 | -1 | 0;
}

export interface StoredChatHistory {
    session: StoredChatSession;
    messages: StoredChatMessage[];
    pagination: {
        limit: number;
        offset: number;
        count: number;
        total: number;
        hasMore: boolean;
    };
}

function toNumber(value: number | string | null | undefined): number {
    if (typeof value === "number") return value;
    if (typeof value === "string") {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }
    return 0;
}

export async function ensureStoredChatSession(
    sessionId: string,
    platform: string,
    ownerUserId?: string,
): Promise<void> {
    const db = getDb();
    const now = new Date();

    await db
        .insert(schema.chatSessions)
        .values({
            id: sessionId,
            platform,
            ownerUserId: ownerUserId || null,
            updatedAt: now,
        })
        .onConflictDoNothing();

    if (ownerUserId) {
        await db
            .update(schema.chatSessions)
            .set({
                ownerUserId,
                updatedAt: now,
            })
            .where(
                and(eq(schema.chatSessions.id, sessionId), isNull(schema.chatSessions.ownerUserId)),
            );
    }
}

export async function appendStoredChatMessage(input: {
    sessionId: string;
    platform: string;
    role: StoredChatRole;
    source: StoredChatSource;
    content: string;
    createdByUserId?: string;
}): Promise<{ id: string }> {
    const db = getDb();
    const now = new Date();

    await ensureStoredChatSession(input.sessionId, input.platform, input.createdByUserId);

    const [row] = await db
        .insert(schema.chatMessages)
        .values({
            sessionId: input.sessionId,
            role: input.role,
            source: input.source,
            content: input.content,
            createdByUserId: input.createdByUserId || null,
        })
        .returning({ id: schema.chatMessages.id });

    await db
        .update(schema.chatSessions)
        .set({
            updatedAt: now,
            lastMessageAt: now,
        })
        .where(eq(schema.chatSessions.id, input.sessionId));

    return { id: row.id };
}

export async function getStoredChatSession(
    sessionId: string,
    query: ChatHistoryQuery,
): Promise<StoredChatHistory | null> {
    const db = getDb();
    const includeDeleted = !!query.includeDeleted;

    const [session] = await db
        .select()
        .from(schema.chatSessions)
        .where(eq(schema.chatSessions.id, sessionId))
        .limit(1);

    if (!session) return null;

    const baseWhere = eq(schema.chatMessages.sessionId, sessionId);
    const messagesWhere = includeDeleted
        ? baseWhere
        : and(baseWhere, isNull(schema.chatMessages.deletedAt));

    const rows = await db
        .select({
            id: schema.chatMessages.id,
            sessionId: schema.chatMessages.sessionId,
            role: schema.chatMessages.role,
            source: schema.chatMessages.source,
            content: schema.chatMessages.content,
            createdByUserId: schema.chatMessages.createdByUserId,
            createdAt: schema.chatMessages.createdAt,
            deletedAt: schema.chatMessages.deletedAt,
            deletedBy: schema.chatMessages.deletedBy,
        })
        .from(schema.chatMessages)
        .where(messagesWhere)
        .orderBy(asc(schema.chatMessages.createdAt))
        .limit(query.limit)
        .offset(query.offset);

    const [{ total }] = await db
        .select({
            total: sql<number>`count(*)`,
        })
        .from(schema.chatMessages)
        .where(messagesWhere);

    const messageIds = rows.map((row) => row.id);

    const voteSummaries =
        messageIds.length === 0
            ? []
            : await db
                  .select({
                      messageId: schema.chatMessageVotes.messageId,
                      upvotes:
                          sql<number>`COALESCE(SUM(CASE WHEN ${schema.chatMessageVotes.vote} = 1 THEN 1 ELSE 0 END), 0)`,
                      downvotes:
                          sql<number>`COALESCE(SUM(CASE WHEN ${schema.chatMessageVotes.vote} = -1 THEN 1 ELSE 0 END), 0)`,
                  })
                  .from(schema.chatMessageVotes)
                  .where(inArray(schema.chatMessageVotes.messageId, messageIds))
                  .groupBy(schema.chatMessageVotes.messageId);

    const voteByMessage = new Map<string, { upvotes: number; downvotes: number }>();
    for (const vote of voteSummaries) {
        voteByMessage.set(vote.messageId, {
            upvotes: toNumber(vote.upvotes),
            downvotes: toNumber(vote.downvotes),
        });
    }

    const myVotes =
        messageIds.length === 0 || !query.actorKey
            ? []
            : await db
                  .select({
                      messageId: schema.chatMessageVotes.messageId,
                      vote: schema.chatMessageVotes.vote,
                  })
                  .from(schema.chatMessageVotes)
                  .where(
                      and(
                          inArray(schema.chatMessageVotes.messageId, messageIds),
                          eq(schema.chatMessageVotes.actorKey, query.actorKey),
                      ),
                  );

    const myVoteByMessage = new Map<string, 1 | -1>();
    for (const vote of myVotes) {
        if (vote.vote === 1 || vote.vote === -1) {
            myVoteByMessage.set(vote.messageId, vote.vote);
        }
    }

    const messages: StoredChatMessage[] = rows.map((row) => {
        const summary = voteByMessage.get(row.id);
        const myVote = myVoteByMessage.get(row.id) || 0;
        return {
            id: row.id,
            sessionId: row.sessionId,
            role: row.role as StoredChatRole,
            source: row.source as StoredChatSource,
            content: row.content,
            createdByUserId: row.createdByUserId,
            createdAt: row.createdAt,
            deletedAt: row.deletedAt,
            deletedBy: row.deletedBy,
            upvotes: summary?.upvotes || 0,
            downvotes: summary?.downvotes || 0,
            myVote,
        };
    });

    return {
        session: {
            id: session.id,
            platform: session.platform,
            ownerUserId: session.ownerUserId,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            lastMessageAt: session.lastMessageAt,
        },
        messages,
        pagination: {
            limit: query.limit,
            offset: query.offset,
            count: messages.length,
            total: toNumber(total),
            hasMore: query.offset + messages.length < toNumber(total),
        },
    };
}

async function isSessionOwnedByUser(sessionId: string, userId: string): Promise<boolean> {
    const db = getDb();
    const [session] = await db
        .select({
            ownerUserId: schema.chatSessions.ownerUserId,
        })
        .from(schema.chatSessions)
        .where(eq(schema.chatSessions.id, sessionId))
        .limit(1);

    if (!session?.ownerUserId) return false;
    return session.ownerUserId === userId;
}

export async function softDeleteStoredChatMessage(input: {
    sessionId: string;
    messageId: string;
    userId: string;
    actorLabel: string;
}): Promise<{ success: boolean; reason?: "forbidden" | "not_found" }> {
    const db = getDb();
    const allowed = await isSessionOwnedByUser(input.sessionId, input.userId);
    if (!allowed) return { success: false, reason: "forbidden" };

    const [updated] = await db
        .update(schema.chatMessages)
        .set({
            deletedAt: new Date(),
            deletedBy: input.actorLabel,
        })
        .where(
            and(
                eq(schema.chatMessages.id, input.messageId),
                eq(schema.chatMessages.sessionId, input.sessionId),
                isNull(schema.chatMessages.deletedAt),
            ),
        )
        .returning({ id: schema.chatMessages.id });

    if (!updated) return { success: false, reason: "not_found" };
    return { success: true };
}

export async function upsertStoredChatVote(input: {
    sessionId: string;
    messageId: string;
    userId: string;
    actorKey: string;
    vote: 1 | -1;
}): Promise<{
    success: boolean;
    reason?: "forbidden" | "not_found";
    upvotes?: number;
    downvotes?: number;
    myVote?: 1 | -1;
}> {
    const db = getDb();
    const allowed = await isSessionOwnedByUser(input.sessionId, input.userId);
    if (!allowed) return { success: false, reason: "forbidden" };

    const [message] = await db
        .select({ id: schema.chatMessages.id })
        .from(schema.chatMessages)
        .where(
            and(
                eq(schema.chatMessages.id, input.messageId),
                eq(schema.chatMessages.sessionId, input.sessionId),
            ),
        )
        .limit(1);
    if (!message) return { success: false, reason: "not_found" };

    const now = new Date();
    await db
        .insert(schema.chatMessageVotes)
        .values({
            sessionId: input.sessionId,
            messageId: input.messageId,
            actorKey: input.actorKey,
            vote: input.vote,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: [schema.chatMessageVotes.messageId, schema.chatMessageVotes.actorKey],
            set: {
                vote: input.vote,
                updatedAt: now,
            },
        });

    const [summary] = await db
        .select({
            upvotes:
                sql<number>`COALESCE(SUM(CASE WHEN ${schema.chatMessageVotes.vote} = 1 THEN 1 ELSE 0 END), 0)`,
            downvotes:
                sql<number>`COALESCE(SUM(CASE WHEN ${schema.chatMessageVotes.vote} = -1 THEN 1 ELSE 0 END), 0)`,
        })
        .from(schema.chatMessageVotes)
        .where(eq(schema.chatMessageVotes.messageId, input.messageId));

    return {
        success: true,
        upvotes: toNumber(summary?.upvotes),
        downvotes: toNumber(summary?.downvotes),
        myVote: input.vote,
    };
}

export async function listStoredAgentFeedForUser(userId: string, limit = 120): Promise<StoredChatMessage[]> {
    const db = getDb();

    const rows = await db
        .select({
            id: schema.chatMessages.id,
            sessionId: schema.chatMessages.sessionId,
            role: schema.chatMessages.role,
            source: schema.chatMessages.source,
            content: schema.chatMessages.content,
            createdByUserId: schema.chatMessages.createdByUserId,
            createdAt: schema.chatMessages.createdAt,
            deletedAt: schema.chatMessages.deletedAt,
            deletedBy: schema.chatMessages.deletedBy,
        })
        .from(schema.chatMessages)
        .innerJoin(schema.chatSessions, eq(schema.chatSessions.id, schema.chatMessages.sessionId))
        .where(
            and(
                eq(schema.chatSessions.ownerUserId, userId),
                eq(schema.chatMessages.source, "agent"),
                isNull(schema.chatMessages.deletedAt),
            ),
        )
        .orderBy(desc(schema.chatMessages.createdAt))
        .limit(limit);

    const ordered = [...rows].reverse();
    return ordered.map((row) => ({
        id: row.id,
        sessionId: row.sessionId,
        role: row.role as StoredChatRole,
        source: row.source as StoredChatSource,
        content: row.content,
        createdByUserId: row.createdByUserId,
        createdAt: row.createdAt,
        deletedAt: row.deletedAt,
        deletedBy: row.deletedBy,
        upvotes: 0,
        downvotes: 0,
        myVote: 0,
    }));
}
