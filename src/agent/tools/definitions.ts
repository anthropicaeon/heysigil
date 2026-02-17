/**
 * Agent Tool Definitions
 *
 * Anthropic tool schemas for the Sigil AI agent.
 * Each tool maps to an ActionIntent via TOOL_TO_INTENT.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { ActionIntent } from "../types.js";

// ─── Tool definitions ───────────────────────────────────────

export const TOOLS: Anthropic.Tool[] = [
    {
        name: "swap_tokens",
        description:
            "Exchange one token for another on a blockchain. Use this when the user wants to swap, trade, or exchange tokens. Always confirm the details with the user before calling this.",
        input_schema: {
            type: "object" as const,
            properties: {
                fromToken: { type: "string", description: "Token symbol to sell (e.g. ETH, USDC)" },
                toToken: { type: "string", description: "Token symbol to buy (e.g. USDC, DEGEN)" },
                amount: { type: "string", description: "Amount to swap as a string (e.g. '0.1')" },
                chain: {
                    type: "string",
                    description: "Chain to swap on (default: base)",
                    enum: ["base", "ethereum", "polygon", "arbitrum", "optimism"],
                },
            },
            required: ["fromToken", "toToken", "amount"],
        },
    },
    {
        name: "check_balance",
        description:
            "Check the user's wallet balance. Shows ETH and token balances. Use this when the user asks about their balance, funds, portfolio, or how much they have.",
        input_schema: {
            type: "object" as const,
            properties: {
                chain: { type: "string", description: "Chain to check (default: base)" },
                token: {
                    type: "string",
                    description: "Specific token to check (optional — omit for all)",
                },
            },
            required: [],
        },
    },
    {
        name: "get_price",
        description:
            "Get the current price of a token. Use when the user asks about a token's price, cost, or value.",
        input_schema: {
            type: "object" as const,
            properties: {
                token: { type: "string", description: "Token symbol (e.g. ETH, USDC, DEGEN)" },
            },
            required: ["token"],
        },
    },
    {
        name: "verify_project",
        description:
            "Start verifying ownership of a project. Use when the user wants to verify, claim, or stamp their Sigil for a project. Pass the link exactly as the user provided it.",
        input_schema: {
            type: "object" as const,
            properties: {
                link: {
                    type: "string",
                    description:
                        "Project URL or identifier (e.g. 'https://github.com/org/repo', 'mysite.dev', '@handle')",
                },
            },
            required: ["link"],
        },
    },
    {
        name: "launch_token",
        description: `Deploy a new token on Base for a project. Always call with confirmed=false first to show a preview. Only set confirmed=true after user explicitly confirms.`,
        input_schema: {
            type: "object" as const,
            properties: {
                name: {
                    type: "string",
                    description: "Token name (optional — auto-generated from link)",
                },
                symbol: {
                    type: "string",
                    description: "Token ticker (optional — auto-generated)",
                },
                description: { type: "string", description: "Brief project description" },
                isSelfLaunch: {
                    type: "boolean",
                    description: "true if launching own project, false if for someone else",
                },
                devLinks: {
                    type: "array",
                    items: { type: "string" },
                    description: "Project links — GitHub, website, socials",
                },
                confirmed: {
                    type: "boolean",
                    description:
                        "false = show preview, true = deploy on-chain. Always false on first call.",
                },
            },
            required: ["devLinks"],
        },
    },
    {
        name: "send_tokens",
        description:
            "Send tokens to an Ethereum address. Always confirm the recipient address and amount with the user before calling this.",
        input_schema: {
            type: "object" as const,
            properties: {
                token: { type: "string", description: "Token to send (e.g. ETH, USDC)" },
                amount: { type: "string", description: "Amount to send" },
                toAddress: { type: "string", description: "Recipient wallet address (0x...)" },
                chain: { type: "string", description: "Chain (default: base)" },
            },
            required: ["token", "amount", "toAddress"],
        },
    },
    {
        name: "claim_reward",
        description:
            "Claim pool rewards for a verified project. Use when the user wants to claim their earnings or rewards.",
        input_schema: {
            type: "object" as const,
            properties: {
                projectId: { type: "string", description: "Project identifier" },
            },
            required: ["projectId"],
        },
    },
    {
        name: "pool_status",
        description:
            "Check the pool reward status for a project. Use when asking about pool performance, rewards, or earnings.",
        input_schema: {
            type: "object" as const,
            properties: {
                projectId: { type: "string", description: "Project identifier or link" },
            },
            required: ["projectId"],
        },
    },
    {
        name: "create_wallet",
        description:
            "Create a new wallet for the user. Use when the user asks to create a wallet or when they need one for transactions.",
        input_schema: {
            type: "object" as const,
            properties: {},
            required: [],
        },
    },
    {
        name: "export_key",
        description:
            "Export the private key for the user's wallet. This is a sensitive 2-step process: first request, then confirm. Use when the user explicitly asks to export or backup their private key.",
        input_schema: {
            type: "object" as const,
            properties: {
                action: {
                    type: "string",
                    enum: ["request", "confirm"],
                    description: "Step: 'request' to initiate, 'confirm' to complete the export",
                },
            },
            required: ["action"],
        },
    },
    {
        name: "get_transaction_history",
        description:
            "Get recent transaction history for the user's wallet. Use when the user asks about their transactions, activity, or recent transfers.",
        input_schema: {
            type: "object" as const,
            properties: {
                limit: {
                    type: "number",
                    description: "Number of transactions to return (default: 10, max: 25)",
                },
            },
            required: [],
        },
    },
];

// ─── Tool name → intent mapping ─────────────────────────────

export const TOOL_TO_INTENT: Record<string, ActionIntent> = {
    swap_tokens: "swap",
    check_balance: "balance",
    get_price: "price",
    verify_project: "verify_project",
    launch_token: "launch_token",
    send_tokens: "send",
    claim_reward: "claim_reward",
    pool_status: "pool_status",
    create_wallet: "deposit", // reuse deposit handler for wallet creation
    export_key: "export_key",
    get_transaction_history: "history",
};
