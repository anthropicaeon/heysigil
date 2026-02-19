"use client";

/**
 * Chat Page
 *
 * Multi-step AI agent chat with border-centric design.
 * Features tool invocations, chain of thought, and portfolio sidebar.
 * Full-screen layout with no footer.
 */

import {
    Activity,
    Bot,
    BrainIcon,
    CheckCircleIcon,
    CopyIcon,
    Loader2,
    NewspaperIcon,
    RefreshCcwIcon,
    ScaleIcon,
    SearchIcon,
    Sparkles,
} from "lucide-react";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
    PromptInput,
    PromptInputStatus,
    PromptInputSubmit,
    PromptInputTextarea,
    PromptInputToolbar,
    PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Reasoning, ReasoningContent } from "@/components/ai-elements/reasoning";
import { Response } from "@/components/ai-elements/response";
import { Source, Sources, SourcesContent, SourcesTrigger } from "@/components/ai-elements/sources";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { ThinkingMessage } from "@/components/ai-elements/thinking-message";
import { Tool, ToolContent, ToolHeader, ToolInput } from "@/components/ai-elements/tool";
import PortfolioSidebar from "@/components/PortfolioSidebar";
import {
    AnalyzeView,
    DecideView,
    NewsSearchView,
    ProvideAnswerView,
    WebSearchView,
} from "@/components/tool-views";
import { PixelCard } from "@/components/ui/pixel-card";
import { useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import type { ChatStatus, MessagePart, MultiStepToolUIMessage } from "@/lib/chat-types";
import { cn } from "@/lib/utils";

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

// Tool step extraction for Chain of Thought
interface ToolStep {
    icon: typeof SearchIcon;
    label: string;
    description: string;
    status: "complete" | "active" | "pending";
    content?: React.ReactNode;
}

type SidebarTab = "chat" | "agents";

interface AgentPresenceItem {
    id: string;
    stack: string;
    endpoint: string;
    connectionId: string | null;
    botId: string | null;
    status: string;
    lastSeenAt: string | null;
    presence: "online" | "offline";
    minutesSinceSeen: number | null;
}

interface AgentFeedItem {
    id: string;
    sessionId: string;
    role: "user" | "assistant";
    source: "agent";
    content: string;
    timestamp: string;
}

interface SidebarModeTabsProps {
    value: SidebarTab;
    onChange: (value: SidebarTab) => void;
    className?: string;
}

function SidebarModeTabs({ value, onChange, className }: SidebarModeTabsProps) {
    const tabs: Array<{ key: SidebarTab; label: string; hint: string }> = [
        { key: "chat", label: "chat", hint: "you + sigil" },
        { key: "agents", label: "agents", hint: "live feed" },
    ];

    return (
        <div className={cn("grid grid-cols-2 border-b border-border bg-background/90", className)}>
            {tabs.map((tab, index) => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChange(tab.key)}
                    className={cn(
                        "group px-4 py-3 text-left transition-colors",
                        index === 0 && "border-r border-border",
                        value === tab.key
                            ? "bg-lavender/35 text-foreground"
                            : "bg-background text-muted-foreground hover:bg-sage/15",
                    )}
                >
                    <p className="text-xs uppercase tracking-[0.14em]">{tab.label}</p>
                    <p className="mt-1 text-[11px] lowercase text-muted-foreground group-hover:text-foreground/80">
                        {tab.hint}
                    </p>
                </button>
            ))}
        </div>
    );
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
    const [showThinking, setShowThinking] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>("chat");
    const [agents, setAgents] = useState<AgentPresenceItem[]>([]);
    const [agentMessages, setAgentMessages] = useState<MultiStepToolUIMessage[]>([]);
    const [agentsLoading, setAgentsLoading] = useState(false);
    const [agentsError, setAgentsError] = useState<string | null>(null);
    const inputRef = useRef(input);
    inputRef.current = input;
    const loadingStartTimeRef = useRef<number>(0);
    const pendingResponseRef = useRef<MultiStepToolUIMessage | null>(null);

    const privy = useOptionalPrivy();

    const loadAgentsPresence = useCallback(async () => {
        if (!privy?.authenticated || !privy?.getAccessToken) {
            setAgents([]);
            setAgentsError(null);
            return;
        }

        setAgentsLoading(true);
        setAgentsError(null);

        try {
            const token = await privy.getAccessToken();
            const res = await fetch(`${API_BASE}/api/connect/bots/presence?windowMinutes=30`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            const data = (await res.json()) as {
                bots?: AgentPresenceItem[];
                error?: string;
            };

            if (!res.ok) {
                setAgentsError(data.error || "Failed to fetch agent presence");
                return;
            }

            setAgents(data.bots || []);
        } catch {
            setAgentsError("Could not reach presence service");
        } finally {
            setAgentsLoading(false);
        }
    }, [privy]);

    const loadAgentFeed = useCallback(async () => {
        if (!privy?.authenticated || !privy?.getAccessToken) {
            setAgentMessages([]);
            return;
        }

        try {
            const token = await privy.getAccessToken();
            const res = await fetch(`${API_BASE}/api/chat/agents/feed?limit=120`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });

            const data = (await res.json()) as {
                messages?: AgentFeedItem[];
            };

            if (!res.ok) {
                return;
            }

            const mapped: MultiStepToolUIMessage[] = (data.messages || []).map((msg) => ({
                id: msg.id,
                role: msg.role,
                source: "agent",
                parts: [{ type: "text", text: msg.content }],
            }));

            setAgentMessages(mapped);
        } catch {
            // Keep previous feed on transient network errors.
        }
    }, [privy]);

    // Hide footer on chat page
    useEffect(() => {
        const footer = document.getElementById("site-footer");
        if (footer) {
            footer.style.display = "none";
        }
        return () => {
            if (footer) {
                footer.style.display = "";
            }
        };
    }, []);

    useEffect(() => {
        if (sidebarTab !== "agents") return;

        void loadAgentsPresence();
        void loadAgentFeed();
        const timer = window.setInterval(() => {
            void loadAgentsPresence();
            void loadAgentFeed();
        }, 30000);

        return () => window.clearInterval(timer);
    }, [sidebarTab, loadAgentsPresence, loadAgentFeed]);

    const handleSubmit = useCallback(
        async (_: unknown, e: FormEvent) => {
            e.preventDefault();
            if (sidebarTab === "agents") {
                toast.info("Agents channel is read-only in this view.");
                return;
            }

            const message = inputRef.current.trim();
            if (!message || status !== "ready") return;

            const userMessage: MultiStepToolUIMessage = {
                id: Date.now().toString(),
                role: "user",
                source: "user",
                parts: [{ type: "text", text: message }],
            };

            setMessages((prev) => [...prev, userMessage]);
            setInput("");
            setStatus("submitted");
            setShowThinking(true);
            loadingStartTimeRef.current = Date.now();

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

                if (data.sessionId) {
                    setSessionId(data.sessionId);
                }

                // Handle multi-part response (rich AI features)
                if (data.parts && Array.isArray(data.parts)) {
                    pendingResponseRef.current = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        source: "assistant",
                        parts: data.parts,
                    };
                }
                // Handle response with embedded tools/reasoning (parse from structured response)
                else if (data.response && typeof data.response === "object") {
                    const parts: MessagePart[] = [];

                    // Extract reasoning
                    if (data.response.reasoning) {
                        parts.push({ type: "reasoning", text: data.response.reasoning });
                    }

                    // Extract tool calls
                    if (data.response.tools && Array.isArray(data.response.tools)) {
                        for (const tool of data.response.tools) {
                            if (tool.type && tool.type.startsWith("tool-")) {
                                parts.push(tool as MessagePart);
                            }
                        }
                    }

                    // Extract sources
                    if (data.response.sources && Array.isArray(data.response.sources)) {
                        for (const source of data.response.sources) {
                            parts.push({ type: "source-url", url: source });
                        }
                    }

                    // Extract main text/answer
                    if (data.response.text || data.response.answer) {
                        parts.push({ type: "text", text: data.response.text || data.response.answer });
                    }

                    pendingResponseRef.current = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        source: "assistant",
                        parts: parts.length > 0 ? parts : [{ type: "text", text: JSON.stringify(data.response) }],
                    };
                }
                // Handle simple text response (fallback)
                else if (data.response) {
                    pendingResponseRef.current = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        source: "assistant",
                        parts: [
                            {
                                type: "text",
                                text: data.response,
                            },
                        ],
                    };
                }
                // Handle error
                else {
                    pendingResponseRef.current = {
                        id: (Date.now() + 1).toString(),
                        role: "assistant",
                        source: "assistant",
                        parts: [
                            {
                                type: "text",
                                text: data.error || "Something went wrong. Please try again.",
                            },
                        ],
                    };
                }
            } catch {
                pendingResponseRef.current = {
                    id: (Date.now() + 1).toString(),
                    role: "assistant",
                    parts: [
                        {
                            type: "text",
                            text: `Connection error. Is the backend running at ${API_BASE}?`,
                        },
                    ],
                };
            } finally {
                // Ensure minimum 2 seconds display time for thinking indicator
                const elapsed = Date.now() - loadingStartTimeRef.current;
                const minDisplayTime = 2000;
                const remainingTime = Math.max(0, minDisplayTime - elapsed);

                // Capture pending response before timeout
                const pendingResponse = pendingResponseRef.current;
                pendingResponseRef.current = null;

                setTimeout(() => {
                    // Add the pending response after thinking indicator hides
                    if (pendingResponse) {
                        setMessages((prev) => [...prev, pendingResponse]);
                    }
                    setShowThinking(false);
                    setStatus("ready");
                }, remainingTime);
            }
        },
        [status, sessionId, privy, sidebarTab],
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

    const onlineAgents = agents.filter((agent) => agent.presence === "online").length;
    const offlineAgents = agents.length - onlineAgents;

    const formatLastSeen = (agent: AgentPresenceItem) => {
        if (agent.minutesSinceSeen === null) return "last seen unavailable";
        if (agent.minutesSinceSeen <= 0) return "last seen just now";
        if (agent.minutesSinceSeen === 1) return "last seen 1 min ago";
        return `last seen ${agent.minutesSinceSeen} mins ago`;
    };

    const activeMessages = sidebarTab === "agents" ? agentMessages : messages;

    return (
        <section className="h-[calc(100vh-5rem)] bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r px-0 bg-background h-full flex flex-col">
                <PixelCard
                    variant="lavender"
                    active
                    centerFade
                    noFocus
                    className="shrink-0 border-b border-border bg-lavender/28"
                >
                    <div className="flex items-center justify-between border-b border-border px-6 py-2 lg:px-12">
                        <div className="flex items-center gap-2 text-xs text-primary uppercase tracking-[0.16em]">
                            <Sparkles className="size-3.5" />
                            conversation surface
                        </div>
                        <div className="inline-flex items-center gap-2 border border-border bg-background/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                            <Activity className="size-3 text-primary" />
                            {sidebarTab === "agents" ? "agents feed" : "user thread"}
                        </div>
                    </div>
                    <div className="px-6 py-4 lg:px-12">
                        <h1 className="text-xl font-semibold text-foreground lowercase">
                            talk to sigil
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            multi-step ai agent with persistent session state
                        </p>
                    </div>
                </PixelCard>

                <div className="flex-1 min-h-0 flex flex-col lg:flex-row bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--sage)/0.07))] overflow-hidden">
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden lg:border-r lg:border-border">
                        <SidebarModeTabs
                            value={sidebarTab}
                            onChange={setSidebarTab}
                            className="lg:hidden"
                        />

                        <div className="shrink-0 border-b border-border bg-background/75 px-6 py-2 lg:px-12">
                            <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                                {sidebarTab === "agents"
                                    ? "agent channel: read-only stream + presence sync"
                                    : "chat channel: direct conversation with sigil"}
                            </p>
                        </div>

                        <Conversation className="flex-1 min-h-0 overflow-hidden">
                            <ConversationContent>
                                {sidebarTab === "agents" && activeMessages.length === 0 ? (
                                    <div className="mx-6 mt-6 border border-border bg-lavender/20 px-4 py-3 text-sm text-muted-foreground lg:mx-12">
                                        Agent feed is waiting for agent-origin messages.
                                    </div>
                                ) : null}

                                {activeMessages.map((message) => (
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
                                                    <Message
                                                        key={partIndex}
                                                        from={message.role}
                                                        source={
                                                            sidebarTab === "agents"
                                                                ? "agent"
                                                                : message.source
                                                        }
                                                    >
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
                                                    <Message
                                                        key={partIndex}
                                                        from={message.role}
                                                        source={
                                                            sidebarTab === "agents"
                                                                ? "agent"
                                                                : message.source
                                                        }
                                                    >
                                                        <MessageContent>
                                                            <ProvideAnswerView invocation={part} />
                                                        </MessageContent>
                                                    </Message>
                                                );
                                            }

                                            return null;
                                        })}

                                        {/* Actions for assistant messages */}
                                        {sidebarTab === "chat" && message.role === "assistant" && (
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

                                {/* Loading/Thinking indicator */}
                                {sidebarTab === "chat" && showThinking && (
                                    <ThinkingMessage
                                        status={status === "streaming" ? "streaming" : "submitted"}
                                    />
                                )}
                            </ConversationContent>
                        </Conversation>

                        {sidebarTab === "chat" && messages.length === 1 && (
                            <div className="border-border border-t shrink-0 bg-[linear-gradient(180deg,hsl(var(--lavender)/0.2),hsl(var(--background)/0.98))]">
                                <div className="px-6 py-2 lg:px-12 border-border border-b bg-background/70">
                                    <p className="text-xs text-muted-foreground uppercase tracking-[0.12em]">
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

                        <div
                            className={`shrink-0 border-border border-t transition-colors ${
                                status !== "ready" ? "bg-lavender/20" : "bg-background/90"
                            }`}
                        >
                            <PromptInput onSubmit={handleSubmit} className="border-t-0">
                                <PromptInputTextarea
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={
                                        sidebarTab === "agents"
                                            ? "Agents stream is read-only..."
                                            : status === "ready"
                                              ? "Ask Sigil anything..."
                                              : status === "submitted"
                                                ? "Connecting to Sigil..."
                                                : "Sigil is thinking..."
                                    }
                                    disabled={status !== "ready" || sidebarTab === "agents"}
                                />
                                <PromptInputToolbar>
                                    <PromptInputStatus status={status} />
                                    <PromptInputTools className="ml-auto">
                                        <PromptInputSubmit
                                            disabled={!input.trim() || sidebarTab === "agents"}
                                            status={status}
                                        />
                                    </PromptInputTools>
                                </PromptInputToolbar>
                            </PromptInput>
                        </div>
                    </div>

                    <div className="hidden lg:flex w-[360px] shrink-0 bg-background/85 flex-col">
                        <SidebarModeTabs value={sidebarTab} onChange={setSidebarTab} />
                        <div className="min-h-0 flex-1">
                            {sidebarTab === "chat" ? (
                                <PortfolioSidebar
                                    sessionId={sessionId}
                                    collapsed={false}
                                    onToggle={() => {}}
                                    showCollapseToggle={false}
                                    className="h-full"
                                />
                            ) : (
                                <div className="h-full flex flex-col bg-[linear-gradient(180deg,hsl(var(--sage)/0.1),hsl(var(--background)/0.95))]">
                                    <div className="border-b border-border px-4 py-3">
                                        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                            Agent Presence
                                        </p>
                                        <div className="mt-3 grid grid-cols-2 border border-border bg-background/65">
                                            <div className="border-r border-border px-3 py-2">
                                                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                                    online
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-foreground">
                                                    {onlineAgents}
                                                </p>
                                            </div>
                                            <div className="px-3 py-2">
                                                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                                                    offline
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-foreground">
                                                    {offlineAgents}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {!privy?.authenticated ? (
                                        <div className="flex-1 flex flex-col">
                                            <div className="border-b border-border px-4 py-4 bg-background/60">
                                                <p className="text-sm text-foreground">
                                                    Sign in to view connected agents.
                                                </p>
                                            </div>
                                            <div className="px-4 py-4 border-b border-border">
                                                <button
                                                    type="button"
                                                    onClick={() => privy.login?.()}
                                                    className="w-full border border-border bg-lavender/80 px-4 py-2 text-sm text-foreground hover:bg-lavender/90 transition-colors"
                                                >
                                                    Sign In
                                                </button>
                                            </div>
                                            <div className="flex-1 bg-cream/25" />
                                        </div>
                                    ) : (
                                        <>
                                            {agentsError ? (
                                                <div className="border-b border-border px-4 py-3 bg-red-50">
                                                    <p className="text-xs text-red-700">{agentsError}</p>
                                                </div>
                                            ) : null}

                                            {agentsLoading && agents.length === 0 ? (
                                                <div className="border-b border-border px-4 py-4 flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Loader2 className="size-4 animate-spin" />
                                                    loading agents...
                                                </div>
                                            ) : null}

                                            {!agentsLoading && agents.length === 0 ? (
                                                <div className="border-b border-border px-4 py-4 text-sm text-muted-foreground">
                                                    No connected agents yet.
                                                </div>
                                            ) : null}

                                            <div className="flex-1 overflow-y-auto">
                                                {agents.map((agent) => (
                                                    <div
                                                        key={agent.id}
                                                        className="border-b border-border px-4 py-3 hover:bg-sage/15 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <Bot className="size-4 text-primary" />
                                                                    <p className="text-sm font-medium text-foreground truncate">
                                                                        {agent.botId || agent.connectionId || agent.id.slice(0, 8)}
                                                                    </p>
                                                                </div>
                                                                <p className="mt-1 text-xs text-muted-foreground uppercase tracking-[0.12em]">
                                                                    {agent.stack}
                                                                </p>
                                                            </div>
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2 py-1 border text-[10px] uppercase tracking-[0.12em] ${
                                                                    agent.presence === "online"
                                                                        ? "border-sage/70 bg-sage/35 text-foreground"
                                                                        : "border-border bg-background text-muted-foreground"
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`size-1.5 ${
                                                                        agent.presence === "online"
                                                                            ? "bg-green-500"
                                                                            : "bg-muted-foreground/60"
                                                                    }`}
                                                                />
                                                                {agent.presence}
                                                            </span>
                                                        </div>
                                                        <p className="mt-2 text-xs text-muted-foreground truncate">
                                                            {formatLastSeen(agent)}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-muted-foreground truncate">
                                                            {agent.endpoint}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
