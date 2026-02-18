/**
 * MethodStep Component
 *
 * Step 1: Choose verification method.
 * Implements Hick's Law: Show 3 recommended methods prominently,
 * collapse others under "More options" to reduce decision paralysis.
 * Updated with pastel design system.
 */

"use client";

import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { OTHER_METHODS, RECOMMENDED_METHODS } from "../constants";
import type { Method } from "../types";

interface MethodStepProps {
    selectedMethod: Method | null;
    onSelect: (method: Method) => void;
    onContinue: () => void;
}

export function MethodStep({ selectedMethod, onSelect, onContinue }: MethodStepProps) {
    const [showMore, setShowMore] = useState(false);

    // If user already selected a non-recommended method, keep expanded
    const expandedByDefault =
        selectedMethod !== null && OTHER_METHODS.some((m) => m.id === selectedMethod.id);

    return (
        <div className="px-6 py-6 lg:px-12 bg-background">
            <h2 className="text-lg font-semibold text-foreground lowercase mb-2">
                choose a verification channel
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
                Pick the method that works best for you. Most developers use GitHub OAuth.
            </p>

            {/* Recommended methods */}
            <div className="border border-border divide-y divide-border mb-4">
                {RECOMMENDED_METHODS.map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => onSelect(m)}
                        className={cn(
                            "w-full text-left p-4 transition-all",
                            selectedMethod?.id === m.id
                                ? "bg-primary/5 border-l-4 border-l-primary"
                                : "hover:bg-secondary/30",
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-foreground">{m.name}</span>
                                    {m.badge && (
                                        <Badge variant="sage" className="text-xs">
                                            {m.badge}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">{m.description}</p>
                                {m.popularity && (
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {m.popularity}% of developers use this
                                    </p>
                                )}
                            </div>
                            {selectedMethod?.id === m.id && (
                                <Check className="size-5 text-primary shrink-0" />
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* More options toggle */}
            <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
                <span>
                    {showMore || expandedByDefault ? "Hide" : "Show"} {OTHER_METHODS.length} more
                    options
                </span>
                <ChevronDown
                    className={cn(
                        "size-4 transition-transform",
                        (showMore || expandedByDefault) && "rotate-180",
                    )}
                />
            </button>

            {/* Additional methods */}
            {(showMore || expandedByDefault) && (
                <div className="border border-border divide-y divide-border mb-6">
                    {OTHER_METHODS.map((m) => (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => onSelect(m)}
                            className={cn(
                                "w-full text-left p-3 transition-all",
                                selectedMethod?.id === m.id
                                    ? "bg-primary/5 border-l-4 border-l-primary"
                                    : "hover:bg-secondary/30",
                            )}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-medium text-foreground text-sm">
                                        {m.name}
                                    </span>
                                    <p className="text-xs text-muted-foreground">{m.description}</p>
                                </div>
                                {selectedMethod?.id === m.id && (
                                    <Check className="size-4 text-primary" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <Button onClick={onContinue} disabled={!selectedMethod} className="w-full" size="lg">
                Continue with {selectedMethod?.name || "selected method"}
            </Button>
        </div>
    );
}
