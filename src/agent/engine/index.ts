/**
 * Agent Engine
 *
 * Main entry point for the contextual agent pipeline.
 * Processes user messages through either online (LLM) or offline (regex) mode.
 */

import type { LLMProvider } from "../providers/index.js";
import { getDefaultProvider } from "../providers/index.js";
import { AGENT_SYSTEM_PROMPT } from "../system-prompt.js";
import {
    getOrCreateSession,
    setSessionWallet,
    addMessage,
    createSession,
    getSession,
} from "./session-manager.js";
import { executeOnlineMode } from "./online-executor.js";
import { executeOfflineMode } from "./offline-executor.js";
import { createWallet } from "../../services/wallet.js";
import { loggers } from "../../utils/logger.js";

// Re-export session management
export { createSession, getSession } from "./session-manager.js";

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
    const session = getOrCreateSession(sessionId);

    // Auto-create a custodial wallet for every chat session (idempotent)
    createWallet(sessionId).catch((err) => {
        loggers.crypto.warn({ sessionId, error: err }, "Auto wallet creation failed");
    });

    if (walletAddress) {
        setSessionWallet(sessionId, walletAddress);
    }

    addMessage(sessionId, "user", userMessage);

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
        addMessage(sessionId, "assistant", assistantMessage);
        return assistantMessage;
    }

    const { message, action } = await executeOfflineMode(userMessage, sessionId);
    addMessage(sessionId, "assistant", message, action);
    return message;
}
