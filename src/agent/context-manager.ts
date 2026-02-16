/**
 * Context Manager for LLM Message History
 *
 * Implements smart truncation strategies to reduce API costs while preserving
 * essential conversational context. Strategies:
 *
 * 1. Recent window: Keep last N messages with full content
 * 2. Tool result compression: Truncate verbose tool outputs to essentials
 * 3. Token budget: Approximate token counting with configurable limits
 * 4. Old message summarization: Compress ancient history to key facts
 *
 * At $15/MTok for Claude Sonnet, reducing 15K→6K tokens saves ~$0.135/request
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "./types.js";

// ─── Configuration ───────────────────────────────────────────

export interface ContextConfig {
    /** Messages to keep with full content (default: 6) */
    recentWindowSize: number;
    /** Max approximate tokens for context (default: 4000) */
    maxContextTokens: number;
    /** Max chars per tool result before truncation (default: 500) */
    maxToolResultChars: number;
    /** Include summary of older messages (default: true) */
    includeSummary: boolean;
}

const DEFAULT_CONFIG: ContextConfig = {
    recentWindowSize: 6,
    maxContextTokens: 4000,
    maxToolResultChars: 500,
    includeSummary: true,
};

// ─── Token Estimation ────────────────────────────────────────

/**
 * Approximate token count using character-based heuristic.
 * Claude tokenizer averages ~4 chars per token for English text.
 * JSON/code tends to be ~3.5 chars per token.
 */
function estimateTokens(text: string): number {
    if (!text) return 0;
    // Use 3.5 chars/token as conservative estimate for mixed content
    return Math.ceil(text.length / 3.5);
}

function estimateMessageTokens(msg: Anthropic.MessageParam): number {
    if (typeof msg.content === "string") {
        return estimateTokens(msg.content);
    }
    // Content blocks (tool_use, tool_result, text)
    let total = 0;
    for (const block of msg.content) {
        if (block.type === "text") {
            total += estimateTokens(block.text);
        } else if (block.type === "tool_use") {
            total += estimateTokens(JSON.stringify(block.input));
        } else if (block.type === "tool_result") {
            const content =
                typeof block.content === "string" ? block.content : JSON.stringify(block.content);
            total += estimateTokens(content);
        }
    }
    return total;
}

// ─── Tool Result Compression ─────────────────────────────────

interface CompressedToolResult {
    success: boolean;
    summary: string;
    // Preserve critical identifiers
    txHash?: string;
    address?: string;
    amount?: string;
    token?: string;
    error?: string;
}

/**
 * Extract essential info from verbose tool results.
 * Reduces swap quotes, balance dumps, etc. to key facts.
 */
function compressToolResult(content: string, maxChars: number): string {
    // Already small enough
    if (content.length <= maxChars) {
        return content;
    }

    try {
        const data = JSON.parse(content);
        const compressed: CompressedToolResult = {
            success: data.success ?? true,
            summary: "",
        };

        // Extract critical identifiers that must be preserved
        if (data.data?.txHash) compressed.txHash = data.data.txHash;
        if (data.data?.address) compressed.address = data.data.address;
        if (data.data?.walletAddress) compressed.address = data.data.walletAddress;
        if (data.data?.amount) compressed.amount = String(data.data.amount);
        if (data.data?.token) compressed.token = data.data.token;
        if (data.error) compressed.error = data.error;

        // Build concise summary based on data type
        if (data.data?.balances) {
            // Balance check - summarize holdings
            const balances = data.data.balances;
            const nonZero = Object.entries(balances)
                .filter(([_, v]) => Number(v) > 0)
                .map(([k, v]) => `${k}:${v}`)
                .slice(0, 5); // Max 5 tokens
            compressed.summary = `Balances: ${nonZero.join(", ") || "empty"}`;
        } else if (data.data?.quote) {
            // Swap quote - extract key numbers
            const q = data.data.quote;
            compressed.summary = `Quote: ${q.sellAmount || "?"} ${q.sellToken || "?"} → ${q.buyAmount || "?"} ${q.buyToken || "?"}`;
        } else if (data.data?.transactions) {
            // Transaction history - count and summarize
            const txs = data.data.transactions;
            compressed.summary = `${txs.length} transactions`;
        } else if (data.data?.price) {
            // Price check
            compressed.summary = `Price: $${data.data.price}`;
        } else if (data.data?.verificationId) {
            // Verification started
            compressed.summary = `Verification started: ${data.data.method}`;
        } else if (data.message) {
            // Use the message if available, truncated
            compressed.summary = data.message.slice(0, 150);
        }

        const result = JSON.stringify(compressed);
        // If still too long, truncate summary
        if (result.length > maxChars) {
            compressed.summary = compressed.summary.slice(0, 50) + "...";
            return JSON.stringify(compressed);
        }
        return result;
    } catch {
        // Not JSON or parse error - just truncate
        return content.slice(0, maxChars) + "... [truncated]";
    }
}

