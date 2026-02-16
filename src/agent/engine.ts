import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, ChatSession, ActionResult } from "./types.js";
import { parseUserMessage } from "./parser.js";
import { parseLocalMessage } from "./local-parser.js";
import { executeAction } from "./router.js";
import { getEnv } from "../config/env.js";
import { randomBytes } from "node:crypto";

let _client: Anthropic | null = null;
let _offlineMode = false;

function getClient(): Anthropic | null {
  const env = getEnv();
  if (!env.ANTHROPIC_API_KEY) {
    if (!_offlineMode) {
      console.log("⚡ Chat running in offline mode (no ANTHROPIC_API_KEY) — using local parser");
      _offlineMode = true;
    }
    return null;
  }
  if (!_client) {
    _client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return _client;
}

const sessions = new Map<string, ChatSession>();

const AGENT_SYSTEM = `You are Sigil, an AI crypto assistant for developers.

Sigil's core idea: Crypto users deploy tokens about dev projects. The developer stamps
their Sigil (on-chain seal of approval) to earn USDC fees from LP activity, while their
native tokens remain locked. The community votes on milestones to unlock those tokens.
Devs get funded without running a coin community. They stamp their approval, earn fees,
and keep building.

You help users:
- Stamp their Sigil (verify project ownership via GitHub, domain, tweet, social)
- Earn USDC fees from LP activity on stamped projects
- Trade crypto (swap, bridge, send tokens)
- Check pool status, prices, and balances
- Launch tokens for projects

LINK HANDLING:
Users will provide links in many formats. You handle ALL of these naturally:
- GitHub: "https://github.com/org/repo", "github.com/org/repo", "org/repo"
- Instagram: "https://instagram.com/handle", "@handle"
- Twitter/X: "https://x.com/handle", "https://twitter.com/handle", "@handle"
- Websites: "https://mysite.dev", "mysite.dev"

TOKEN LAUNCH FLOW:
When a user wants to launch a token, ALWAYS ask for developer links if they haven't
provided any. These links identify the dev who can stamp their Sigil and earn fees.
The stamp is the critical piece — without it, there's no verified dev earning fees.

Example: "I want to launch a token for this cool project"
→ Ask: "What's the project link? A GitHub repo, Instagram, or website works."

VERIFICATION FLOW:
When a user wants to verify/claim/stamp, just ask them to paste their link.
The system auto-detects the platform. GitHub is the most common.

Personality: Concise, knowledgeable, builder-friendly. You speak in short paragraphs.
Never give financial advice. Always confirm before executing transactions.
When explaining Sigil, emphasize: "Funding without the weight of handling a community."
The stamp is their seal of approval — not a commitment to run a community.`;

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
 * Process a user message through the agent pipeline.
 *
 * Online mode (ANTHROPIC_API_KEY set):
 *   1. Parse intent via LLM → 2. Execute action → 3. Generate response via LLM
 *
 * Offline mode (no ANTHROPIC_API_KEY):
 *   1. Parse intent via regex → 2. Execute action → 3. Return action result directly
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

  const client = getClient();

  // ─── Online mode (LLM-powered) ────────────────────
  if (client) {
    const recentContext = session.messages
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");

    const action = await parseUserMessage(userMessage, recentContext);

    let actionResult: ActionResult;
    if (action.confidence >= 0.5 && action.intent !== "unknown") {
      actionResult = await executeAction(action, userMessage, sessionId);
    } else {
      actionResult = { success: true, message: "", data: { freeform: true } };
    }

    const contextMessages: Anthropic.MessageParam[] = session.messages.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

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

    session.messages.push({
      role: "assistant",
      content: assistantMessage,
      timestamp: new Date(),
      action,
    });

    return assistantMessage;
  }

  // ─── Offline mode (regex parser + direct responses) ──
  const action = parseLocalMessage(userMessage);

  let assistantMessage: string;
  if (action.intent !== "unknown" && action.confidence >= 0.3) {
    const result = await executeAction(action, userMessage, sessionId);
    assistantMessage = result.message;
  } else {
    assistantMessage = [
      "👋 Hey! I'm Sigil — funding for builders, without the weight of running a community.",
      "",
      "Try something like:",
      '• **"price ETH"** — check token prices',
      '• **"swap 0.1 ETH to USDC"** — swap tokens',
      '• **"verify github.com/org/repo"** — prove you own a project',
      '• **"launch token for github.com/org/repo"** — deploy a token',
      '• **"help"** — see all commands',
    ].join("\n");
  }

  session.messages.push({
    role: "assistant",
    content: assistantMessage,
    timestamp: new Date(),
    action,
  });

  return assistantMessage;
}
