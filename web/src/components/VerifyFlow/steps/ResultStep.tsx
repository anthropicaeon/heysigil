/**
 * ResultStep Component
 *
 * Step 5: Display verification result and claim attestation.
 */

"use client";

import { Check, Copy, ExternalLink, Shield } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { ChallengeResponse, CheckResult } from "../types";

interface ResultStepProps {
    challenge: ChallengeResponse;
    checkResult: CheckResult;
    selectedPluginName?: string;
    loading: boolean;
    onClaim: () => void;
}

export function ResultStep({
    challenge,
    checkResult,
    selectedPluginName,
    loading,
    onClaim,
}: ResultStepProps) {
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
                // User cancelled or blocked sharing.
            }
            return;
        }

        await navigator.clipboard.writeText(shareText);
        setShowShareTooltip(true);
        setTimeout(() => setShowShareTooltip(false), 2000);
    };

    const handleTwitterShare = () => {
        const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
        window.open(tweetUrl, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="flex-1 flex flex-col bg-background">
            <div className="px-6 py-3 lg:px-12 border-b border-border bg-secondary/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step 5 - {isStamped ? "Complete" : "Claim Attestation"}
                </span>
            </div>

            <div className="border-b border-border">
                <div className="grid lg:grid-cols-[1fr_200px]">
                    <div className="px-6 py-12 lg:px-12 lg:py-16 lg:border-r border-border">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-16 bg-sage/50 border border-border flex items-center justify-center">
                                <Shield className="size-8 text-primary" />
                            </div>
                            <div>
                                <Badge
                                    variant="outline"
                                    className="mb-2 bg-green-50 text-green-700 border-green-200"
                                >
                                    Verified
                                </Badge>
                                <h2 className="text-xl font-semibold text-foreground lowercase">
                                    ownership confirmed
                                </h2>
                            </div>
                        </div>
                        <p className="text-muted-foreground font-mono text-sm">{challenge.projectId}</p>
                    </div>

                    <div className="hidden lg:flex flex-col bg-cream/20">
                        <div className="flex-1 flex items-center justify-center p-6 border-b border-border">
                            <div className="text-center">
                                <div
                                    className={cn(
                                        "size-12 flex items-center justify-center mx-auto mb-2 border border-border",
                                        isStamped ? "bg-sage/50" : "bg-lavender/30",
                                    )}
                                >
                                    <Check
                                        className={cn(
                                            "size-6",
                                            isStamped ? "text-primary" : "text-muted-foreground",
                                        )}
                                    />
                                </div>
                                <p className="text-sm font-medium text-foreground">
                                    {isStamped ? "On-Chain" : "Pending"}
                                </p>
                            </div>
                        </div>
                        <div className="px-4 py-3 text-center">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                                EAS on Base
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-2 lg:px-12 border-b border-border bg-sage/20">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    Share Your Verification
                </span>
            </div>
            <div className="px-6 py-4 lg:px-12 border-b border-border">
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

            {selectedPluginName && (
                <>
                    <div className="px-6 py-2 lg:px-12 border-b border-border bg-lavender/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Plugin Selection
                        </span>
                    </div>
                    <div className="px-6 py-3 lg:px-12 border-b border-border">
                        <p className="text-sm text-foreground">
                            Plugin to enable after stamp:{" "}
                            <span className="font-medium">{selectedPluginName}</span>
                        </p>
                    </div>
                </>
            )}

            {!isStamped && (
                <div className="flex-1 flex flex-col">
                    <div className="px-6 py-2 lg:px-12 border-b border-border bg-lavender/20">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Final Step
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col px-6 py-6 lg:px-12 bg-lavender/10">
                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="font-semibold text-foreground mb-2 lowercase">
                                stamp your sigil on-chain
                            </h3>
                            <p className="text-sm text-muted-foreground mb-6">
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
                    </div>
                </div>
            )}

            {isStamped && (
                <>
                    <div className="px-6 py-2 lg:px-12 border-b border-border bg-sage/30">
                        <div className="flex items-center gap-2">
                            <Check className="size-3 text-primary" />
                            <span className="text-xs text-primary font-medium uppercase tracking-wider">
                                Sigil Stamped
                            </span>
                        </div>
                    </div>
                    <div className="px-6 py-4 lg:px-12 border-b border-border">
                        <p className="text-xs text-muted-foreground font-mono break-all">
                            {checkResult.attestationUid}
                        </p>
                    </div>

                    <div className="border-b border-border divide-y divide-border">
                        <div className="px-6 py-3 lg:px-12 flex items-center gap-3">
                            <div className="size-6 bg-sage/50 flex items-center justify-center border border-border shrink-0">
                                <Check className="size-3 text-primary" />
                            </div>
                            <span className="text-sm text-foreground">
                                USDC fees from LP activity flow to your wallet
                            </span>
                        </div>
                        <div className="px-6 py-3 lg:px-12 flex items-center gap-3">
                            <div className="size-6 bg-sage/50 flex items-center justify-center border border-border shrink-0">
                                <Check className="size-3 text-primary" />
                            </div>
                            <span className="text-sm text-foreground">
                                Native tokens unlock via community milestones
                            </span>
                        </div>
                        <div className="px-6 py-3 lg:px-12 flex items-center gap-3">
                            <div className="size-6 bg-sage/50 flex items-center justify-center border border-border shrink-0">
                                <Check className="size-3 text-primary" />
                            </div>
                            <span className="text-sm text-foreground">
                                Verification is permanent and portable
                            </span>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col px-6 py-6 lg:px-12 bg-sage/20">
                        <div className="flex-1" />
                        <div className="flex gap-3">
                            <Button variant="outline" asChild className="gap-2">
                                <a
                                    href={`https://base.easscan.org/attestation/view/${checkResult.attestationUid}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="size-4" />
                                    View on EAS
                                </a>
                            </Button>
                            <Link href="/dashboard" className="flex-1">
                                <Button size="lg" className="w-full">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
