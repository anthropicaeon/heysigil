import type { ChatSession, ActionResult } from "./types.js";
import { parseLocalMessage } from "./local-parser.js";
import { executeAction } from "./router.js";
import type { ParsedAction } from "./types.js";
import { getErrorMessage } from "../utils/errors.js";
import { randomBytes } from "node:crypto";
import { createDayTTLMap } from "../utils/ttl-map.js";
import { buildOptimizedContext } from "./context-manager.js";
import { TOOLS, TOOL_TO_INTENT, mapToolParams, validateToolInput } from "./tools/index.js";
import { getDefaultProvider, type LLMProvider, type LLMMessage } from "./providers/index.js";
import { AGENT_SYSTEM_PROMPT } from "./system-prompt.js";

// Chat sessions auto-expire after 24 hours of inactivity
const sessions = createDayTTLMap<ChatSession>({
    name: "chat-sessions",
});

// ─── Session management ─────────────────────────────────────

export function createSession(platform: ChatSession["platform"] = "web"): ChatSession {
    const session: ChatSession = {
        id: randomBytes(16).toString("hex"),
        platform,
        messages: [],
        createdAt: new Date(),
    };
    sessions.set(session.id, session);
    return session;
}

export function getSession(sessionId: string): ChatSession | undefined {
    return sessions.get(sessionId);
}

// ─── Tool execution helpers ─────────────────────────────────

const MAX_ITERATIONS = 5;

interface ToolIterationResult {
    assistantMessage: string;
    done: boolean;
}

/**
 * Execute a single tool iteration: call LLM, execute any tools, return results.
 */
async function executeSingleToolIteration(
    provider: LLMProvider,
    contextMessages: LLMMessage[],
    userMessage: string,
    sessionId: string,
    systemPrompt: string,
): Promise<ToolIterationResult> {
    const response = await provider.generateResponse({
        messages: contextMessages,
        systemPrompt,
        tools: TOOLS,
        maxTokens: 1024,
    });

    const textBlocks = response.content.filter((b) => b.type === "text");
    const toolBlocks = response.content.filter((b) => b.type === "tool_use");

    // Extract text from response
    const extractedText = textBlocks
        .map((b) => (b.type === "text" ? b.text : ""))
        .join("\n")
        .trim();

    // No tool calls = final response
    if (toolBlocks.length === 0) {
        return { assistantMessage: extractedText, done: true };
    }

    // Execute each tool call
    const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];
    for (const block of toolBlocks) {
        if (block.type !== "tool_use") continue;

        const intent = TOOL_TO_INTENT[block.name] || "unknown";
        const validatedInput = validateToolInput(block.name, block.input);
        const params = mapToolParams(block.name, validatedInput);
        const action: ParsedAction = { intent, params, confidence: 1.0, rawText: userMessage };

        let result: ActionResult;
        try {
            result = await executeAction(action, userMessage, sessionId);
        } catch (err) {
            result = {
                success: false,
                message: `Tool error: ${getErrorMessage(err, "unknown error")}`,
            };
        }

        toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: JSON.stringify({
                success: result.success,
                message: result.message,
                data: result.data,
            }),
        });
    }

    // Feed results back for next iteration
    contextMessages.push({ role: "assistant", content: response.content });
    contextMessages.push({ role: "user", content: toolResults });

    // Check for early termination
    if (extractedText && response.stopReason === "end_turn") {
        return { assistantMessage: extractedText, done: true };
    }

    return { assistantMessage: "", done: false };
}

/**
 * Execute online mode with LLM + tool-use loop.
 */
async function executeOnlineMode(
    provider: LLMProvider,
    session: ChatSession,
    userMessage: string,
    sessionId: string,
    systemPrompt: string,
): Promise<string> {
    const contextResult = buildOptimizedContext(session.messages, {
        recentWindowSize: 6,
        maxContextTokens: 4000,
        maxToolResultChars: 500,
        includeSummary: true,
    });

    const contextMessages: LLMMessage[] = contextResult.messages;
    let assistantMessage = "";

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const result = await executeSingleToolIteration(
            provider,
            contextMessages,
            userMessage,
            sessionId,
            systemPrompt,
        );
        if (result.done || result.assistantMessage) {
            assistantMessage = result.assistantMessage;
            break;
        }
    }

    return assistantMessage || "I ran into an issue processing that. Could you try again?";
}

/**
 * Execute offline mode with regex parser fallback.
 */
async function executeOfflineMode(
    userMessage: string,
    sessionId: string,
): Promise<{ message: string; action: ParsedAction }> {
    const action = parseLocalMessage(userMessage);

    if (action.intent !== "unknown" && action.confidence >= 0.3) {
        const result = await executeAction(action, userMessage, sessionId);
        return { message: result.message, action };
    }

    const message = [
        "👋 Hey! I'm Sigil — funding for builders, without the weight of running a community.",
        "",
        "Try something like:",
        '• **"price ETH"** — check token prices',
        '• **"swap 0.1 ETH to USDC"** — swap tokens',
        '• **"verify github.com/org/repo"** — prove you own a project',
        '• **"launch token for github.com/org/repo"** — deploy a token',
        '• **"help"** — see all commands',
    ].join("\n");

    return { message, action };
}

// ─── Main entry point ───────────────────────────────────────

/**
 * Configuration for message processing
 */
export interface ProcessMessageConfig {
    /** Custom LLM provider (defaults to Anthropic) */
    provider?: LLMProvider;
    /** Custom system prompt (defaults to AGENT_SYSTEM_PROMPT) */
    systemPrompt?: string;
}

/**
 * Process a user message through the contextual agent pipeline.
 *
 * Online mode (provider available):
 *   Single LLM call with tool-use. Claude decides when to invoke tools
 *   based on the full conversation history. Supports multi-step chains.
 *
 * Offline mode (no provider/API key):
 *   Falls back to regex parser + direct responses.
 */
export async function processMessage(
    sessionId: string,
    userMessage: string,
    walletAddress?: string,
    config: ProcessMessageConfig = {},
): Promise<string> {
    let session = sessions.get(sessionId);
    if (!session) {
        session = createSession();
        sessions.set(sessionId, session);
    }

    if (walletAddress) {
        session.walletAddress = walletAddress;
    }

    session.messages.push({ role: "user", content: userMessage, timestamp: new Date() });

    const provider = config.provider ?? getDefaultProvider();
    const systemPrompt = config.systemPrompt ?? AGENT_SYSTEM_PROMPT;

    if (provider.isAvailable()) {
        const assistantMessage = await executeOnlineMode(
            provider,
            session,
            userMessage,
            sessionId,
            systemPrompt,
        );
        session.messages.push({
            role: "assistant",
            content: assistantMessage,
            timestamp: new Date(),
        });
        return assistantMessage;
    }

    const { message, action } = await executeOfflineMode(userMessage, sessionId);
    session.messages.push({ role: "assistant", content: message, timestamp: new Date(), action });
    return message;
}
