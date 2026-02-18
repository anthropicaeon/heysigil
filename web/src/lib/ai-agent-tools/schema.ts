/**
 * AI Agent Tool Schemas
 *
 * Zod schemas for tool inputs and outputs.
 */

import { z } from "zod";

// Web Search
export const WebSearchItemSchema = z.object({
    title: z.string(),
    url: z.string().url(),
    snippet: z.string().optional(),
    source: z.string().optional(),
});

export const WebSearchSchema = z.object({
    query: z.string(),
    results: z.array(WebSearchItemSchema),
});

export type WebSearchItem = z.infer<typeof WebSearchItemSchema>;
export type WebSearchResult = z.infer<typeof WebSearchSchema>;

// News Search
export const NewsItemSchema = z.object({
    title: z.string(),
    url: z.string().optional(),
    publishedAt: z.string().optional(),
});

export const NewsSearchSchema = z.object({
    topic: z.string(),
    items: z.array(NewsItemSchema),
});

export type NewsItem = z.infer<typeof NewsItemSchema>;
export type NewsSearchResult = z.infer<typeof NewsSearchSchema>;

// Analysis
export const AnalysisSchema = z.object({
    problem: z.string(),
    approach: z.enum(["systematic", "creative", "technical"]),
    breakdown: z.string(),
    components: z.array(z.string()),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

// Decision
export const DecisionEvaluationSchema = z.object({
    option: z.string(),
    score: z.number(),
    reasoning: z.string(),
});

export const DecisionSchema = z.object({
    context: z.string(),
    options: z.array(z.string()),
    criteria: z.array(z.string()),
    evaluation: z.array(DecisionEvaluationSchema),
    decision: z.string(),
    reasoning: z.string(),
});

export type DecisionEvaluation = z.infer<typeof DecisionEvaluationSchema>;
export type DecisionResult = z.infer<typeof DecisionSchema>;

// Provide Answer
export const CitationSchema = z.object({
    number: z.string().describe("Citation number (e.g., '1', '2')"),
    title: z.string().describe("Title of the source"),
    url: z.string().describe("URL of the source"),
    description: z.string().optional().describe("Brief description of the source"),
    snippet: z.string().optional().describe("Relevant snippet from the source"),
});

export const StepSchema = z.object({
    step: z.string().describe("Description of what was done in this step"),
    reasoning: z.string().describe("Reasoning behind this step"),
    result: z.string().describe("Result of this step"),
});

export const ProvideAnswerSchema = z.object({
    answer: z
        .string()
        .describe(
            "The final answer to the user's question with inline citations marked as [1], [2], etc.",
        ),
    steps: z.array(StepSchema).describe("All steps taken to reach the answer"),
    confidence: z.number().min(0).max(1).describe("Confidence level in the answer"),
    sources: z.array(z.string()).optional().describe("Sources used if any"),
    citations: z
        .array(CitationSchema)
        .optional()
        .describe("Detailed citation information for inline citations"),
});

export type Citation = z.infer<typeof CitationSchema>;
export type Step = z.infer<typeof StepSchema>;
export type ProvideAnswerResult = z.infer<typeof ProvideAnswerSchema>;
