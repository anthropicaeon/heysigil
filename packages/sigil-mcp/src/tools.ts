import type { SigilClient } from "@heysigil/sigil-sdk";
import type { ToolDescriptor } from "./types.js";

const launchListSchema = {
    type: "object",
    properties: {
        limit: { type: "number" },
        offset: { type: "number" },
        q: { type: "string" },
        platform: { type: "string" },
        sort: { type: "string", enum: ["newest", "oldest"] },
    },
};

export function createTools(client: SigilClient): ToolDescriptor[] {
    return [
        {
            name: "sigil_verify_create_challenge",
            description: "Create a verification challenge for a project/channel.",
            inputSchema: {
                type: "object",
                properties: {
                    method: { type: "string" },
                    projectId: { type: "string" },
                    walletAddress: { type: "string" },
                },
                required: ["method", "projectId", "walletAddress"],
            },
            requiredScopes: ["verify:write"],
            handler: async (input) => client.verify.createChallenge(input as never),
        },
        {
            name: "sigil_verify_check",
            description: "Check verification status by verification ID.",
            inputSchema: {
                type: "object",
                properties: {
                    verificationId: { type: "string" },
                    tweetProof: { type: "object" },
                },
                required: ["verificationId"],
            },
            requiredScopes: ["verify:write"],
            handler: async (input) => client.verify.check(input as never),
        },
        {
            name: "sigil_dashboard_overview",
            description: "Get dashboard overview (wallet, projects, fees).",
            inputSchema: {
                type: "object",
                properties: {},
            },
            requiredScopes: ["dashboard:read"],
            handler: async () => client.dashboard.overview(),
        },
        {
            name: "sigil_chat_message",
            description: "Send a message through Sigil chat API.",
            inputSchema: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    sessionId: { type: "string" },
                    walletAddress: { type: "string" },
                    agentId: { type: "string" },
                },
                required: ["message"],
            },
            requiredScopes: ["chat:write"],
            handler: async (input) => client.chat.send(input as never),
        },
        {
            name: "sigil_chat_history",
            description: "Get chat session history and message metadata.",
            inputSchema: {
                type: "object",
                properties: {
                    sessionId: { type: "string" },
                    limit: { type: "number" },
                    offset: { type: "number" },
                    includeDeleted: { type: "boolean" },
                },
                required: ["sessionId"],
            },
            requiredScopes: ["chat:write"],
            handler: async (input) => {
                const args = (input || {}) as {
                    sessionId: string;
                    limit?: number;
                    offset?: number;
                    includeDeleted?: boolean;
                };
                return client.chat.session(args.sessionId, {
                    limit: args.limit,
                    offset: args.offset,
                    includeDeleted: args.includeDeleted,
                });
            },
        },
        {
            name: "sigil_chat_agent_feed",
            description: "Get aggregated agent-origin chat messages for the authenticated user.",
            inputSchema: {
                type: "object",
                properties: {
                    limit: { type: "number" },
                },
            },
            requiredScopes: ["chat:write"],
            handler: async (input) => {
                const args = (input || {}) as { limit?: number };
                return client.chat.agentFeed(args.limit);
            },
        },
        {
            name: "sigil_chat_delete_message",
            description: "Soft-delete a message from a chat session.",
            inputSchema: {
                type: "object",
                properties: {
                    sessionId: { type: "string" },
                    messageId: { type: "string" },
                    reason: { type: "string" },
                },
                required: ["sessionId", "messageId"],
            },
            requiredScopes: ["chat:write"],
            handler: async (input) => client.chat.deleteMessage(input as never),
        },
        {
            name: "sigil_chat_upvote_message",
            description: "Upvote a message in a chat session.",
            inputSchema: {
                type: "object",
                properties: {
                    sessionId: { type: "string" },
                    messageId: { type: "string" },
                },
                required: ["sessionId", "messageId"],
            },
            requiredScopes: ["chat:write"],
            handler: async (input) => {
                const args = input as { sessionId: string; messageId: string };
                return client.chat.upvote(args.sessionId, args.messageId);
            },
        },
        {
            name: "sigil_chat_downvote_message",
            description: "Downvote a message in a chat session.",
            inputSchema: {
                type: "object",
                properties: {
                    sessionId: { type: "string" },
                    messageId: { type: "string" },
                },
                required: ["sessionId", "messageId"],
            },
            requiredScopes: ["chat:write"],
            handler: async (input) => {
                const args = input as { sessionId: string; messageId: string };
                return client.chat.downvote(args.sessionId, args.messageId);
            },
        },
        {
            name: "sigil_launch_list",
            description: "List launched tokens/projects.",
            inputSchema: launchListSchema,
            requiredScopes: ["launch:read"],
            handler: async (input) => client.launch.list((input || {}) as never),
        },
        {
            name: "sigil_launch_create",
            description: "Create a token launch for project links.",
            inputSchema: {
                type: "object",
                properties: {
                    devLinks: { type: "array", items: { type: "string" } },
                    name: { type: "string" },
                    symbol: { type: "string" },
                    description: { type: "string" },
                    sessionId: { type: "string" },
                },
                required: ["devLinks"],
            },
            requiredScopes: ["launch:write"],
            handler: async (input) => client.launch.create(input as never),
        },
        {
            name: "sigil_developers_info",
            description: "Get Sigil developers/product capability information.",
            inputSchema: {
                type: "object",
                properties: {},
            },
            requiredScopes: ["developers:read"],
            handler: async () => client.developers.info(),
        },
        {
            name: "sigil_governance_list",
            description: "List governance proposals (placeholder until backend governance API exists).",
            inputSchema: {
                type: "object",
                properties: {},
            },
            requiredScopes: ["governance:read"],
            handler: async () => ({
                status: "not_implemented",
                message:
                    "Governance MCP actions are not implemented yet. Governance backend APIs are pending.",
            }),
        },
        {
            name: "sigil_governance_vote",
            description: "Vote on a governance proposal (placeholder until backend governance API exists).",
            inputSchema: {
                type: "object",
                properties: {
                    proposalId: { type: "string" },
                    support: { type: "boolean" },
                    comment: { type: "string" },
                },
                required: ["proposalId", "support"],
            },
            requiredScopes: ["governance:write"],
            handler: async () => ({
                status: "not_implemented",
                message:
                    "Governance voting MCP action is not implemented yet. Governance backend APIs are pending.",
            }),
        },
    ];
}
