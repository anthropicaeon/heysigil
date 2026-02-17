"use client";

import { useState, useRef, useEffect } from "react";
import PortfolioSidebar from "../../components/PortfolioSidebar";
import { useChatMessages } from "@/hooks/useChatMessages";

const SUGGESTIONS = [
    "show my wallet",
    "swap 0.1 ETH to USDC",
    "what's my balance",
    "verify github.com/my-org/my-repo",
    "help",
];

export default function ChatPage() {
    const { messages, loading, sessionId, sendMessage } = useChatMessages();
    const [input, setInput] = useState("");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Collapse sidebar by default on mobile
    useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarCollapsed(true);
        }
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const text = input.trim();
        if (!text || loading) return;

        setInput("");
        await sendMessage(text);
        inputRef.current?.focus();
    }

    return (
        <div className="chat-layout">
            {/* Chat area */}
            <div className="chat-container">
                {/* Messages */}
                <div className="chat-messages">
                    {!process.env.NEXT_PUBLIC_API_URL && (
                        <p style={{ fontSize: "var(--text-xs)", color: "var(--warning)", margin: "0 0 var(--space-2)", textAlign: "center" }}>
                            Backend not configured (set NEXT_PUBLIC_API_URL). Using http://localhost:3001 — start the backend locally.
                        </p>
                    )}
                    {messages.map((msg, i) => (
                        <div
                            key={`${msg.role}-${i}`}
                            style={{
                                display: "flex",
                                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                            }}
                        >
                            <div
                                className={`chat-bubble ${
                                    msg.role === "user" ? "chat-bubble-user" : "chat-bubble-assistant"
                                }`}
                            >
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div style={{ display: "flex", justifyContent: "flex-start" }}>
                            <div className="typing-indicator">
                                <span />
                                <span />
                                <span />
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSubmit} className="chat-input-area">
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
                sessionId={sessionId}
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
        </div>
    );
}
