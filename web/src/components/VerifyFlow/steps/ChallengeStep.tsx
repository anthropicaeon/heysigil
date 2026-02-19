/**
 * ChallengeStep Component
 *
 * Step 4: Display challenge instructions and verify.
 * Border-centric design with proper section headers and divided lists.
 */

"use client";

import { ArrowLeft, Check, Copy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ChallengeResponse } from "../types";

interface ChallengeStepProps {
    challenge: ChallengeResponse;
    selectedPluginName?: string;
    loading: boolean;
    error: string;
    onBack: () => void;
    onCheck: () => void;
}

export function ChallengeStep({
    challenge,
    selectedPluginName,
    loading,
    error,
    onBack,
    onCheck,
}: ChallengeStepProps) {
    const [copied, setCopied] = useState(false);

    const copyCode = async () => {
        await navigator.clipboard.writeText(challenge.challengeCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex-1 flex flex-col bg-background">
            <div className="px-6 py-3 lg:px-12 border-b border-border bg-secondary/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step 4 - Complete Verification
                </span>
            </div>

            <div className="px-6 py-6 lg:px-12 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground lowercase mb-1">
                    follow the instructions
                </h2>
                <p className="text-sm text-muted-foreground">
                    Complete the steps below, then click &quot;Check Verification&quot;
                </p>
            </div>

            <div className="px-6 py-2 lg:px-12 border-b border-border bg-lavender/30">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Instructions
                </span>
            </div>
            <div className="px-6 py-6 lg:px-12 border-b border-border">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {challenge.instructions}
                </p>
            </div>

            <div className="px-6 py-2 lg:px-12 border-b border-border bg-sage/20">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Challenge Code
                </span>
            </div>
            <div className="px-6 py-4 lg:px-12 border-b border-border">
                <div className="flex items-center gap-3">
                    <code className="flex-1 font-mono bg-cream/30 border border-border px-4 py-3 text-foreground">
                        {challenge.challengeCode}
                    </code>
                    <button
                        type="button"
                        onClick={copyCode}
                        className={cn(
                            "size-10 flex items-center justify-center border border-border transition-colors",
                            copied
                                ? "bg-sage/50 text-primary"
                                : "bg-secondary/30 hover:bg-secondary/50 text-muted-foreground",
                        )}
                        title="Copy code"
                    >
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                </div>
            </div>

            {selectedPluginName && (
                <>
                    <div className="px-6 py-2 lg:px-12 border-b border-border bg-lavender/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Plugin Enablement
                        </span>
                    </div>
                    <div className="px-6 py-3 lg:px-12 border-b border-border">
                        <p className="text-sm text-foreground">
                            Selected plugin: <span className="font-medium">{selectedPluginName}</span>
                        </p>
                    </div>
                </>
            )}

            {error && (
                <div className="px-6 py-4 lg:px-12 bg-red-50 border-b border-border">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="flex-1 flex flex-col px-6 py-6 lg:px-12 bg-sage/20">
                <div className="flex-1" />
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="size-4 mr-2" />
                        Back
                    </Button>
                    <Button onClick={onCheck} disabled={loading} className="flex-1">
                        {loading ? (
                            <>
                                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                Checking...
                            </>
                        ) : (
                            "Check Verification"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
