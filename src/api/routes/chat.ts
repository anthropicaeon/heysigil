/**
 * Chat API Routes
 *
 * - POST /api/chat
 * - GET /api/chat/:sessionId
 * - POST /api/chat/:sessionId/messages/:messageId/delete
 * - POST /api/chat/:sessionId/messages/:messageId/vote
 */

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getBody, getParams, getQuery } from "../helpers/request.js";
import { createSession, getSession, processMessage } from "../../agent/engine.js";
import {
    chatRateLimit,
    rateLimit,
    sessionEnumerationRateLimit,
} from "../../middleware/rate-limit.js";
import { getAuthType, getUserId, privyAuthOptional } from "../../middleware/auth.js";
import {
    ErrorResponseSchema,
    NotFoundResponseSchema,
    RateLimitResponseSchema,
} from "../schemas/common.js";
import {
    ChatAgentFeedQuerySchema,
    ChatAgentFeedResponseSchema,
    ChatDeleteRequestSchema,
    ChatDeleteResponseSchema,
    ChatMessageParamSchema,
    ChatMessageRequestSchema,
    ChatMessageResponseSchema,
    ChatSessionQuerySchema,
    ChatSessionResponseSchema,
    ChatVoteRequestSchema,
    ChatVoteResponseSchema,
    SessionIdParamSchema,
} from "../schemas/chat.js";
import { handler } from "../helpers/route.js";
import { getErrorMessage } from "../../utils/errors.js";
import {
    appendStoredChatMessage,
    getStoredChatSession,
    listStoredAgentFeedForUser,
    softDeleteStoredChatMessage,
    upsertStoredChatVote,
} from "../../services/chat-store.js";
import { touchConnectedBotPresence } from "../../services/connected-bots.js";
import { DatabaseUnavailableError } from "../../db/client.js";

const chat = new OpenAPIHono();

chat.use("/", chatRateLimit());
chat.use("/", privyAuthOptional());
chat.use("/:sessionId", sessionEnumerationRateLimit());
chat.use(
    "/:sessionId/messages/*",
    rateLimit("chat-message-ops", {
        limit: 60,
        windowMs: 60 * 1000,
        message: "Too many chat message operations. Please slow down.",
    }),
);

interface ActorContext {
    userId: string;
    authType: "privy" | "mcp";
    actorKey: string;
    actorLabel: string;
}

function getActorContext(c: Parameters<typeof getUserId>[0]): ActorContext | null {
    const userId = getUserId(c);
    if (!userId) return null;

    const authType = getAuthType(c) || "privy";
    const mcpTokenId = c.get("mcpTokenId") as string | undefined;

    if (authType === "mcp") {
        const actorKey = `mcp:${userId}:${mcpTokenId || "token"}`;
        return {
            userId,
            authType,
            actorKey,
            actorLabel: actorKey,
        };
    }

    return {
        userId,
        authType: "privy",
        actorKey: `privy:${userId}`,
        actorLabel: `privy:${userId}`,
    };
}

const postMessageRoute = createRoute({
    method: "post",
    path: "/",
    tags: ["Chat"],
    summary: "Send message to AI agent",
    description:
        "Send a message to the Sigil AI agent. Creates a new session if sessionId is not provided.",
    request: {
        body: {
            content: {
                "application/json": {
                    schema: ChatMessageRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ChatMessageResponseSchema,
                },
            },
            description: "AI agent response",
        },
        400: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Invalid request",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded",
        },
        500: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Agent processing error",
        },
    },
});

