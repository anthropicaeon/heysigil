"use client";

import { useState, useRef, useEffect } from "react";
import PortfolioSidebar from "../../components/PortfolioSidebar";
import type { ChatApiResponse } from "../../types/chat";
import { isChatSuccess } from "../../types/chat";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "show my wallet",
  "swap 0.1 ETH to USDC",
  "what's my balance",
  "verify github.com/my-org/my-repo",
  "help",
];

// Try to get Privy auth — returns null if Privy not configured
function useOptionalPrivy() {
  try {
    // Dynamic import to avoid errors when Privy isn't configured
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePrivy } = require("@privy-io/react-auth");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return usePrivy();
  } catch {
    return null;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey. I'm Sigil — here to help you stamp projects, launch tokens, and trade crypto.\n\nNeed something?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const privy = useOptionalPrivy();
  const isAuthenticated = privy?.authenticated ?? false;
  const privyUserId = privy?.user?.id ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Collapse sidebar by default on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarCollapsed(true);
    }
  }, []);

  // Use Privy user ID as session identifier when authenticated
  const effectiveSessionId = privyUserId || sessionId;

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
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
          message: text,
          sessionId: effectiveSessionId,
        }),
      });

      const data: ChatApiResponse = await res.json();

      if (isChatSuccess(data)) {
        if (!sessionId) {
          setSessionId(data.sessionId);
        }
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      } else {
        // Error response
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "Unknown error" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error. Is the backend running?" },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="chat-layout">
      {/* Chat area */}
      <div className="chat-container">
        {/* Messages */}
        <div className="chat-messages">


          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                className={`chat-bubble ${msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
                  }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="chat-input-area">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={loading}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={!input.trim() || loading}
          >
            Send
          </button>
        </form>
      </div>

      {/* Portfolio sidebar */}
      <PortfolioSidebar
        sessionId={effectiveSessionId}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
    </div>
  );
}