// ─── Message Compression ─────────────────────────────────────

/**
 * Compress a message's content (primarily tool results).
 */
function compressMessage(
    msg: Anthropic.MessageParam,
    maxToolChars: number,
): Anthropic.MessageParam {
    // String content - don't compress user text
    if (typeof msg.content === "string") {
        return msg;
    }

    // Process content blocks
    const compressedContent = msg.content.map((block) => {
        if (block.type === "tool_result") {
            const content =
                typeof block.content === "string" ? block.content : JSON.stringify(block.content);
            return {
                ...block,
                content: compressToolResult(content, maxToolChars),
            };
        }
        return block;
    });

    return { ...msg, content: compressedContent };
}

// ─── History Summarization ───────────────────────────────────

/**
 * Generate a brief summary of older messages for context.
 * This is a simple extractive summary - not LLM-generated.
 */
function summarizeOldMessages(messages: ChatMessage[]): string {
    if (messages.length === 0) return "";

    const facts: string[] = [];

    for (const msg of messages) {
        if (msg.role === "user") {
            // Extract key user intents
            const text = msg.content.toLowerCase();
            if (text.includes("swap") || text.includes("trade")) {
                facts.push("User performed/discussed swaps");
            } else if (text.includes("balance") || text.includes("portfolio")) {
                facts.push("User checked balances");
            } else if (
                text.includes("verify") ||
                text.includes("claim") ||
                text.includes("stamp")
            ) {
                facts.push("User discussed verification");
            } else if (
                text.includes("launch") ||
                text.includes("deploy") ||
                text.includes("token")
            ) {
                facts.push("User discussed token launch");
            }
        }

        // Extract wallet address mentions
        if (msg.action?.params) {
            const params = msg.action.params as Record<string, unknown>;
            if (params.walletAddress) {
                facts.push(`Wallet: ${params.walletAddress}`);
            }
            if (params.projectId) {
                facts.push(`Project: ${params.projectId}`);
            }
        }
    }

    // Deduplicate and limit
    const uniqueFacts = [...new Set(facts)].slice(0, 5);
    if (uniqueFacts.length === 0) return "";

    return `[Earlier context: ${uniqueFacts.join("; ")}]`;
}

// ─── Main Export ─────────────────────────────────────────────

export interface ContextResult {
    messages: Anthropic.MessageParam[];
    tokenEstimate: number;
    truncatedCount: number;
    summaryIncluded: boolean;
}

/**
 * Build optimized context for Claude API call.
 *
 * Strategy:
 * 1. Keep last N messages with full content
 * 2. Compress tool results in older messages
 * 3. Optionally prepend a summary of ancient history
 * 4. Respect token budget
 */
