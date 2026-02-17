/**
 * Tool Executor
 *
 * Executes a single tool iteration: call LLM, execute any tools, return results.
 */

import type { ActionResult, ParsedAction } from "../types.js";
import { executeAction } from "../router.js";
import { TOOLS, TOOL_TO_INTENT, mapToolParams, validateToolInput } from "../tools/index.js";
import { getErrorMessage } from "../../utils/errors.js";
import type { LLMProvider, LLMMessage } from "../providers/index.js";

export const MAX_ITERATIONS = 5;

export interface ToolIterationResult {
    assistantMessage: string;
    done: boolean;
}

/**
 * Execute a single tool iteration: call LLM, execute any tools, return results.
 */
export async function executeSingleToolIteration(
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