chat.openapi(
    postMessageRoute,
    handler(async (c) => {
        const body = getBody(c, ChatMessageRequestSchema);

        if (!body.message?.trim()) {
            return c.json({ error: "Message is required" }, 400);
        }

        let sid = body.sessionId;
        if (!sid) {
            const session = createSession("web");
            sid = session.id;
        }

        const actor = getActorContext(c);

        try {
            const privyUserId = getUserId(c) || undefined;

            // V3 launches mint 6 LP positions — give up to 110s before responding
            const CHAT_TIMEOUT_MS = 110_000;
            const response = await Promise.race([
                processMessage(sid, body.message, body.walletAddress, {
                    privyUserId,
                }),
                new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error("__CHAT_TIMEOUT__")), CHAT_TIMEOUT_MS),
                ),
            ]);

            try {
                await appendStoredChatMessage({
                    sessionId: sid,
                    platform: "web",
                    role: "user",
                    source: actor?.authType === "mcp" ? "agent" : "user",
                    content: body.message,
                    createdByUserId: actor?.userId,
                });
                await appendStoredChatMessage({
                    sessionId: sid,
                    platform: "web",
                    role: "assistant",
                    source: actor?.authType === "mcp" ? "agent" : "assistant",
                    content: response,
                    createdByUserId: actor?.userId,
                });
            } catch (err) {
                if (!(err instanceof DatabaseUnavailableError)) {
                    throw err;
                }
            }

            if (actor?.authType === "mcp") {
                try {
                    await touchConnectedBotPresence(actor.userId, body.agentId);
                } catch (err) {
                    if (!(err instanceof DatabaseUnavailableError)) {
                        throw err;
                    }
                }
            }

            return c.json({
                sessionId: sid,
                response,
            });
        } catch (err) {
            const msg = getErrorMessage(err, "Agent error");
            if (msg.includes("__CHAT_TIMEOUT__")) {
                return c.json(
                    {
                        sessionId: sid,
                        response:
                            "⏱️ The request timed out — token deployment on Base can take up to 60 seconds with V3 multi-position LP. Check your recent transactions or try again.",
                    },
                    200,
                );
            }
            return c.json({ error: msg }, 500);
        }
    }),
);

const getAgentFeedRoute = createRoute({
    method: "get",
    path: "/agents/feed",
    tags: ["Chat"],
    summary: "Get agent chat feed for the authenticated user",
    request: {
        query: ChatAgentFeedQuerySchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ChatAgentFeedResponseSchema,
                },
            },
            description: "Agent-origin chat messages",
        },
        401: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Authentication required",
        },
    },
});

chat.openapi(
    getAgentFeedRoute,
    handler(async (c) => {
        const actor = getActorContext(c);
        if (!actor) {
            return c.json({ error: "Authentication required" }, 401);
        }

        const query = getQuery(c, ChatAgentFeedQuerySchema);

        try {
            const messages = await listStoredAgentFeedForUser(actor.userId, query.limit);
            return c.json({
                messages: messages.map((m) => ({
                    id: m.id,
                    sessionId: m.sessionId,
                    role: m.role,
                    source: "agent" as const,
                    content: m.content,
                    timestamp: m.createdAt.toISOString(),
                })),
                limit: query.limit,
                count: messages.length,
            });
        } catch (err) {
            if (err instanceof DatabaseUnavailableError) {
                return c.json({ error: "Chat persistence is unavailable" }, 503);
            }
            return c.json({ error: getErrorMessage(err, "Failed to fetch agent feed") }, 500);
        }
    }),
);

const getSessionRoute = createRoute({
    method: "get",
    path: "/{sessionId}",
    tags: ["Chat"],
    summary: "Get chat session history",
    description: "Retrieve chat history for a session, including vote metadata when persisted.",
    request: {
        params: SessionIdParamSchema,
        query: ChatSessionQuerySchema,
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ChatSessionResponseSchema,
                },
            },
            description: "Chat session with message history",
        },
        404: {
            content: {
                "application/json": {
                    schema: NotFoundResponseSchema,
                },
            },
            description: "Session not found",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded",
        },
    },
});

chat.openapi(
    getSessionRoute,
    handler(async (c) => {
        const { sessionId } = getParams(c, SessionIdParamSchema);
        const query = getQuery(c, ChatSessionQuerySchema);
        const actor = getActorContext(c);

        try {
            const stored = await getStoredChatSession(sessionId, {
                limit: query.limit,
                offset: query.offset,
                includeDeleted: query.includeDeleted,
                actorKey: actor?.actorKey,
            });

            if (stored) {
                const inMemory = getSession(sessionId);
                return c.json({
                    sessionId: stored.session.id,
                    platform: stored.session.platform,
                    hasWallet: !!inMemory?.walletAddress,
                    messages: stored.messages.map((m) => ({
                        id: m.id,
                        role: m.role,
                        source: m.source,
                        content: m.content,
                        timestamp: m.createdAt.toISOString(),
                        deleted: !!m.deletedAt,
                        deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
                        upvotes: m.upvotes,
                        downvotes: m.downvotes,
                        myVote: m.myVote === 1 ? "up" : m.myVote === -1 ? "down" : "none",
                    })),
                    pagination: stored.pagination,
                });
            }
        } catch (err) {
            if (!(err instanceof DatabaseUnavailableError)) {
                return c.json({ error: getErrorMessage(err, "Failed to fetch chat session") }, 500);
            }
        }

        const session = getSession(sessionId);
        if (!session) {
            return c.json({ error: "Session not found" }, 404);
        }

        return c.json({
            sessionId: session.id,
            platform: session.platform,
            hasWallet: !!session.walletAddress,
            messages: session.messages.map((m) => ({
                id: crypto.randomUUID(),
                role: m.role,
                source: m.role === "assistant" ? "assistant" : "user",
                content: m.content,
                timestamp: m.timestamp.toISOString(),
                deleted: false,
                deletedAt: null,
                upvotes: 0,
                downvotes: 0,
                myVote: "none",
            })),
        });
    }),
);

