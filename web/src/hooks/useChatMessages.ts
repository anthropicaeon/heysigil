"use client";

/**
 * Chat Messages Hook
 *
 * Manages chat messages state, sending, and session handling.
 * Supports both simple text and multi-part AI responses with tools, reasoning, and sources.
 */

import { useCallback, useState } from "react";

import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import type { MessagePart, MultiStepToolUIMessage } from "@/lib/chat-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Legacy simple message (for backwards compatibility)
export interface Message {
    role: "user" | "assistant";
    content: string;
}

const INITIAL_MESSAGE: MultiStepToolUIMessage = {
    id: "initial",
    role: "assistant",
    parts: [{
        type: "text",
        text: "Hey. I'm Sigil — here to help you stamp projects, launch tokens, and trade crypto.\n\nNeed something?",
    }],
};

// Legacy interface for backwards compatibility
interface UseChatMessagesResult {
    messages: Message[];
    loading: boolean;
    sessionId: string | null;
    sendMessage: (text: string) => Promise<void>;
}

// New interface with multi-part message support
interface UseMultiStepChatResult {
    messages: MultiStepToolUIMessage[];
    status: "ready" | "streaming" | "submitted";
    sessionId: string | null;
    sendMessage: (text: string) => Promise<void>;
}

/**
 * Multi-step chat hook with full AI features support.
 * Handles tool calls, reasoning, sources, and multi-part responses.
 */
export function useMultiStepChat(initialSessionId: string | null = null): UseMultiStepChatResult {
    const [messages, setMessages] = useState<MultiStepToolUIMessage[]>([INITIAL_MESSAGE]);
    const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
    const [status, setStatus] = useState<"ready" | "streaming" | "submitted">("ready");

    const privy = useOptionalPrivy();
    const isAuthenticated = privy?.authenticated ?? false;
    const privyUserId = privy?.user?.id ?? null;

    const effectiveSessionId = privyUserId || sessionId;

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || status !== "ready") return;

            const userMessage: MultiStepToolUIMessage = {
                id: Date.now().toString(),
                role: "user",
                parts: [{ type: "text", text: trimmed }],
            };

            setMessages((prev) => [...prev, userMessage]);
            setStatus("submitted");

            try {
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };

                if (isAuthenticated && privy?.getAccessToken) {
                    const token = await privy.getAccessToken();
                    if (token) {
                        headers["Authorization"] = `Bearer ${token}`;
                    }
                }

                setStatus("streaming");

                const res = await fetch(`${API_BASE}/api/chat`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        message: trimmed,
                        sessionId: effectiveSessionId,
                    }),
                });

                const data = await res.json();

                if (data.sessionId) {
                    setSessionId(data.sessionId);
                }

                // Handle multi-part response (rich AI features)
                if (data.parts && Array.isArray(data.parts)) {
                    const assistantMessage: MultiStepToolUIMessage = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        parts: data.parts,
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                }
                // Handle response with embedded tools/reasoning
                else if (data.response && typeof data.response === "object") {
                    const parts: MessagePart[] = [];

                    if (data.response.reasoning) {
                        parts.push({ type: "reasoning", text: data.response.reasoning });
                    }

                    if (data.response.tools && Array.isArray(data.response.tools)) {
                        for (const tool of data.response.tools) {
                            if (tool.type?.startsWith("tool-")) {
                                parts.push(tool as MessagePart);
                            }
                        }
                    }

                    if (data.response.sources && Array.isArray(data.response.sources)) {
                        for (const source of data.response.sources) {
                            parts.push({ type: "source-url", url: source });
                        }
                    }

                    if (data.response.text || data.response.answer) {
                        parts.push({ type: "text", text: data.response.text || data.response.answer });
                    }

                    const assistantMessage: MultiStepToolUIMessage = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        parts: parts.length > 0 ? parts : [{ type: "text", text: JSON.stringify(data.response) }],
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                }
                // Handle simple text response
                else if (data.response) {
                    const assistantMessage: MultiStepToolUIMessage = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        parts: [{ type: "text", text: data.response }],
                    };
                    setMessages((prev) => [...prev, assistantMessage]);
                }
                // Handle error
                else {
                    const errorMessage: MultiStepToolUIMessage = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        parts: [{ type: "text", text: data.error || "Something went wrong." }],
                    };
                    setMessages((prev) => [...prev, errorMessage]);
                }
            } catch {
                const errorMessage: MultiStepToolUIMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    parts: [{
                        type: "text",
                        text: `Connection error. Is the backend running at ${API_BASE}?`,
                    }],
                };
                setMessages((prev) => [...prev, errorMessage]);
            } finally {
                setStatus("ready");
            }
        },
        [status, isAuthenticated, privy, effectiveSessionId],
    );

    return {
        messages,
        status,
        sessionId: effectiveSessionId,
        sendMessage,
    };
}

/**
 * Legacy chat hook (simple text messages only).
 * @deprecated Use useMultiStepChat for full AI features.
 */
export function useChatMessages(initialSessionId: string | null = null): UseChatMessagesResult {
    const { messages: multiStepMessages, status, sessionId, sendMessage } = useMultiStepChat(initialSessionId);

    // Convert multi-step messages to legacy format
    const messages: Message[] = multiStepMessages.map((msg) => ({
        role: msg.role,
        content: msg.parts
            .filter((p): p is { type: "text"; text: string } => p.type === "text")
            .map((p) => p.text)
            .join("\n"),
    }));

    return {
        messages,
        loading: status !== "ready",
        sessionId,
        sendMessage,
    };
}
