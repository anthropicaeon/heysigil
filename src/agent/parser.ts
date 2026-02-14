import Anthropic from "@anthropic-ai/sdk";
import type { ParsedAction, ActionIntent } from "./types.js";
import { getEnv } from "../config/env.js";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const env = getEnv();
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are Sigil, an AI crypto assistant. Parse the user's message into a structured action.

You MUST respond with valid JSON only. No markdown, no explanation, just JSON.

Available actions:
- swap: Exchange one token for another. Params: fromToken, toToken, amount, chain
- bridge: Bridge tokens across chains. Params: token, amount, fromChain, toChain
- send: Send tokens to an address. Params: token, amount, toAddress, chain
- balance: Check wallet balance. Params: chain (optional), token (optional)
- price: Get token price. Params: token
- launch_token: Deploy a new token. Params: name, symbol, description
- verify_project: Start project ownership verification. Params: method (github_oauth|github_file|domain_dns|domain_file|domain_meta|tweet_zktls|facebook_oauth|instagram_graph), projectId
- claim_reward: Claim pool rewards for a verified project. Params: projectId
- pool_status: Check pool reward status. Params: projectId
- help: User needs help or is asking a general question. Params: topic (optional)
- unknown: Cannot determine intent. Params: none

Response format:
{"intent": "swap", "params": {"fromToken": "ETH", "toToken": "USDC", "amount": "0.1", "chain": "base"}, "confidence": 0.95}

Rules:
- Default chain is "base" if not specified
- Token symbols should be uppercase
- Amounts should be strings to preserve precision
- If the user is just chatting or greeting, use "help" intent
- confidence should be 0.0-1.0`;

/**
 * Parse a natural language message into a structured action using Claude.
 */
export async function parseUserMessage(
  message: string,
  conversationContext?: string,
): Promise<ParsedAction> {
  const client = getClient();

  const userPrompt = conversationContext
    ? `Previous context:\n${conversationContext}\n\nNew message: ${message}`
    : message;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 256,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const parsed = JSON.parse(text);

    return {
      intent: parsed.intent as ActionIntent,
      params: parsed.params || {},
      confidence: parsed.confidence || 0.5,
      rawText: message,
    };
  } catch {
    return {
      intent: "unknown",
      params: {},
      confidence: 0,
      rawText: message,
    };
  }
}
