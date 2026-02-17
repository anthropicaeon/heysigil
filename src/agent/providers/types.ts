import type { Tool, ContentBlock, MessageParam } from "@anthropic-ai/sdk/resources/messages";

/**
 * Message format for LLM context.
 * Compatible with Anthropic's MessageParam to avoid type conversion.
 */
export type LLMMessage = MessageParam;

/**
 * Configuration for an LLM request
 */
export interface LLMRequestConfig {
    messages: LLMMessage[];
    systemPrompt: string;
    tools?: Tool[];
    maxTokens?: number;
}

/**
 * Response from an LLM provider
 */
export interface LLMResponse {
    content: ContentBlock[];
    stopReason: string | null;
}

/**
 * Provider interface for LLM integrations.
 * Implementations abstract the specific SDK and model details.
 */
export interface LLMProvider {
    /**
     * Generate a response from the LLM
     */
    generateResponse(config: LLMRequestConfig): Promise<LLMResponse>;

    /**
     * Check if the provider is available (API key configured, etc.)
     */
    isAvailable(): boolean;
}

/**
 * Configuration for creating an LLM provider
 */
export interface ProviderConfig {
    apiKey?: string;
    model?: string;
}
