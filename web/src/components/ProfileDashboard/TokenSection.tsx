"use client";

/**
 * Token Section
 *
 * Displays a grid of tokens with optional header.
 */

import Image from "next/image";
import type { TokenInfo } from "@/types";
import { TokenCard } from "./TokenCard";

interface TokenSectionProps {
    tokens: TokenInfo[];
    title?: string;
    icon?: string;
    showHeader?: boolean;
}

export function TokenSection({ tokens, title, icon, showHeader = true }: TokenSectionProps) {
    if (tokens.length === 0) return null;

    return (
        <>
            {showHeader && title && (
                <div className="profile-section-header">
                    <h2>
                        {icon && (
                            <Image
                                src={icon}
                                alt=""
                                width={20}
                                height={20}
                                style={{
                                    display: "inline",
                                    verticalAlign: "middle",
                                    marginRight: 6,
                                    opacity: 0.6,
                                }}
                            />
                        )}
                        {title}
                    </h2>
                    <span className="section-count">{tokens.length} tokens</span>
                </div>
            )}
            <div className="token-grid">
                {tokens.map((t) => (
                    <TokenCard key={t.address} token={t} />
                ))}
            </div>
        </>
    );
}
