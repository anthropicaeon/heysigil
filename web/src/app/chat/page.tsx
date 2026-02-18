"use client";

/**
 * Chat Page
 *
 * Multi-step AI agent chat with border-centric design.
 * Features tool invocations, chain of thought, and portfolio sidebar.
 */

import {
    BrainIcon,
    CheckCircleIcon,
    CopyIcon,
    NewspaperIcon,
    RefreshCcwIcon,
    ScaleIcon,
    SearchIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useCallback, useRef, useState } from "react";
import { toast } from "sonner";

import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";

import { Action, Actions } from "@/components/ai-elements/actions";
import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import { Conversation, ConversationContent } from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
    PromptInput,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { Tool, ToolContent, ToolHeader, ToolInput } from "@/components/ai-elements/tool";
import {
    AnalyzeView,
    DecideView,
    NewsSearchView,
    ProvideAnswerView,
    WebSearchView,
} from "@/components/tool-views";
import type { ChatStatus, MessagePart, MultiStepToolUIMessage } from "@/lib/chat-types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Suggestions for quick actions
const USE_CASES = [
    { title: "Verify GitHub", prompt: "Verify my GitHub account" },
    { title: "Check Portfolio", prompt: "Show my wallet and portfolio" },
    { title: "Swap Tokens", prompt: "Swap 0.1 ETH to USDC" },
    { title: "How Fees Work", prompt: "How do protocol fees work?" },
    { title: "Research AI", prompt: "What are the latest trends in AI?" },
    { title: "Compare DeFi", prompt: "Compare Uniswap vs SushiSwap" },
] as const;

// Portfolio mock data
const portfolioTokens = [
    { symbol: "ETH", name: "Ethereum", balance: "2.5", value: "$8,750", color: "#627EEA" },
    { symbol: "USDC", name: "USD Coin", balance: "5,000", value: "$5,000", color: "#2775CA" },
    { symbol: "SIGIL", name: "Sigil Token", balance: "125,000", value: "$2,340", color: "#627EEA" },
];

// Tool step extraction for Chain of Thought
interface ToolStep {
    icon: typeof SearchIcon;
    label: string;
    description: string;
    status: "complete" | "active" | "pending";
    content?: React.ReactNode;
}

function extractToolSteps(messages: MultiStepToolUIMessage[]): ToolStep[] {
    const steps: ToolStep[] = [];

    for (const message of messages) {
        if (message.role === "assistant" && message.parts) {
            const toolCalls = message.parts.filter((part) => part.type?.startsWith("tool-"));
            toolCalls.forEach((tool, index) => {
                const isLast = index === toolCalls.length - 1;
                const step = getToolStep(tool, isLast);
                if (step) steps.push(step);
            });
        }
    }

    return steps;
}

