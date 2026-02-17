/**
 * ResultStep Component
 *
 * Step 4: Display verification result and claim attestation.
 * Implements Peak-End Rule with professional, subtle celebration.
 */

"use client";

import { useState } from "react";
import type { ChallengeResponse, CheckResult } from "../types";
import { LoadingButton } from "@/components/common/LoadingButton";

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
        <div className="result-step">
            {/* Professional achievement card with subtle animation */}
            <div className="result-achievement-card">
                <div className="achievement-glow" />
                <div className="achievement-content">
                    <div className="achievement-icon">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                    </div>
                    <span className="status-badge status-verified">Verified</span>
                    <h2 className="achievement-title">Ownership Confirmed</h2>
                    <p className="achievement-project">{challenge.projectId}</p>
                </div>
            </div>

            {/* Share section - professional styling */}
            <div className="result-share-section">
                <p className="share-label">Share your verification</p>
                <div className="share-buttons">
                    <button type="button" className="share-btn share-btn-primary" onClick={handleTwitterShare}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                        Post on X
                    </button>
                    <button type="button" className="share-btn" onClick={handleShare}>
                        {showShareTooltip ? "Copied!" : "Copy link"}
                    </button>
                </div>
            </div>

            {/* Stamp CTA */}
            {!isStamped && (
                <div className="result-stamp-section">
                    <h3>Stamp Your Sigil On-Chain</h3>
                    <p>
                        Create an EAS attestation on Base. Your on-chain stamp starts USDC fee
                        earnings from LP activity.
                    </p>
                    <LoadingButton
                        loading={loading}
                        onClick={onClaim}
                        loadingText="Stamping..."
                        className="btn-primary btn-lg"
                        style={{ width: "100%" }}
                    >
                        Stamp Sigil
                    </LoadingButton>
                </div>
            )}

            {/* Success state after stamping */}
            {isStamped && (
                <div className="result-stamped-section">
                    <div className="stamped-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9 12l2 2 4-4" />
                        </svg>
                        <span>Sigil stamped on-chain</span>
                    </div>
                    <p className="stamped-uid">
                        <code>{checkResult.attestationUid}</code>
                    </p>
                    <ul className="stamped-benefits">
                        <li>USDC fees from LP activity flow to your wallet</li>
                        <li>Native tokens unlock via community milestones</li>
                        <li>Verification is permanent and portable</li>
                    </ul>
                    <a href="/dashboard" className="btn-primary btn-lg" style={{ display: "block", textAlign: "center" }}>
                        Go to Dashboard
                    </a>
                </div>
            )}
        </div>
    );
}