export function buildOptimizedContext(
    sessionMessages: ChatMessage[],
    config: Partial<ContextConfig> = {},
): ContextResult {
    const cfg = { ...DEFAULT_CONFIG, ...config };

    // No messages = nothing to do
    if (sessionMessages.length === 0) {
        return {
            messages: [],
            tokenEstimate: 0,
            truncatedCount: 0,
            summaryIncluded: false,
        };
    }

    // Split into recent window and older messages
    const recentStart = Math.max(0, sessionMessages.length - cfg.recentWindowSize);
    const olderMessages = sessionMessages.slice(0, recentStart);
    const recentMessages = sessionMessages.slice(recentStart);

    // Convert recent messages to API format (full content)
    const recentApiMessages: Anthropic.MessageParam[] = recentMessages.map((m) => ({
        role: m.role,
        content: m.content,
    }));

    // Calculate recent tokens
    let totalTokens = recentApiMessages.reduce((sum, msg) => sum + estimateMessageTokens(msg), 0);

    // Build result starting with recent messages
    const result: Anthropic.MessageParam[] = [];
    let truncatedCount = 0;
    let summaryIncluded = false;

    // Add older messages with compression (if budget allows)
    const tokenBudgetForOlder = cfg.maxContextTokens - totalTokens - 200; // Reserve 200 for summary

    if (tokenBudgetForOlder > 0 && olderMessages.length > 0) {
        // Convert and compress older messages
        const olderApiMessages: Anthropic.MessageParam[] = olderMessages.map((m) => {
            const apiMsg: Anthropic.MessageParam = {
                role: m.role,
                content: m.content,
            };
            return compressMessage(apiMsg, cfg.maxToolResultChars);
        });

        // Add as many older messages as fit in budget (from most recent to oldest)
        let olderTokens = 0;
        const includedOlder: Anthropic.MessageParam[] = [];

        for (let i = olderApiMessages.length - 1; i >= 0; i--) {
            const msgTokens = estimateMessageTokens(olderApiMessages[i]);
            if (olderTokens + msgTokens <= tokenBudgetForOlder) {
                includedOlder.unshift(olderApiMessages[i]);
                olderTokens += msgTokens;
            } else {
                truncatedCount++;
            }
        }

        result.push(...includedOlder);
        totalTokens += olderTokens;

        // Add summary for very old truncated messages
        if (cfg.includeSummary && truncatedCount > 0) {
            const truncatedMessages = olderMessages.slice(0, truncatedCount);
            const summary = summarizeOldMessages(truncatedMessages);
            if (summary) {
                // Prepend summary as system-style context in first user message
                // (Can't add system messages mid-conversation, so we note it)
                result.unshift({
                    role: "user",
                    content: summary,
                });
                result.unshift({
                    role: "assistant",
                    content: "Understood, continuing from that context.",
                });
                totalTokens += estimateTokens(summary) + 20;
                summaryIncluded = true;
            }
        }
    } else {
        truncatedCount = olderMessages.length;
    }

    // Append recent messages at the end
    result.push(...recentApiMessages);

    return {
        messages: result,
        tokenEstimate: totalTokens,
        truncatedCount,
        summaryIncluded,
    };
}

/**
 * Quick estimate of token savings from optimization.
 */
export function estimateSavings(
    sessionMessages: ChatMessage[],
    config: Partial<ContextConfig> = {},
): { originalTokens: number; optimizedTokens: number; savingsPercent: number } {
    // Original: last 20 messages, full content
    const originalMessages = sessionMessages.slice(-20).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
    }));
    const originalTokens = originalMessages.reduce(
        (sum, msg) => sum + estimateMessageTokens(msg),
        0,
    );

    // Optimized
    const optimized = buildOptimizedContext(sessionMessages, config);

    const savingsPercent =
        originalTokens > 0
            ? Math.round(((originalTokens - optimized.tokenEstimate) / originalTokens) * 100)
            : 0;

    return {
        originalTokens,
        optimizedTokens: optimized.tokenEstimate,
        savingsPercent,
    };
}
