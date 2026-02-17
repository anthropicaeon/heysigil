"use client";

/**
 * Fee Claim Card
 *
 * Displays claimable USDC with loss aversion framing and urgency indicators.
 */

import Image from "next/image";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { LoadingButton } from "@/components/common/LoadingButton";

export interface FeeClaimCardProps {
    claimableUsdc: string;
    lifetimeUsdc: string;
    claiming: boolean;
    error: string | null;
    lastTxHash: string | null;
    loading: boolean;
    onClaim: () => void;
    onRefresh: () => void;
}

export function FeeClaimCard({
    claimableUsdc,
    lifetimeUsdc,
    claiming,
    error,
    lastTxHash,
    loading,
    onClaim,
    onRefresh,
}: FeeClaimCardProps) {
    const isZero = claimableUsdc === "$0.00";
    const claimableAmount = parseFloat(claimableUsdc.replace(/[$,]/g, "")) || 0;

    // Loss aversion: urgency levels based on amount
    const isHighValue = claimableAmount >= 100;
    const isMediumValue = claimableAmount >= 25;

    // Simulate days until expiry (in production, get from contract)
    const daysUntilExpiry = 23;
    const isNearExpiry = daysUntilExpiry <= 7;

    return (
        <div className={`fee-claim-card ${isHighValue ? "fee-claim-urgent" : ""}`}>
            <div className="fee-claim-header">
                <div>
                    <h3
                        style={{
                            margin: 0,
                            fontSize: "var(--text-sm)",
                            color: isHighValue ? "var(--warning)" : "var(--text-secondary)",
                        }}
                    >
                        {isZero ? "Claimable USDC" : "Unclaimed USDC"}
                    </h3>
                    <div
                        className="fee-claim-amount"
                        style={{ color: isHighValue ? "var(--warning)" : undefined }}
                    >
                        {loading ? (
                            <span className="spinner" style={{ width: 20, height: 20 }} />
                        ) : (
                            claimableUsdc
                        )}
                    </div>
                    {/* Loss aversion: urgency message */}
                    {!isZero && !loading && (
                        <p className={`fee-claim-urgency ${isNearExpiry ? "urgent" : ""}`}>
                            {isNearExpiry
                                ? `Claim within ${daysUntilExpiry} days or fees return to protocol`
                                : isMediumValue
                                  ? "Don't leave money on the table"
                                  : `${daysUntilExpiry} days to claim`}
                        </p>
                    )}
                </div>
                <button
                    type="button"
                    className="fee-claim-refresh"
                    onClick={onRefresh}
                    disabled={loading}
                    title="Refresh balances"
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                    </svg>
                </button>
            </div>

            <div className="fee-claim-stats">
                <div className="fee-claim-stat">
                    <span className="fee-label">Lifetime Earned</span>
                    <span className="fee-value">{lifetimeUsdc}</span>
                </div>
                {!isZero && (
                    <div className="fee-claim-stat">
                        <span className="fee-label">Expiry</span>
                        <span className={`fee-value ${isNearExpiry ? "fee-expiry-urgent" : ""}`}>
                            {daysUntilExpiry} days
                        </span>
                    </div>
                )}
            </div>

            <LoadingButton
                className={`fee-claim-btn ${isHighValue ? "fee-claim-btn-urgent" : ""}`}
                onClick={onClaim}
                loading={claiming}
                disabled={isZero || loading}
                loadingText="Claiming…"
            >
                <Image
                    src="/icons/coins-hand.svg"
                    alt=""
                    width={16}
                    height={16}
                    style={{
                        display: "inline",
                        verticalAlign: "middle",
                        marginRight: 6,
                        opacity: 0.7,
                    }}
                />
                {isZero ? "No USDC to Claim" : `Claim ${claimableUsdc} Now`}
            </LoadingButton>

            {/* Success toast */}
            {lastTxHash && !claiming && (
                <div className="fee-claim-success">
                    ✓ Claimed!{" "}
                    <a
                        href={`https://basescan.org/tx/${lastTxHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View tx ↗
                    </a>
                </div>
            )}

            {/* Error */}
            {error && <ErrorAlert error={error} className="fee-claim-error" />}
        </div>
    );
}
