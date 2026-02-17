/**
 * Chat API Schemas
 *
 * Zod schemas for AI agent chat session endpoints.
 */

import { z } from "@hono/zod-openapi";
import { SessionIdSchema, WalletAddressSchema, TimestampSchema } from "./common.js";

// ─── Request Schemas ─────────────────────────────────────

/**
 * POST /api/chat request body
 */
export const ChatMessageRequestSchema = z
    .object({
        message: z
            .string()
            .min(1, "Message cannot be empty")
            .max(10000, "Message too long (max 10,000 characters)")
            .openapi({
                example: "How do I verify my GitHub repository?",
                description: "Message to send to the AI agent (max 10,000 characters)",
            }),
        sessionId: SessionIdSchema.optional().openapi({
            description: "Existing session ID to continue conversation",
        }),
        walletAddress: WalletAddressSchema.optional().openapi({
            description: "User's wallet address for context",
        }),
    })
    .openapi("ChatMessageRequest");

/**
 * Path parameter for session ID
 */
export const SessionIdParamSchema = z.object({
    sessionId: SessionIdSchema,
});

// ─── Response Schemas ────────────────────────────────────

/**
 * Chat message in history
 */
export const ChatHistoryMessageSchema = z
    .object({
        role: z.enum(["user", "assistant"]).openapi({
            example: "assistant",
            description: "Message sender role",
        }),
        content: z.string().openapi({
            example: "I can help you verify your GitHub repository...",
            description: "Message content",
        }),
        timestamp: TimestampSchema,
    })
    .openapi("ChatHistoryMessage");

/**
 * POST /api/chat response
 */
export const ChatMessageResponseSchema = z
    .object({
        sessionId: SessionIdSchema.openapi({
            description: "Session ID for continuing the conversation",
        }),
        response: z.string().openapi({
            example: "I can help you verify your GitHub repository. To get started...",
            description: "AI agent response",
        }),
    })
    .openapi("ChatMessageResponse");

/**
 * GET /api/chat/:sessionId response
 */
export const ChatSessionResponseSchema = z
    .object({
        sessionId: SessionIdSchema,
        platform: z.string().openapi({
            example: "web",
            description: "Platform where session was created",
        }),
        walletAddress: WalletAddressSchema.nullable().openapi({
            description: "Associated wallet address if provided",
        }),
        messages: z.array(ChatHistoryMessageSchema).openapi({
            description: "Chat message history",
        }),
    })
    .openapi("ChatSessionResponse");

/**
 * Chat error response
 */
export const ChatErrorResponseSchema = z
    .object({
        error: z.string().openapi({
            example: "Message is required",
            description: "Error message",
        }),
    })
    .openapi("ChatErrorResponse");
