/**
 * Chat Types
 *
 * Types for the multi-step tool chat agent.
 */

// Tool invocation states
export type ToolState = "input-streaming" | "input-available" | "output-available" | "output-error";

// Base tool invocation
export interface ToolInvocation<TInput = unknown, TOutput = unknown> {
    type: string;
    state: ToolState;
    input?: TInput;
    output?: TOutput & { state?: "loading" | "ready" };
    errorText?: string;
}

// Web Search
export interface WebSearchInput {
    query: string;
    limit?: number;
}

export interface WebSearchOutput {
    state: "loading" | "ready";
    query: string;
    results: Array<{
        title: string;
        url: string;
        snippet?: string;
        source?: string;
    }>;
}

export type WebSearchToolInvocation = ToolInvocation<WebSearchInput, WebSearchOutput>;

// News Search
export interface NewsSearchInput {
    topic: string;
}

export interface NewsSearchOutput {
    state: "loading" | "ready";
    topic: string;
    items: Array<{
        title: string;
        url?: string;
        publishedAt?: string;
    }>;
}

export type NewsSearchToolInvocation = ToolInvocation<NewsSearchInput, NewsSearchOutput>;

// Analyze
export interface AnalyzeInput {
    problem: string;
    approach: "systematic" | "creative" | "technical";
}

export interface AnalyzeOutput {
    state: "loading" | "ready";
    problem: string;
    approach: string;
    breakdown: string;
    components: string[];
}

export type AnalyzeToolInvocation = ToolInvocation<AnalyzeInput, AnalyzeOutput>;

// Decide
export interface DecideInput {
    options: string[];
    criteria: string[];
    context: string;
}

export interface DecideOutput {
    state: "loading" | "ready";
    context: string;
    options: string[];
    criteria: string[];
    evaluation: Array<{
        option: string;
        score: number;
        reasoning: string;
    }>;
    decision: string;
    reasoning: string;
}

export type DecideToolInvocation = ToolInvocation<DecideInput, DecideOutput>;

// Provide Answer
export interface ProvideAnswerInput {
    answer: string;
    steps: Array<{
        step: string;
        reasoning: string;
        result: string;
    }>;
    confidence: number;
    sources?: string[];
    citations?: Array<{
        number: string;
        title: string;
        url: string;
        description?: string;
        snippet?: string;
    }>;
}

export interface ProvideAnswerOutput {
    state: "loading" | "ready";
    answer: string;
    steps: Array<{
        step: string;
        reasoning: string;
        result: string;
    }>;
    confidence: number;
    sources: string[];
    citations: Array<{
        number: string;
        title: string;
        url: string;
        description?: string;
        snippet?: string;
    }>;
    summary: string;
}

export type ProvideAnswerToolInvocation = ToolInvocation<ProvideAnswerInput, ProvideAnswerOutput>;

// Message part types
export type MessagePart =
    | { type: "text"; text: string }
    | { type: "reasoning"; text: string }
    | { type: "source-url"; url: string }
    | ({ type: "tool-websearch" } & WebSearchToolInvocation)
    | ({ type: "tool-news" } & NewsSearchToolInvocation)
    | ({ type: "tool-analyze" } & AnalyzeToolInvocation)
    | ({ type: "tool-decide" } & DecideToolInvocation)
    | ({ type: "tool-provideAnswer" } & ProvideAnswerToolInvocation);

// Multi-step tool UI message
export interface MultiStepToolUIMessage {
    id: string;
    role: "user" | "assistant";
    source?: "user" | "assistant" | "agent";
    content?: string;
    parts: MessagePart[];
}

// Chat status
export type ChatStatus = "ready" | "streaming" | "submitted";
