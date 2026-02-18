/**
 * ChallengeStep Component
 *
 * Step 3: Display challenge instructions and verify.
 * Updated with pastel design system.
 */

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ChallengeResponse } from "../types";

interface ChallengeStepProps {
    challenge: ChallengeResponse;
    loading: boolean;
    error: string;
    onBack: () => void;
    onCheck: () => void;
}

export function ChallengeStep({ challenge, loading, error, onBack, onCheck }: ChallengeStepProps) {
    return (
        <div className="bg-background">
            <div className="border-border border-b px-6 py-6 lg:px-12">
                <h2 className="text-lg font-semibold text-foreground lowercase">
                    complete verification
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Follow these instructions, then click &quot;Check Verification&quot;
                </p>
            </div>

            <div className="border-border border-b">
                <div className="px-6 py-3 lg:px-12 border-border border-b bg-lavender/30">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Instructions
                    </span>
                </div>
                <div className="px-6 py-6 lg:px-12">
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {challenge.instructions}
                    </p>
                </div>
            </div>

            <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                <p className="text-sm text-muted-foreground">
                    Challenge code:{" "}
                    <code className="font-mono bg-background border border-border px-2 py-1">
                        {challenge.challengeCode}
                    </code>
                </p>
            </div>

            {error && (
                <div className="px-6 py-4 lg:px-12 bg-rose/30 border-border border-t border-b">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="border-border border-t px-6 py-6 lg:px-12 flex gap-3">
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
    );
}
