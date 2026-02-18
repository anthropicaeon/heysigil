/**
 * MethodStep Component
 *
 * Step 1: Choose verification method.
 * Border-centric design with proper section headers and divided lists.
 */

"use client";

import { Check, ChevronDown, Github, Globe, Twitter } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import { cn } from "@/lib/utils";

import { OTHER_METHODS, RECOMMENDED_METHODS } from "../constants";
import type { Method } from "../types";

interface MethodStepProps {
    selectedMethod: Method | null;
    onSelect: (method: Method) => void;
    onContinue: () => void;
}

// Icon mapping for methods
function getMethodIcon(methodId: string) {
    switch (methodId) {
        case "github_oauth":
        case "github_file":
            return Github;
        case "tweet_zktls":
            return Twitter;
        default:
            return Globe;
    }
}

export function MethodStep({ selectedMethod, onSelect, onContinue }: MethodStepProps) {
    const [showMore, setShowMore] = useState(false);

    // If user already selected a non-recommended method, keep expanded
    const expandedByDefault =
        selectedMethod !== null && OTHER_METHODS.some((m) => m.id === selectedMethod.id);

    return (
        <div className="flex-1 flex flex-col bg-background">
            {/* Section Header */}
            <div className="px-6 py-3 lg:px-12 border-b border-border bg-secondary/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step 1 — Choose Channel
                </span>
            </div>

            {/* Title Section */}
            <div className="px-6 py-6 lg:px-12 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground lowercase mb-1">
                    choose a verification channel
                </h2>
                <p className="text-sm text-muted-foreground">
                    Pick the method that works best for you. Most developers use GitHub OAuth.
                </p>
            </div>

            {/* Recommended Methods Section */}
            <div className="px-6 py-2 lg:px-12 border-b border-border bg-sage/20">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Recommended
                </span>
            </div>

            {/* Recommended Method Cards */}
            <div className="border-b border-border divide-y divide-border">
                {RECOMMENDED_METHODS.map((m) => {
                    const Icon = getMethodIcon(m.id);
                    const isSelected = selectedMethod?.id === m.id;

                    const cardContent = (
                        <>
                            {/* Icon */}
                            <div className="px-4 py-4 lg:px-6 flex items-center border-r border-border">
                                <div
                                    className={cn(
                                        "size-10 flex items-center justify-center border border-border",
                                        isSelected ? "bg-lavender/60" : "bg-lavender/30",
                                    )}
                                >
                                    <Icon
                                        className={cn(
                                            "size-5",
                                            isSelected ? "text-primary" : "text-muted-foreground",
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 px-4 py-4 lg:px-6">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-medium text-foreground">
                                                {m.name}
                                            </span>
                                            {m.badge && (
                                                <Badge
                                                    variant="outline"
                                                    className={cn(
                                                        "text-xs",
                                                        m.badge === "Fastest" &&
                                                            "bg-green-50 text-green-700 border-green-200",
                                                        m.badge === "Most Secure" &&
                                                            "bg-blue-50 text-blue-700 border-blue-200",
                                                        m.badge === "No API Needed" &&
                                                            "bg-purple-50 text-purple-700 border-purple-200",
                                                    )}
                                                >
                                                    {m.badge}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {m.description}
                                        </p>
                                    </div>

                                    {/* Check mark */}
                                    {isSelected && (
                                        <div className="size-6 bg-primary flex items-center justify-center shrink-0">
                                            <Check className="size-4 text-primary-foreground" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Popularity stat */}
                            <div className={cn(
                                "hidden sm:flex w-24 px-4 py-4 items-center justify-center border-l border-border",
                                isSelected ? "bg-lavender/50" : "bg-cream/30",
                            )}>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-foreground">
                                        {m.popularity}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">usage</p>
                                </div>
                            </div>
                        </>
                    );

                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => onSelect(m)}
                            className={cn(
                                "w-full text-left transition-colors",
                                !isSelected && "hover:bg-secondary/20",
                            )}
                        >
                            {isSelected ? (
                                <PixelCard
                                    variant="lavender"
                                    active
                                    centerFade
                                    noFocus
                                    className="flex bg-lavender/30"
                                >
                                    {cardContent}
                                </PixelCard>
                            ) : (
                                <div className="flex">{cardContent}</div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* More Options Toggle */}
            <button
                type="button"
                onClick={() => setShowMore(!showMore)}
                className={cn(
                    "w-full px-6 py-3 lg:px-12 border-b border-border flex items-center justify-between",
                    "text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-colors",
                )}
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

            {/* Additional Methods */}
            {(showMore || expandedByDefault) && (
                <>
                    <div className="px-6 py-2 lg:px-12 border-b border-border bg-cream/30">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Additional Methods
                        </span>
                    </div>
                    <div className="border-b border-border divide-y divide-border">
                        {OTHER_METHODS.map((m) => {
                            const Icon = getMethodIcon(m.id);
                            const isSelected = selectedMethod?.id === m.id;

                            return (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => onSelect(m)}
                                    className={cn(
                                        "w-full text-left transition-colors flex",
                                        isSelected ? "bg-lavender/40" : "hover:bg-secondary/20",
                                    )}
                                >
                                    {/* Icon */}
                                    <div className="px-4 py-3 lg:px-6 flex items-center border-r border-border">
                                        <div
                                            className={cn(
                                                "size-8 flex items-center justify-center border border-border",
                                                isSelected ? "bg-lavender/60" : "bg-secondary/30",
                                            )}
                                        >
                                            <Icon
                                                className={cn(
                                                    "size-4",
                                                    isSelected
                                                        ? "text-primary"
                                                        : "text-muted-foreground",
                                                )}
                                            />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 px-4 py-3 lg:px-6 flex items-center justify-between">
                                        <div>
                                            <span className="font-medium text-foreground text-sm">
                                                {m.name}
                                            </span>
                                            <p className="text-xs text-muted-foreground">
                                                {m.description}
                                            </p>
                                        </div>
                                        {isSelected && (
                                            <div className="size-5 bg-primary flex items-center justify-center shrink-0">
                                                <Check className="size-3 text-primary-foreground" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Popularity */}
                                    {m.popularity && (
                                        <div className={cn(
                                            "hidden sm:flex w-20 px-3 py-3 items-center justify-center border-l border-border text-xs text-muted-foreground",
                                            isSelected && "bg-lavender/50",
                                        )}>
                                            {m.popularity}%
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}

            {/* Continue Action - fills remaining space */}
            <div className="flex-1 flex flex-col px-6 py-6 lg:px-12 bg-sage/20">
                <div className="flex-1" />
                <div>
                    <Button
                        onClick={onContinue}
                        disabled={!selectedMethod}
                        className="w-full"
                        size="lg"
                    >
                        Continue with {selectedMethod?.name || "selected method"}
                    </Button>
                    {selectedMethod && (
                        <p className="text-xs text-muted-foreground text-center mt-3">
                            Format: <code className="bg-secondary/50 px-1.5 py-0.5">{selectedMethod.projectIdFormat}</code>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
