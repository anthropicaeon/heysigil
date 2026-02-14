import { Hono } from "hono";
import { createSession, getSession, processMessage } from "../../agent/engine.js";

const chat = new Hono();

/**
 * POST /api/chat
 * Send a message to the Sigil agent.
 *
 * Body: { message, sessionId?, walletAddress? }
 */
chat.post("/", async (c) => {
  const { message, sessionId, walletAddress } = await c.req.json<{
    message: string;
    sessionId?: string;
    walletAddress?: string;
  }>();

  if (!message?.trim()) {
    return c.json({ error: "Message is required" }, 400);
  }

  // Get or create session
  let sid = sessionId;
  if (!sid) {
    const session = createSession("web");
    sid = session.id;
  }

  try {
    const response = await processMessage(sid, message, walletAddress);

    return c.json({
      sessionId: sid,
      response,
    });
  } catch (err) {
    return c.json(
      { error: err instanceof Error ? err.message : "Agent error" },
      500,
    );
  }
});

/**
 * GET /api/chat/:sessionId
 * Get chat history for a session.
 */
chat.get("/:sessionId", async (c) => {
  const sessionId = c.req.param("sessionId");
  const session = getSession(sessionId);

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  return c.json({
    sessionId: session.id,
    platform: session.platform,
    walletAddress: session.walletAddress,
    messages: session.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })),
  });
});

export { chat };
