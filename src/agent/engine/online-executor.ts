/**
 * Online Executor
 *
 * Executes online mode with LLM + tool-use loop.
 * Uses Claude for natural language understanding and tool selection.
 */

import type { ChatSession } from "../types.js";
import type { LLMProvider, LLMMessage } from "../providers/index.js";
import { buildOptimizedContext } from "../context-manager.js";
import { executeSingleToolIteration, MAX_ITERATIONS } from "./tool-executor.js";

/**
 * Execute online mode with LLM + tool-use loop.
 */
export async function executeOnlineMode(
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
