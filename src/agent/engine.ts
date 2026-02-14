import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, ChatSession, ActionResult } from "./types.js";
import { parseUserMessage } from "./parser.js";
import { executeAction } from "./router.js";
import { getEnv } from "../config/env.js";
import { randomBytes } from "node:crypto";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const env = getEnv();
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const sessions = new Map<string, ChatSession>();

const AGENT_SYSTEM = `You are Sigil, a friendly AI crypto assistant. You help users:
- Trade crypto (swap, bridge, send tokens)
- Verify project ownership (GitHub, domain, tweet, social accounts)
- Claim pool rewards for projects they own
- Launch tokens
- Check prices and balances

Personality: Concise, knowledgeable, slightly witty. You speak in short paragraphs.
Never give financial advice. Always confirm before executing transactions.
When presenting action results, format them clearly.
If the user is just chatting, be friendly and steer them toward what you can help with.`;

/**
 * Create a new chat session.
 */
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

/**
 * Get an existing session or create one.
 */
export function getSession(sessionId: string): ChatSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Process a user message through the agent pipeline:
 * 1. Parse intent via LLM
 * 2. Execute action via router
 * 3. Generate natural language response via LLM
 * 4. Return response
 */
export async function processMessage(
  sessionId: string,
  userMessage: string,
  walletAddress?: string,
): Promise<string> {
  let session = sessions.get(sessionId);
  if (!session) {
    session = createSession();
    sessions.set(sessionId, session);
  }

  if (walletAddress) {
    session.walletAddress = walletAddress;
  }

  // Add user message to history
  session.messages.push({
    role: "user",
    content: userMessage,
    timestamp: new Date(),
  });

  // Build conversation context (last 6 messages)
  const recentContext = session.messages
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  // 1. Parse the intent
  const action = await parseUserMessage(userMessage, recentContext);

  // 2. Execute the action
  let actionResult: ActionResult;
  if (action.confidence >= 0.5 && action.intent !== "unknown") {
    actionResult = await executeAction(action);
  } else {
    actionResult = {
      success: true,
      message: "",
      data: { freeform: true },
    };
  }

  // 3. Generate conversational response
  const client = getClient();
  const contextMessages: Anthropic.MessageParam[] = session.messages.slice(-8).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Add the action result as context for the response
  if (actionResult.message) {
    contextMessages.push({
      role: "user",
      content: `[SYSTEM: Action "${action.intent}" executed. Result: ${actionResult.message}]\n\nRespond naturally to the user, incorporating this result. Don't mention the system message.`,
    });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 512,
    system: AGENT_SYSTEM,
    messages: contextMessages,
  });

  const assistantMessage =
    response.content[0].type === "text"
      ? response.content[0].text
      : "Something went wrong. Try again?";

  // Add assistant response to history
  session.messages.push({
    role: "assistant",
    content: assistantMessage,
    timestamp: new Date(),
    action,
  });

  return assistantMessage;
}
