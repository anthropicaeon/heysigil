"use client";

/**
 * PortfolioSidebar Component
 *
 * Displays wallet info, balances, and quick actions.
 * Adapted for www design aesthetic using Tailwind and shadcn patterns.
 */

import {
    ArrowDown,
    Check,
    ChevronLeft,
    Copy,
    ExternalLink,
    RefreshCw,
    User,
    Wallet,
} from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { ErrorAlert } from "@/components/common/ErrorAlert";
import { Button } from "@/components/ui/button";
import { getTokenColor, TOKEN_COLORS } from "@/config/token-colors";
import { getUserDisplay, useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { useWalletPolling } from "@/hooks/useWalletPolling";
import { cn } from "@/lib/utils";

interface PortfolioSidebarProps {
    sessionId: string | null;
    collapsed: boolean;
    onToggle: () => void;
}

export default function PortfolioSidebar({
    sessionId,
    collapsed,
    onToggle,
}: PortfolioSidebarProps) {
    const [copied, setCopied] = useState(false);

    const privy = useOptionalPrivy();
    const isAuthenticated = privy?.authenticated ?? false;
    const userInfo = getUserDisplay(privy);

    const { wallet, loading, refreshing, error, createWallet, refreshBalance } =
        useWalletPolling(sessionId);

    const copyAddress = async () => {
        if (!wallet?.address) return;
        await navigator.clipboard.writeText(wallet.address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Compute total portfolio value (just ETH for now)
    const ethBalance = wallet?.balance ? parseFloat(wallet.balance.eth) : 0;
    const hasTokens = wallet?.balance?.tokens && wallet.balance.tokens.length > 0;

    if (collapsed) {
        return (
            <div
                className="w-14 border-l border-border bg-background flex flex-col items-center py-4 cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={onToggle}
            >
                <div className="size-10 bg-lavender flex items-center justify-center text-primary border border-border">
                    <Wallet className="size-5" />
                </div>
                {wallet?.exists && <div className="size-2 bg-green-500 mt-2" />}
            </div>
        );
    }

    return (
        <div className="w-72 border-l border-border bg-background flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="font-semibold text-foreground">Portfolio</h3>
                <button
                    type="button"
                    onClick={onToggle}
                    className="size-8 hover:bg-secondary/50 flex items-center justify-center transition-colors"
                    title="Collapse"
                >
                    <ChevronLeft className="size-4 text-muted-foreground" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* User identity */}
                {isAuthenticated && userInfo && (
                    <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-3">
                            <div className="size-10 bg-lavender flex items-center justify-center shrink-0 border border-border">
                                <span className="text-sm font-semibold text-primary">
                                    {userInfo.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {userInfo.name}
                                </p>
                                {userInfo.provider && (
                                    <p className="text-xs text-muted-foreground">
                                        via {userInfo.provider}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Not signed in — prompt to login */}
                {!isAuthenticated && privy && (
                    <EmptyState
                        icon={<User className="size-8" />}
                        title="Sign in to get started"
                        description="Log in with GitHub, Telegram, or email to create a wallet and start trading."
                        action={{
                            label: "Sign In",
                            onClick: () => privy.login?.(),
                        }}
                    />
                )}

                {/* No wallet state — only show for authenticated users or when Privy isn't configured */}
                {!wallet?.exists && (isAuthenticated || !privy) && (
                    <EmptyState
                        icon={<Wallet className="size-8" />}
                        title="No wallet yet"
                        description="Create a wallet to start trading directly from chat."
                        action={{
                            label: "Create Wallet",
                            onClick: createWallet,
                            disabled: loading || !sessionId,
                            loading: loading,
                        }}
                    />
                )}

                {error && <ErrorAlert error={error} />}

                {/* Wallet info */}
                {wallet?.exists && (
                    <>
                        {/* Address card */}
                        <div className="px-4 py-3 border-b border-border">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Address
                                </span>
                                <button
                                    type="button"
                                    onClick={copyAddress}
                                    className="size-6 hover:bg-secondary/50 flex items-center justify-center transition-colors"
                                    title="Copy address"
                                >
                                    {copied ? (
                                        <Check className="size-3.5 text-green-500" />
                                    ) : (
                                        <Copy className="size-3.5 text-muted-foreground" />
                                    )}
                                </button>
                            </div>
                            <p className="text-sm font-mono text-foreground">
                                {wallet.address
                                    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
                                    : "—"}
                            </p>
                        </div>

                        {/* Balance section */}
                        <div className="px-4 py-3 border-b border-border">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Balance
                                </span>
                                <button
                                    type="button"
                                    onClick={refreshBalance}
                                    className={cn(
                                        "size-6 hover:bg-secondary/50 flex items-center justify-center transition-colors",
                                        refreshing && "animate-spin",
                                    )}
                                    title="Refresh"
                                >
                                    <RefreshCw className="size-3.5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* ETH balance */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="size-10 flex items-center justify-center text-white font-bold text-sm border border-border"
                                    style={{ background: TOKEN_COLORS.ETH }}
                                >
                                    Ξ
                                </div>
                                <p className="text-lg font-semibold text-foreground">
                                    {ethBalance.toFixed(
                                        ethBalance < 0.001 && ethBalance > 0 ? 6 : 4,
                                    )}{" "}
                                    ETH
                                </p>
                            </div>

                            {/* Token balances */}
                            {hasTokens && (
                                <div className="space-y-2">
                                    {wallet.balance?.tokens.map((token) => (
                                        <div key={token.symbol} className="flex items-center gap-2">
                                            <div
                                                className="size-6 flex items-center justify-center text-white text-xs font-medium border border-border"
                                                style={{
                                                    background: getTokenColor(token.symbol),
                                                }}
                                            >
                                                {token.symbol.charAt(0)}
                                            </div>
                                            <span className="text-sm text-muted-foreground flex-1">
                                                {token.symbol}
                                            </span>
                                            <span className="text-sm font-medium text-foreground">
                                                {parseFloat(token.balance).toFixed(
                                                    parseFloat(token.balance) < 1 ? 4 : 2,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {ethBalance === 0 && !hasTokens && (
                                <p className="text-sm text-muted-foreground">
                                    Send ETH on Base to your address above to get started.
                                </p>
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="px-4 py-3 border-b border-border">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-3">
                                Quick Actions
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyAddress}
                                    className="flex-1 gap-2"
                                >
                                    <ArrowDown className="size-4" />
                                    Deposit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="flex-1 gap-2"
                                >
                                    <a
                                        href={
                                            wallet.address
                                                ? `https://basescan.org/address/${wallet.address}`
                                                : "#"
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <ExternalLink className="size-4" />
                                        Explorer
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* Network badge */}
                        <div className="px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="size-2 bg-green-500" />
                                <span className="text-xs text-muted-foreground">Base Mainnet</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
