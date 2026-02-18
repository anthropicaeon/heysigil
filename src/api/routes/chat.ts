/**
 * Chat API Routes
 *
 * AI agent chat session endpoints.
 */

import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getBody, getParams } from "../helpers/request.js";
import { createSession, getSession, processMessage } from "../../agent/engine.js";
import { chatRateLimit, sessionEnumerationRateLimit } from "../../middleware/rate-limit.js";
import { privyAuthOptional, getUserId } from "../../middleware/auth.js";
import {
    ErrorResponseSchema,
    NotFoundResponseSchema,
    RateLimitResponseSchema,
} from "../schemas/common.js";
import {
    ChatMessageRequestSchema,
    ChatMessageResponseSchema,
    SessionIdParamSchema,
    ChatSessionResponseSchema,
} from "../schemas/chat.js";
import { handler } from "../helpers/route.js";
import { getErrorMessage } from "../../utils/errors.js";

const chat = new OpenAPIHono();

// Rate limit chat messages (20 per minute per IP - LLM calls are expensive)
chat.use("/", chatRateLimit());
chat.use("/", privyAuthOptional());

// Rate limit session lookups to prevent enumeration
chat.use("/:sessionId", sessionEnumerationRateLimit());

/**
 * POST /api/chat
 * Send a message to the Sigil agent.
 */
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
            description: "Invalid request (missing message)",
        },
        429: {
            content: {
                "application/json": {
                    schema: RateLimitResponseSchema,
                },
            },
            description: "Rate limit exceeded (20 requests per minute)",
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

        // Get or create session
        let sid = body.sessionId;
        if (!sid) {
            const session = createSession("web");
            sid = session.id;
        }

        try {
            // Pass Privy user ID so engine uses persistent user wallet
            const privyUserId = getUserId(c) || undefined;
            const response = await processMessage(sid, body.message, body.walletAddress, {
                privyUserId,
            });

            return c.json({
                sessionId: sid,
                response,
            });
        } catch (err) {
            return c.json({ error: getErrorMessage(err, "Agent error") }, 500);
        }
    }),
);

/**
 * GET /api/chat/:sessionId
 * Get chat history for a session.
 */
const getSessionRoute = createRoute({
    method: "get",
    path: "/{sessionId}",
    tags: ["Chat"],
    summary: "Get chat session history",
    description: "Retrieve the full chat history for a specific session.",
    request: {
        params: SessionIdParamSchema,
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
        const session = getSession(sessionId);

        if (!session) {
            return c.json({ error: "Session not found" }, 404);
        }

        return c.json({
            sessionId: session.id,
            platform: session.platform,
            hasWallet: !!session.walletAddress,
            messages: session.messages.map((m) => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp.toISOString(),
            })),
        });
    }),
);

export { chat };