function getToolStep(tool: MessagePart, isLast: boolean): ToolStep | null {
    const status = isLast ? "active" : "complete";

    if (tool.type === "tool-websearch") {
        return {
            icon: SearchIcon,
            label: "Web Search",
            description: `Searching for: "${tool.input?.query || "Unknown"}"`,
            status,
            content:
                tool.output?.results?.length && tool.output.state === "ready" ? (
                    <ChainOfThoughtSearchResults>
                        {tool.output.results.slice(0, 3).map((result, i) => (
                            <ChainOfThoughtSearchResult key={i}>
                                <a
                                    href={result.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {result.title}
                                </a>
                            </ChainOfThoughtSearchResult>
                        ))}
                    </ChainOfThoughtSearchResults>
                ) : undefined,
        };
    }

    if (tool.type === "tool-news") {
        return {
            icon: NewspaperIcon,
            label: "News Search",
            description: `Searching news for: "${tool.input?.topic || "Unknown"}"`,
            status,
        };
    }

    if (tool.type === "tool-analyze") {
        return {
            icon: BrainIcon,
            label: "Analysis",
            description: `Analyzing: ${tool.input?.problem || "Unknown"}`,
            status,
        };
    }

    if (tool.type === "tool-decide") {
        return {
            icon: ScaleIcon,
            label: "Decision",
            description: `Evaluating ${tool.input?.options?.length || 0} options`,
            status,
        };
    }

    if (tool.type === "tool-provideAnswer") {
        return {
            icon: CheckCircleIcon,
            label: "Final Answer",
            description: "Synthesizing results",
            status,
        };
    }

    return null;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<MultiStepToolUIMessage[]>([
        {
            id: "1",
            role: "assistant",
            parts: [
                {
                    type: "text",
                    text: "Hey. I'm Sigil — here to help you stamp projects, launch tokens, and trade crypto.\n\nNeed something?",
                },
            ],
        },
    ]);
    const [input, setInput] = useState("");
    const [status, setStatus] = useState<ChatStatus>("ready");
    const [sessionId, setSessionId] = useState<string | null>(null);
    const inputRef = useRef(input);
    inputRef.current = input;

    const privy = useOptionalPrivy();

    const handleSubmit = useCallback(
        async (_: unknown, e: FormEvent) => {
            e.preventDefault();
            const message = inputRef.current.trim();
            if (!message || status !== "ready") return;

            const userMessage: MultiStepToolUIMessage = {
                id: Date.now().toString(),
                role: "user",
                parts: [{ type: "text", text: message }],
            };

            setMessages((prev) => [...prev, userMessage]);
            setInput("");
            setStatus("submitted");

            try {
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                };

                // Attach Privy auth token if authenticated
                if (privy?.authenticated && privy?.getAccessToken) {
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
                        message,
                        sessionId,
                    }),
                });

                const data = await res.json();

                if (data.response) {
                    if (data.sessionId) {
                        setSessionId(data.sessionId);
                    }

                    const assistantMessage: MultiStepToolUIMessage = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        parts: [
                            {
                                type: "text",
                                text: data.response,
                            },
                        ],
                    };

                    setMessages((prev) => [...prev, assistantMessage]);
                } else {
                    const errorMessage: MultiStepToolUIMessage = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        parts: [
                            {
                                type: "text",
                                text: data.error || "Something went wrong. Please try again.",
                            },
                        ],
                    };
                    setMessages((prev) => [...prev, errorMessage]);
                }
            } catch {
                const errorMessage: MultiStepToolUIMessage = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    parts: [
                        {
                            type: "text",
                            text: `Connection error. Is the backend running at ${API_BASE}?`,
                        },
                    ],
                };
                setMessages((prev) => [...prev, errorMessage]);
            } finally {
                setStatus("ready");
            }
        },
        [status, sessionId, privy],
    );

    const handleRegenerate = useCallback(() => {
        toast.info("Regenerating response...");
    }, []);

    const hasToolCalls = (message: MultiStepToolUIMessage) =>
        message.role === "assistant" &&
        message.parts.some((part) => part.type?.startsWith("tool-"));

    const hasSources = (message: MultiStepToolUIMessage) =>
        message.role === "assistant" &&
        message.parts.filter((part) => part.type === "source-url").length > 0;

    return (
        <section className="bg-cream relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r px-0">
                {/* Header */}
                <div className="border-border border-b bg-background">
                    <div className="flex flex-col lg:flex-row">
                        <div className="flex-1 px-6 py-4 lg:px-12 border-border border-b lg:border-b-0 lg:border-r">
                            <div className="flex items-center gap-3">
                                <Image src="/logo-sage.png" alt="Sigil" width={40} height={40} />
                                <div>
                                    <h1 className="text-xl font-semibold text-foreground lowercase">
                                        talk to sigil
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        multi-step ai agent
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
                <div
                    className="flex flex-col lg:flex-row bg-background"
                    style={{ minHeight: "70vh" }}
                >
                    {/* Chat Area */}
                    <div className="flex-1 border-border lg:border-r flex flex-col">
                        <Conversation className="flex-1">
                            <ConversationContent>
                                {messages.map((message) => (
                                    <div key={message.id} className="flex flex-col">
                                        {/* Sources */}
                                        {hasSources(message) && (
                                            <Sources>
                                                <SourcesTrigger
                                                    count={
                                                        message.parts.filter(
                                                            (part) => part.type === "source-url",
                                                        ).length
                                                    }
                                                />
                                                {message.parts
                                                    .filter((part) => part.type === "source-url")
                                                    .map((part, i) =>
                                                        part.type === "source-url" ? (
                                                            <SourcesContent key={i}>
                                                                <Source
                                                                    href={part.url}
                                                                    title={part.url}
                                                                />
                                                            </SourcesContent>
                                                        ) : null,
                                                    )}
                                            </Sources>
                                        )}

                                        {/* Chain of Thought */}
                                        {hasToolCalls(message) && (
                                            <div className="mx-6 mb-4 lg:mx-12 max-w-fit">
                                                <ChainOfThought defaultOpen>
                                                    <ChainOfThoughtHeader>
                                                        Agent Reasoning
                                                    </ChainOfThoughtHeader>
                                                    <ChainOfThoughtContent>
                                                        {extractToolSteps([message]).map(
                                                            (step, index) => (
                                                                <ChainOfThoughtStep
                                                                    key={index}
                                                                    icon={step.icon}
                                                                    label={step.label}
                                                                    description={step.description}
                                                                    status={step.status}
                                                                >
                                                                    {step.content}
                                                                </ChainOfThoughtStep>
                                                            ),
                                                        )}
                                                    </ChainOfThoughtContent>
                                                </ChainOfThought>
                                            </div>
                                        )}

                                        {/* Message Parts */}
                                        {message.parts.map((part, partIndex) => {
                                            if (part.type === "text") {
                                                return (
                                                    <Message key={partIndex} from={message.role}>
                                                        <MessageContent>
                                                            <Response>{part.text}</Response>
                                                        </MessageContent>
                                                    </Message>
                                                );
                                            }

                                            if (part.type === "reasoning") {
                                                return (
                                                    <Reasoning
                                                        key={partIndex}
                                                        className="mx-6 lg:mx-12 mt-4"
                                                    >
                                                        <ReasoningContent>
                                                            {part.text}
                                                        </ReasoningContent>
                                                    </Reasoning>
                                                );
                                            }

                                            if (part.type === "tool-websearch") {
                                                return (
                                                    <div
                                                        key={partIndex}
                                                        className="mx-6 lg:mx-12 mb-4 max-w-lg"
                                                    >
                                                        <Tool>
                                                            <ToolHeader
                                                                type={part.type}
                                                                state={part.output?.state}
                                                            />
                                                            <ToolContent>
                                                                <ToolInput
                                                                    input={part.input || {}}
                                                                />
                                                                <div className="p-4">
                                                                    <WebSearchView
                                                                        invocation={part}
                                                                    />
                                                                </div>
                                                            </ToolContent>
                                                        </Tool>
                                                    </div>
                                                );
                                            }

                                            if (part.type === "tool-news") {
                                                return (
                                                    <div
                                                        key={partIndex}
                                                        className="mx-6 lg:mx-12 mb-4 max-w-lg"
                                                    >
                                                        <Tool>
                                                            <ToolHeader
                                                                type={part.type}
                                                                state={part.output?.state}
                                                            />
                                                            <ToolContent>
                                                                <ToolInput
                                                                    input={part.input || {}}
                                                                />
                                                                <div className="p-4">
                                                                    <NewsSearchView
                                                                        invocation={part}
                                                                    />
                                                                </div>
                                                            </ToolContent>
                                                        </Tool>
                                                    </div>
                                                );
                                            }

                                            if (part.type === "tool-analyze") {
                                                return (
                                                    <div
                                                        key={partIndex}
                                                        className="mx-6 lg:mx-12 mb-4 max-w-lg"
                                                    >
                                                        <Tool>
                                                            <ToolHeader
                                                                type={part.type}
                                                                state={part.output?.state}
                                                            />
                                                            <ToolContent>
                                                                <ToolInput
                                                                    input={part.input || {}}
                                                                />
                                                                <div className="p-4">
                                                                    <AnalyzeView
                                                                        invocation={part}
                                                                    />
                                                                </div>
                                                            </ToolContent>
                                                        </Tool>
                                                    </div>
                                                );
                                            }

                                            if (part.type === "tool-decide") {
                                                return (
                                                    <div
                                                        key={partIndex}
                                                        className="mx-6 lg:mx-12 mb-4 max-w-lg"
                                                    >
                                                        <Tool>
                                                            <ToolHeader
                                                                type={part.type}
                                                                state={part.output?.state}
                                                            />
                                                            <ToolContent>
                                                                <ToolInput
                                                                    input={part.input || {}}
                                                                />
                                                                <div className="p-4">
                                                                    <DecideView invocation={part} />
                                                                </div>
                                                            </ToolContent>
                                                        </Tool>
                                                    </div>
                                                );
                                            }

                                            if (part.type === "tool-provideAnswer") {
                                                return (
                                                    <Message key={partIndex} from={message.role}>
                                                        <MessageContent>
                                                            <ProvideAnswerView invocation={part} />
                                                        </MessageContent>
                                                    </Message>
                                                );
                                            }

                                            return null;
                                        })}

                                        {/* Actions for assistant messages */}
                                        {message.role === "assistant" && (
                                            <Actions>
                                                <Action label="Retry" onClick={handleRegenerate}>
                                                    <RefreshCcwIcon className="size-3" />
                                                </Action>
                                                <Action
                                                    label="Copy"
                                                    onClick={() => {
                                                        const text = message.parts
                                                            .filter((p) => p.type === "text")
                                                            .map(
                                                                (p) => (p as { text: string }).text,
                                                            )
                                                            .join("\n");
                                                        navigator.clipboard.writeText(text);
                                                        toast.success("Copied to clipboard");
                                                    }}
                                                >
                                                    <CopyIcon className="size-3" />
                                                </Action>
                                            </Actions>
                                        )}
                                    </div>
                                ))}

                                {/* Loading indicator */}
                                {status === "submitted" && (
                                    <div className="px-6 py-8 lg:px-12 flex items-center justify-center">
                                        <Loader />
                                    </div>
                                )}
                            </ConversationContent>
                        </Conversation>

                        {/* Suggestions */}
                        {messages.length === 1 && (
                            <div className="border-border border-t">
                                <div className="px-6 py-2 lg:px-12 border-border border-b bg-secondary/30">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                        Try these
                                    </p>
                                </div>
                                <div className="px-6 py-3 lg:px-12">
                                    <Suggestions>
                                        {USE_CASES.map((useCase) => (
                                            <Suggestion
                                                key={useCase.title}
                                                suggestion={useCase.title}
                                                onClick={() => setInput(useCase.prompt)}
                                            />
                                        ))}
                                    </Suggestions>
                                </div>
                            </div>
                        )}

                        {/* Input */}
                        <PromptInput onSubmit={handleSubmit}>
                            <PromptInputTextarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask Sigil anything..."
                                disabled={status !== "ready"}
                            />
                            <PromptInputToolbar>
                                <PromptInputTools className="ml-auto">
                                    <PromptInputSubmit disabled={!input.trim()} status={status} />
                                </PromptInputTools>
                            </PromptInputToolbar>
                        </PromptInput>
                    </div>

                    {/* Portfolio Sidebar */}
                    <div className="hidden lg:block w-80">
                        {portfolioTokens.map((token) => (
                            <div
                                key={token.symbol}
                                className="flex items-center gap-3 px-6 py-4 border-border border-b hover:bg-secondary/20 transition-colors"
                            >
                                <div
                                    className="size-10 flex items-center justify-center text-white font-bold text-sm shrink-0"
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

                        <div className="px-6 py-4 border-border border-b bg-primary/5">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                Total Value
                            </p>
                            <p className="text-2xl font-bold text-primary">$16,090</p>
                        </div>

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
