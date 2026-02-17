/**
 * Chat API Routes
 *
 * AI agent chat session endpoints.
 */

import { createRoute, OpenAPIHono, type z, type RouteHandler } from "@hono/zod-openapi";
import { createSession, getSession, processMessage } from "../../agent/engine.js";
import { chatRateLimit, sessionEnumerationRateLimit } from "../../middleware/rate-limit.js";
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

const chat = new OpenAPIHono();

// Type helper to relax strict type checking for handlers
// biome-ignore lint/suspicious/noExplicitAny: OpenAPI handler type relaxation
type AnyHandler = RouteHandler<any, any>;

// Rate limit chat messages (20 per minute per IP - LLM calls are expensive)
chat.use("/", chatRateLimit());

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

chat.openapi(postMessageRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const body = (c.req as any).valid("json") as z.infer<typeof ChatMessageRequestSchema>;

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
        const response = await processMessage(sid, body.message, body.walletAddress);

        return c.json({
            sessionId: sid,
            response,
        });
    } catch (err) {
        return c.json({ error: err instanceof Error ? err.message : "Agent error" }, 500);
    }
}) as AnyHandler);

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

chat.openapi(getSessionRoute, (async (c) => {
    // biome-ignore lint/suspicious/noExplicitAny: OpenAPI runtime validation handles typing
    const { sessionId } = (c.req as any).valid("param") as z.infer<typeof SessionIdParamSchema>;
    const session = getSession(sessionId);

    if (!session) {
        return c.json({ error: "Session not found" }, 404);
    }

    return c.json({
        sessionId: session.id,
        platform: session.platform,
        walletAddress: session.walletAddress ?? null,
        messages: session.messages.map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
        })),
    });
}) as AnyHandler);

export { chat };
