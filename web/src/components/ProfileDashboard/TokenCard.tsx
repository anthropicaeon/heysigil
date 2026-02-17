"use client";

/**
 * Token Card
 *
 * Displays a single token with balance, governance info, and actions.
 */

import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatNumericString } from "@/lib/format";
import type { TokenInfo } from "@/types";

export const TokenCard = memo(function TokenCard({ token }: { token: TokenInfo }) {
    const isAboveThreshold =
        token.role === "holder" && parseFloat(token.balance.replace(/,/g, "")) >= 50_000_000;

    return (
        <div className="token-card">
            {/* Top: icon + name + role badge */}
            <div className="token-card-top">
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div className="token-card-icon" style={{ background: token.color }}>
                        {token.ticker.charAt(0)}
                    </div>
                    <div className="token-card-name">
                        <h3>{token.name}</h3>
                        <span className="ticker">${token.ticker}</span>
                    </div>
                </div>
                <span
                    className={`token-role-badge ${token.role === "dev" ? "role-dev" : "role-holder"}`}
                >
                    {token.role === "dev" ? (
                        <>
                            <Image
                                src="/icons/zap-fast.svg"
                                alt=""
                                width={12}
                                height={12}
                                style={{
                                    display: "inline",
                                    verticalAlign: "middle",
                                    marginRight: 3,
                                    opacity: 0.6,
                                }}
                            />{" "}
                            Developer
                        </>
                    ) : (
                        <>
                            <Image
                                src="/icons/coins-stacked-02.svg"
                                alt=""
                                width={12}
                                height={12}
                                style={{
                                    display: "inline",
                                    verticalAlign: "middle",
                                    marginRight: 3,
                                    opacity: 0.6,
                                }}
                            />{" "}
                            Holder
                        </>
                    )}
                </span>
            </div>

            {/* Stats */}
            <div className="token-card-stats">
                <div className="token-stat">
                    <div className="stat-value">{formatNumericString(token.balance)}</div>
                    <div className="stat-label">Your Balance</div>
                </div>
                <div className="token-stat">
                    <div className="stat-value">{formatNumericString(token.escrowBalance)}</div>
                    <div className="stat-label">In Escrow</div>
                </div>
            </div>

            {/* Governance info */}
            <div className="fee-row" style={{ marginBottom: "var(--space-4)" }}>
                <span className="fee-label">Active Proposals</span>
                <span className="fee-value">
                    {token.activeProposals} / {token.totalProposals}
                </span>
            </div>

            {/* Actions */}
            <div className="token-card-actions">
                <Link href={`/governance?token=${token.address}`} className="action-primary">
                    <Image
                        src="/icons/check-verified-02.svg"
                        alt=""
                        width={14}
                        height={14}
                        style={{
                            display: "inline",
                            verticalAlign: "middle",
                            marginRight: 4,
                            opacity: 0.6,
                        }}
                    />{" "}
                    Governance
                </Link>
                {token.role === "holder" && isAboveThreshold && (
                    <Link href={`/governance?token=${token.address}&action=propose`}>
                        <Image
                            src="/icons/check-verified-02.svg"
                            alt=""
                            width={14}
                            height={14}
                            style={{
                                display: "inline",
                                verticalAlign: "middle",
                                marginRight: 4,
                                opacity: 0.6,
                            }}
                        />{" "}
                        Propose
                    </Link>
                )}
                {token.role === "holder" && !isAboveThreshold && (
                    <span
                        style={{
                            flex: 1,
                            padding: "var(--space-2) var(--space-3)",
                            fontSize: "var(--text-xs)",
                            textAlign: "center",
                            color: "var(--text-tertiary)",
                        }}
                    >
                        Need 50M to propose
                    </span>
                )}
            </div>
        </div>
    );
});
