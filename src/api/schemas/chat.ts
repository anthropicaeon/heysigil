/**
 * Chat API Schemas
 */

import { z } from "@hono/zod-openapi";
import { SessionIdSchema, TimestampSchema, UUIDSchema, WalletAddressSchema } from "./common.js";

export const ChatMessageRequestSchema = z
    .object({
        message: z
            .string()
            .min(1, "Message cannot be empty")
            .max(10000, "Message too long (max 10,000 characters)")
            .openapi({
                example: "How do I verify my GitHub repository?",
                description: "Message to send to the AI agent",
            }),
        sessionId: SessionIdSchema.optional().nullable().openapi({
            description: "Existing session ID to continue conversation",
        }),
        walletAddress: WalletAddressSchema.optional().openapi({
            description: "Optional wallet address context",
        }),
        /**
         * Optional agent reference when message is sent by an MCP-connected runtime.
         * Can be bot row id, botId, or connectionId.
         */
        agentId: z.string().min(1).max(128).optional().openapi({
            description: "Connected agent identifier for presence heartbeat updates",
        }),
    })
    .openapi("ChatMessageRequest");

export const SessionIdParamSchema = z.object({
    sessionId: SessionIdSchema,
});

export const ChatMessageParamSchema = z.object({
    sessionId: SessionIdSchema,
    messageId: UUIDSchema,
});

export const ChatSessionQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(100),
    offset: z.coerce.number().int().min(0).default(0),
    includeDeleted: z.coerce.boolean().default(false),
});

export const ChatAgentFeedQuerySchema = z.object({
    limit: z.coerce.number().int().min(1).max(200).default(120),
});

export const ChatHistoryMessageSchema = z
    .object({
        id: UUIDSchema,
        role: z.enum(["user", "assistant"]).openapi({
            example: "assistant",
            description: "Message sender role",
        }),
        source: z.enum(["user", "assistant", "agent"]).openapi({
            example: "assistant",
            description: "Message source actor",
        }),
        content: z.string().openapi({
            example: "I can help you verify your GitHub repository...",
            description: "Message content",
        }),
        timestamp: TimestampSchema,
        deleted: z.boolean().openapi({
            example: false,
            description: "Whether message has been soft-deleted",
        }),
        deletedAt: TimestampSchema.nullable().openapi({
            description: "Deletion timestamp if deleted",
        }),
        upvotes: z.number().int().nonnegative().openapi({
            example: 3,
            description: "Total upvotes",
        }),
        downvotes: z.number().int().nonnegative().openapi({
            example: 0,
            description: "Total downvotes",
        }),
        myVote: z.enum(["up", "down", "none"]).openapi({
            example: "none",
            description: "Vote from requesting actor context",
        }),
    })
    .openapi("ChatHistoryMessage");

export const ChatPaginationSchema = z
    .object({
        limit: z.number().int().openapi({ example: 100 }),
        offset: z.number().int().openapi({ example: 0 }),
        count: z.number().int().openapi({ example: 12 }),
        total: z.number().int().openapi({ example: 42 }),
        hasMore: z.boolean().openapi({ example: true }),
    })
    .openapi("ChatPagination");

export const ChatMessageResponseSchema = z
    .object({
        sessionId: SessionIdSchema.openapi({
            description: "Session ID for continuing the conversation",
        }),
        response: z.any().openapi({
            description: "AI response payload",
        }),
    })
    .openapi("ChatMessageResponse");

export const ChatSessionResponseSchema = z
    .object({
        sessionId: SessionIdSchema,
        platform: z.string().openapi({
            example: "web",
            description: "Platform where session was created",
        }),
        hasWallet: z.boolean().openapi({
            example: true,
            description: "Whether a wallet address is associated with this session",
        }),
        messages: z.array(ChatHistoryMessageSchema).openapi({
            description: "Chat message history",
        }),
        pagination: ChatPaginationSchema.optional().openapi({
            description: "Pagination metadata when data comes from persistent store",
        }),
    })
    .openapi("ChatSessionResponse");

export const ChatVoteRequestSchema = z
    .object({
        vote: z.enum(["up", "down"]).openapi({
            example: "up",
            description: "Vote direction",
        }),
    })
    .openapi("ChatVoteRequest");

export const ChatVoteResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        messageId: UUIDSchema,
        vote: z.enum(["up", "down"]),
        upvotes: z.number().int().nonnegative().openapi({ example: 2 }),
        downvotes: z.number().int().nonnegative().openapi({ example: 1 }),
    })
    .openapi("ChatVoteResponse");

export const ChatDeleteRequestSchema = z
    .object({
        reason: z.string().max(280).optional().openapi({
            example: "Outdated answer",
            description: "Optional delete reason",
        }),
    })
    .openapi("ChatDeleteRequest");

export const ChatDeleteResponseSchema = z
    .object({
        success: z.boolean().openapi({ example: true }),
        messageId: UUIDSchema,
        deletedAt: TimestampSchema,
    })
    .openapi("ChatDeleteResponse");

export const ChatAgentFeedItemSchema = z
    .object({
        id: UUIDSchema,
        sessionId: SessionIdSchema,
        role: z.enum(["user", "assistant"]),
        source: z.literal("agent"),
        content: z.string(),
        timestamp: TimestampSchema,
    })
    .openapi("ChatAgentFeedItem");

export const ChatAgentFeedResponseSchema = z
    .object({
        messages: z.array(ChatAgentFeedItemSchema),
        limit: z.number().int(),
        count: z.number().int(),
    })
    .openapi("ChatAgentFeedResponse");

export const ChatErrorResponseSchema = z
    .object({
        error: z.string().openapi({
            example: "Message is required",
            description: "Error message",
        }),
    })
    .openapi("ChatErrorResponse");
