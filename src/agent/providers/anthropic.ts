import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, LLMRequestConfig, LLMResponse, ProviderConfig } from "./types.js";
import { getEnv } from "../../config/env.js";
import { loggers } from "../../utils/logger.js";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const DEFAULT_MAX_TOKENS = 1024;

/**
 * Anthropic Claude provider implementation
 */
export class AnthropicProvider implements LLMProvider {
    private client: Anthropic | null = null;
    private model: string;
    private offlineLogged = false;

    constructor(config: ProviderConfig = {}) {
        this.model = config.model ?? DEFAULT_MODEL;

        const apiKey = config.apiKey ?? getEnv().ANTHROPIC_API_KEY;
        if (apiKey) {
            this.client = new Anthropic({ apiKey });
        }
    }

    isAvailable(): boolean {
        if (!this.client && !this.offlineLogged) {
            loggers.agent.info(
                "Chat running in offline mode (no ANTHROPIC_API_KEY) — using local parser",
            );
            this.offlineLogged = true;
        }
        return this.client !== null;
    }

    async generateResponse(config: LLMRequestConfig): Promise<LLMResponse> {
        if (!this.client) {
            throw new Error("Anthropic client not initialized - API key missing");
        }

        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: config.maxTokens ?? DEFAULT_MAX_TOKENS,
            system: config.systemPrompt,
            tools: config.tools,
            messages: config.messages,
        });

        return {
            content: response.content,
            stopReason: response.stop_reason,
        };
    }
}

let _defaultProvider: AnthropicProvider | null = null;

/**
 * Get the default Anthropic provider (singleton)
 */
export function getDefaultProvider(): AnthropicProvider {
    if (!_defaultProvider) {
        _defaultProvider = new AnthropicProvider();
    }
    return _defaultProvider;
}

/**
 * Create a new Anthropic provider with custom config
 */
export function createAnthropicProvider(config: ProviderConfig): AnthropicProvider {
    return new AnthropicProvider(config);
}
