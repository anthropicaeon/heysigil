"use client";

/**
 * Provide Answer View
 *
 * Display final answer with citations, border-centric design.
 */

import { CheckCircle } from "lucide-react";

import {
    InlineCitation,
    InlineCitationCard,
    InlineCitationCardBody,
    InlineCitationCardTrigger,
    InlineCitationCarousel,
    InlineCitationCarouselContent,
    InlineCitationCarouselHeader,
    InlineCitationCarouselIndex,
    InlineCitationCarouselItem,
    InlineCitationCarouselNext,
    InlineCitationCarouselPrev,
    InlineCitationQuote,
    InlineCitationSource,
} from "@/components/ai-elements/inline-citation";
import { Loader } from "@/components/ai-elements/loader";
import { cn } from "@/lib/utils";

interface Citation {
    number: string;
    title: string;
    url: string;
    description?: string;
    snippet?: string;
}

interface Step {
    step: string;
    reasoning: string;
    result: string;
}

interface ProvideAnswerViewProps {
    invocation: {
        state: string;
        input?: unknown;
        output?: {
            state?: string;
            answer?: string;
            steps?: Step[];
            confidence?: number;
            citations?: Citation[];
        };
        errorText?: string;
    };
    className?: string;
}

export default function ProvideAnswerView({ invocation, className }: ProvideAnswerViewProps) {
    switch (invocation.state) {
        case "input-streaming":
            return (
                <div
                    className={cn(
                        "flex items-center gap-2 text-sm text-muted-foreground",
                        className,
                    )}
                >
                    <Loader />
                    Preparing final answer...
                </div>
            );

        case "input-available":
            return (
                <div className={cn("text-sm text-muted-foreground", className)}>
                    Synthesizing results into final answer...
                </div>
            );

        case "output-available": {
            if (invocation.output?.state === "loading") {
                return (
                    <div className={cn("text-sm text-muted-foreground", className)}>
                        Generating final answer...
                    </div>
                );
            }

            const output = invocation.output;
            const answer = output?.answer || "No answer provided";
            const confidence = Math.round((output?.confidence || 0) * 100);
            const steps = output?.steps || [];
            const citations = output?.citations || [];

            // Split the answer by citation patterns [1], [2], etc.
            const parts = answer.split(/(\[\d+\])/);

            return (
                <div className={cn("space-y-4", className)}>
                    <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                        <CheckCircle className="size-5 text-primary" />
                        Final Answer
                    </div>

                    {/* Answer with inline citations */}
                    <div className="prose prose-sm max-w-none">
                        <p className="leading-relaxed text-foreground">
                            {parts.map((part, index) => {
                                const citationMatch = part.match(/\[(\d+)\]/);
                                if (citationMatch) {
                                    return (
                                        <span
                                            key={index}
                                            className="ml-1 inline-flex items-center px-1.5 py-0.5 text-xs font-medium border border-primary/30 bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                                            title={`Citation ${citationMatch[1]}`}
                                        >
                                            {citationMatch[0]}
                                        </span>
                                    );
                                }
                                return part;
                            })}
                        </p>
                    </div>

                    {/* Citation carousel */}
                    {citations.length > 0 && (
                        <InlineCitation>
                            <InlineCitationCard>
                                <InlineCitationCardTrigger
                                    sources={citations.map((c) => c.url).filter(Boolean)}
                                />
                                <InlineCitationCardBody>
                                    <InlineCitationCarousel>
                                        <InlineCitationCarouselHeader>
                                            <InlineCitationCarouselPrev />
                                            <InlineCitationCarouselNext />
                                            <InlineCitationCarouselIndex />
                                        </InlineCitationCarouselHeader>
                                        <InlineCitationCarouselContent>
                                            {citations.map((citation, citationIndex) => (
                                                <InlineCitationCarouselItem key={citationIndex}>
                                                    <InlineCitationSource
                                                        description={citation.description}
                                                        title={citation.title || "Untitled"}
                                                        url={citation.url}
                                                    />
                                                    {citation.snippet && (
                                                        <InlineCitationQuote>
                                                            {citation.snippet}
                                                        </InlineCitationQuote>
                                                    )}
                                                </InlineCitationCarouselItem>
                                            ))}
                                        </InlineCitationCarouselContent>
                                    </InlineCitationCarousel>
                                </InlineCitationCardBody>
                            </InlineCitationCard>
                        </InlineCitation>
                    )}

                    {/* Steps taken */}
                    {steps.length > 0 && (
                        <div className="border border-border bg-sage/20">
                            <div className="px-4 py-2 border-b border-border">
                                <p className="text-sm font-medium text-foreground">
                                    Steps Taken ({steps.length})
                                </p>
                            </div>
                            <div className="divide-y divide-border">
                                {steps.map((step, index) => (
                                    <div key={index} className="px-4 py-3">
                                        <p className="text-sm font-medium text-foreground">
                                            {index + 1}. {step.step}
                                        </p>
                                        <div className="mt-1 text-xs text-muted-foreground space-y-1">
                                            <p>
                                                <strong>Reasoning:</strong> {step.reasoning}
                                            </p>
                                            <p>
                                                <strong>Result:</strong> {step.result}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Confidence level */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Confidence:</span>
                        <div className="flex-1 max-w-32 h-2 bg-secondary border border-border">
                            <div
                                className="h-full bg-primary"
                                style={{ width: `${confidence}%` }}
                            />
                        </div>
                        <span className="font-medium text-foreground">{confidence}%</span>
                    </div>
                </div>
            );
        }

        case "output-error":
            return (
                <div className={cn("text-sm text-destructive", className)}>
                    Error: {invocation.errorText}
                </div>
            );

        default:
            return null;
    }
}
