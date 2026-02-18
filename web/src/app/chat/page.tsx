"use client";

import { ArrowRightLeft, HelpCircle, Send, Shield, Wallet } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

const suggestions = [
    { icon: Wallet, label: "Show my wallet", prompt: "show my wallet" },
    { icon: ArrowRightLeft, label: "Swap 0.1 ETH to USDC", prompt: "swap 0.1 ETH to USDC" },
    { icon: Shield, label: "Verify my GitHub", prompt: "verify my github account" },
    { icon: HelpCircle, label: "How do fees work?", prompt: "how do fees work" },
];

const portfolioTokens = [
    { symbol: "ETH", name: "Ethereum", balance: "2.5", value: "$8,750", color: "#627EEA" },
    { symbol: "USDC", name: "USD Coin", balance: "5,000", value: "$5,000", color: "#2775CA" },
    {
        symbol: "VAULT",
        name: "Vault Protocol",
        balance: "125,000",
        value: "$2,340",
        color: "#627EEA",
    },
];

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            role: "assistant",
            content:
                "Hey! I'm Sigil, your verification and funding assistant. I can help you verify your identity, check your portfolio, swap tokens, or answer questions about the protocol. What would you like to do?",
        },
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input,
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setIsTyping(true);

        // Simulate assistant response
        setTimeout(() => {
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: `I understand you want to "${input}". This feature is coming soon! In the meantime, you can explore the Verify, Dashboard, or Governance pages.`,
            };
            setMessages((prev) => [...prev, assistantMessage]);
            setIsTyping(false);
        }, 1500);
    };

    const handleSuggestion = (prompt: string) => {
        setInput(prompt);
    };

    return (
        <section className="bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r px-0">
                {/* Header */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 px-6 py-4 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <div className="flex items-center gap-3">
                                <Image
                                    src="/logo-sage.png"
                                    alt="Sigil"
                                    width={40}
                                    height={40}
                                    className="rounded"
                                />
                                <div>
                                    <h1 className="text-xl font-semibold text-foreground lowercase">
                                        talk to sigil
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        verification and funding assistant
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="hidden lg:flex w-80 px-6 py-4 items-center">
                            <p className="text-sm text-muted-foreground">your portfolio</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row bg-background">
                    {/* Chat Area */}
                    <div
                        className="flex-1 border-border lg:border-r flex flex-col"
                        style={{ minHeight: "60vh" }}
                    >
                        {/* Messages */}
                        <div className="flex-1 overflow-auto">
                            <div className="divide-y divide-border">
                                {messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={cn(
                                            "px-6 py-4 lg:px-12",
                                            message.role === "user"
                                                ? "bg-primary/5"
                                                : "bg-background",
                                        )}
                                    >
                                        <div className="max-w-2xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                {message.role === "assistant" ? (
                                                    <>
                                                        <Image
                                                            src="/logo-sage.png"
                                                            alt="Sigil"
                                                            width={20}
                                                            height={20}
                                                        />
                                                        <span className="text-sm font-medium text-primary">
                                                            Sigil
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm font-medium text-foreground">
                                                        You
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm leading-relaxed text-foreground">
                                                {message.content}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {isTyping && (
                                    <div className="px-6 py-4 lg:px-12 bg-background">
                                        <div className="max-w-2xl">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Image
                                                    src="/logo-sage.png"
                                                    alt="Sigil"
                                                    width={20}
                                                    height={20}
                                                />
                                                <span className="text-sm font-medium text-primary">
                                                    Sigil
                                                </span>
                                            </div>
                                            <div className="flex gap-1">
                                                <span
                                                    className="w-2 h-2 bg-muted-foreground animate-bounce"
                                                    style={{ animationDelay: "0ms" }}
                                                />
                                                <span
                                                    className="w-2 h-2 bg-muted-foreground animate-bounce"
                                                    style={{ animationDelay: "150ms" }}
                                                />
                                                <span
                                                    className="w-2 h-2 bg-muted-foreground animate-bounce"
                                                    style={{ animationDelay: "300ms" }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Suggestions */}
                        {messages.length === 1 && (
                            <div className="border-border border-t">
                                <div className="px-6 py-3 lg:px-12 border-border border-b bg-secondary/30">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Try these
                                    </p>
                                </div>
                                <div className="divide-y divide-border">
                                    {suggestions.map((suggestion) => (
                                        <button
                                            key={suggestion.label}
                                            type="button"
                                            onClick={() => handleSuggestion(suggestion.prompt)}
                                            className="w-full flex items-center gap-3 px-6 py-3 lg:px-12 text-sm hover:bg-secondary/30 transition-colors text-left"
                                        >
                                            <suggestion.icon className="size-4 text-primary" />
                                            <span className="text-foreground">
                                                {suggestion.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <div className="border-t border-border px-6 py-4 lg:px-12">
                            <div className="max-w-2xl flex gap-3">
                                <Input
                                    placeholder="Ask Sigil anything..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    className="flex-1"
                                />
                                <Button onClick={handleSend} disabled={!input.trim()}>
                                    <Send className="size-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Portfolio Sidebar */}
                    <div className="hidden lg:block w-80">
                        {/* Token List */}
                        {portfolioTokens.map((token) => (
                            <div
                                key={token.symbol}
                                className="flex items-center gap-3 px-6 py-4 border-border border-b hover:bg-secondary/20 transition-colors"
                            >
                                <div
                                    className="size-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                                    style={{ backgroundColor: token.color }}
                                >
                                    {token.symbol.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground text-sm">
                                        {token.symbol}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{token.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-foreground text-sm">
                                        {token.balance}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{token.value}</p>
                                </div>
                            </div>
                        ))}

                        {/* Total Value */}
                        <div className="px-6 py-4 border-border border-b bg-primary/5">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Total Value
                            </p>
                            <p className="text-2xl font-bold text-primary">$16,090</p>
                        </div>

                        {/* Quick Links */}
                        <div className="px-6 py-4">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
                                Quick Links
                            </p>
                            <div className="space-y-2">
                                <Link
                                    href="/dashboard"
                                    className="block text-sm text-foreground hover:text-primary transition-colors"
                                >
                                    View Dashboard
                                </Link>
                                <Link
                                    href="/verify"
                                    className="block text-sm text-foreground hover:text-primary transition-colors"
                                >
                                    Add Verification
                                </Link>
                                <Link
                                    href="/governance"
                                    className="block text-sm text-foreground hover:text-primary transition-colors"
                                >
                                    Vote on Proposals
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