const deleteMessageRoute = createRoute({
    method: "post",
    path: "/{sessionId}/messages/{messageId}/delete",
    tags: ["Chat"],
    summary: "Soft-delete a chat message",
    request: {
        params: ChatMessageParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: ChatDeleteRequestSchema,
                },
            },
            required: false,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ChatDeleteResponseSchema,
                },
            },
            description: "Message soft-deleted",
        },
        401: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Authentication required",
        },
        403: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Forbidden",
        },
        404: {
            content: {
                "application/json": {
                    schema: NotFoundResponseSchema,
                },
            },
            description: "Message not found",
        },
    },
});

chat.openapi(
    deleteMessageRoute,
    handler(async (c) => {
        const actor = getActorContext(c);
        if (!actor) {
            return c.json({ error: "Authentication required" }, 401);
        }

        const { sessionId, messageId } = getParams(c, ChatMessageParamSchema);
        const rawBody = (c.req as { valid: (target: "json") => unknown }).valid("json");
        ChatDeleteRequestSchema.parse(rawBody ?? {});

        try {
            const result = await softDeleteStoredChatMessage({
                sessionId,
                messageId,
                userId: actor.userId,
                actorLabel: actor.actorLabel,
            });

            if (!result.success && result.reason === "forbidden") {
                return c.json({ error: "Forbidden" }, 403);
            }
            if (!result.success) {
                return c.json({ error: "Message not found" }, 404);
            }

            return c.json({
                success: true,
                messageId,
                deletedAt: new Date().toISOString(),
            });
        } catch (err) {
            if (err instanceof DatabaseUnavailableError) {
                return c.json({ error: "Chat persistence is unavailable" }, 503);
            }
            return c.json({ error: getErrorMessage(err, "Delete failed") }, 500);
        }
    }),
);

const voteMessageRoute = createRoute({
    method: "post",
    path: "/{sessionId}/messages/{messageId}/vote",
    tags: ["Chat"],
    summary: "Vote on a chat message",
    request: {
        params: ChatMessageParamSchema,
        body: {
            content: {
                "application/json": {
                    schema: ChatVoteRequestSchema,
                },
            },
            required: true,
        },
    },
    responses: {
        200: {
            content: {
                "application/json": {
                    schema: ChatVoteResponseSchema,
                },
            },
            description: "Vote stored",
        },
        401: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Authentication required",
        },
        403: {
            content: {
                "application/json": {
                    schema: ErrorResponseSchema,
                },
            },
            description: "Forbidden",
        },
        404: {
            content: {
                "application/json": {
                    schema: NotFoundResponseSchema,
                },
            },
            description: "Message not found",
        },
    },
});

chat.openapi(
    voteMessageRoute,
    handler(async (c) => {
        const actor = getActorContext(c);
        if (!actor) {
            return c.json({ error: "Authentication required" }, 401);
        }

        const { sessionId, messageId } = getParams(c, ChatMessageParamSchema);
        const body = getBody(c, ChatVoteRequestSchema);

        try {
            const vote = body.vote === "up" ? 1 : -1;
            const result = await upsertStoredChatVote({
                sessionId,
                messageId,
                userId: actor.userId,
                actorKey: actor.actorKey,
                vote,
            });

            if (!result.success && result.reason === "forbidden") {
                return c.json({ error: "Forbidden" }, 403);
            }
            if (!result.success) {
                return c.json({ error: "Message not found" }, 404);
            }

            return c.json({
                success: true,
                messageId,
                vote: body.vote,
                upvotes: result.upvotes || 0,
                downvotes: result.downvotes || 0,
            });
        } catch (err) {
            if (err instanceof DatabaseUnavailableError) {
                return c.json({ error: "Chat persistence is unavailable" }, 503);
            }
            return c.json({ error: getErrorMessage(err, "Vote failed") }, 500);
        }
    }),
);

export { chat };
