/**
 * ResultStep Component
 *
 * Step 4: Display verification result and claim attestation.
 * Implements Peak-End Rule with professional, subtle celebration.
 * Updated with pastel design system.
 */

"use client";

import { Check, Copy, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { ChallengeResponse, CheckResult } from "../types";

interface ResultStepProps {
    challenge: ChallengeResponse;
    checkResult: CheckResult;
    loading: boolean;
    onClaim: () => void;
}

export function ResultStep({ challenge, checkResult, loading, onClaim }: ResultStepProps) {
    const [showShareTooltip, setShowShareTooltip] = useState(false);
    const isStamped = Boolean(checkResult.attestationUid);

    const shareText = `I just verified ${challenge.projectId} on @HeySigil - the verification standard for the agentic economy. Stamp your Sigil: heysigil.com/verify`;

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Verified on Sigil",
                    text: shareText,
                    url: "https://heysigil.com/verify",
                });
            } catch {
                // User cancelled or error
            }
        } else {
            await navigator.clipboard.writeText(shareText);
            setShowShareTooltip(true);
            setTimeout(() => setShowShareTooltip(false), 2000);
        }
    };

    const handleTwitterShare = () => {
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(tweetUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="bg-background">
            {/* Success Hero */}
            <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 text-center">
                <div className="size-20 bg-sage border border-border flex items-center justify-center mx-auto mb-6">
                    <Shield className="size-10 text-green-600" />
                </div>
                <Badge variant="sage" className="mb-4">
                    Verified
                </Badge>
                <h2 className="text-2xl font-semibold text-foreground mb-2 lowercase">
                    ownership confirmed
                </h2>
                <p className="text-muted-foreground">{challenge.projectId}</p>
            </div>

            {/* Share Section */}
            <div className="border-border border-b px-6 py-6 lg:px-12">
                <p className="text-sm text-muted-foreground mb-3">Share your verification</p>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleTwitterShare} className="gap-2">
                        <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Post on X
                    </Button>
                    <Button variant="outline" onClick={handleShare} className="gap-2">
                        {showShareTooltip ? (
                            <>
                                <Check className="size-4" />
                                Copied!
                            </>
                        ) : (
                            <>
                                <Copy className="size-4" />
                                Copy link
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Stamp CTA */}
            {!isStamped && (
                <div className="px-6 py-8 lg:px-12">
                    <h3 className="font-semibold text-foreground mb-2">
                        Stamp Your Sigil On-Chain
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Create an EAS attestation on Base. Your on-chain stamp starts USDC fee
                        earnings from LP activity.
                    </p>
                    <Button onClick={onClaim} disabled={loading} size="lg" className="w-full">
                        {loading ? (
                            <>
                                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                Stamping...
                            </>
                        ) : (
                            "Stamp Sigil"
                        )}
                    </Button>
                </div>
            )}

            {/* Success state after stamping */}
            {isStamped && (
                <div className="px-6 py-8 lg:px-12">
                    <div className="flex items-center gap-2 text-green-600 mb-3">
                        <Check className="size-5" />
                        <span className="font-medium">Sigil stamped on-chain</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mb-4 break-all">
                        {checkResult.attestationUid}
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                        <li className="flex items-start gap-2">
                            <Check className="size-4 text-green-600 mt-0.5" />
                            USDC fees from LP activity flow to your wallet
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="size-4 text-green-600 mt-0.5" />
                            Native tokens unlock via community milestones
                        </li>
                        <li className="flex items-start gap-2">
                            <Check className="size-4 text-green-600 mt-0.5" />
                            Verification is permanent and portable
                        </li>
                    </ul>
                    <Link href="/dashboard">
                        <Button size="lg" className="w-full">
                            Go to Dashboard
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
