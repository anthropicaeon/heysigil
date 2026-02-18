"use client";

/**
 * Chat Messages Hook
 *
 * Manages chat messages state, sending, and session handling.
 */

import { useCallback, useState } from "react";

import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import type { ChatApiResponse } from "@/types/chat";
import { isChatSuccess } from "@/types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface Message {
    role: "user" | "assistant";
    content: string;
}

const INITIAL_MESSAGE: Message = {
    role: "assistant",
    content:
        "Hey. I'm Sigil — here to help you stamp projects, launch tokens, and trade crypto.\n\nNeed something?",
};

interface UseChatMessagesResult {
    messages: Message[];
    loading: boolean;
    sessionId: string | null;
    sendMessage: (text: string) => Promise<void>;
}

export function useChatMessages(initialSessionId: string | null = null): UseChatMessagesResult {
    const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
    const [sessionId, setSessionId] = useState<string | null>(initialSessionId);
    const [loading, setLoading] = useState(false);

    const privy = useOptionalPrivy();
    const isAuthenticated = privy?.authenticated ?? false;
    const privyUserId = privy?.user?.id ?? null;

    // Use Privy user ID when authenticated
    const effectiveSessionId = privyUserId || sessionId;

    const sendMessage = useCallback(
        async (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || loading) return;

            setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
            setLoading(true);

            try {
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };

                // Attach Privy auth token if authenticated
                if (isAuthenticated && privy?.getAccessToken) {
                    const token = await privy.getAccessToken();
                    if (token) {
                        headers["Authorization"] = `Bearer ${token}`;
                    }
                }

                const res = await fetch(`${API_BASE}/api/chat`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        message: trimmed,
                        sessionId: effectiveSessionId,
                    }),
                });

                const data: ChatApiResponse = await res.json();

                if (isChatSuccess(data)) {
                    if (!sessionId) {
                        setSessionId(data.sessionId);
                    }
                    setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
                } else {
                    setMessages((prev) => [
                        ...prev,
                        { role: "assistant", content: data.error || "Unknown error" },
                    ]);
                }
            } catch {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "assistant",
                        content: `Connection error. Is the backend running at ${API_BASE}?`,
                    },
                ]);
            } finally {
                setLoading(false);
            }
        },
        [loading, isAuthenticated, privy, effectiveSessionId, sessionId],
    );

    return {
        messages,
        loading,
        sessionId: effectiveSessionId,
        sendMessage,
    };
}
