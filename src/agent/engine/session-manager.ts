/**
 * Session Manager
 *
 * Manages chat sessions with TTL-based expiration.
 * Sessions auto-expire after 24 hours of inactivity.
 */

import type { ChatSession } from "../types.js";
import { randomBytes } from "node:crypto";
import { createDayTTLMap } from "../../utils/ttl-map.js";

// Chat sessions auto-expire after 24 hours of inactivity
const sessions = createDayTTLMap<ChatSession>({
    name: "chat-sessions",
});

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
 * Get an existing session by ID.
 */
export function getSession(sessionId: string): ChatSession | undefined {
    return sessions.get(sessionId);
}

/**
 * Get or create a session.
 */
export function getOrCreateSession(sessionId: string): ChatSession {
    let session = sessions.get(sessionId);
    if (!session) {
        session = createSession();
        sessions.set(sessionId, session);
    }
    return session;
}

/**
 * Update a session's wallet address.
 */
export function setSessionWallet(sessionId: string, walletAddress: string): void {
    const session = sessions.get(sessionId);
    if (session) {
        session.walletAddress = walletAddress;
    }
}

/**
 * Add a message to a session.
 */
export function addMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    action?: ChatSession["messages"][0]["action"],
): void {
    const session = sessions.get(sessionId);
    if (session) {
        session.messages.push({
            role,
            content,
            timestamp: new Date(),
            action,
        });
    }
}
