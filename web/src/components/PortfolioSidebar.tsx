"use client";

/**
 * PortfolioSidebar Component
 *
 * Border-centric wallet sidebar with full-height sections.
 * Displays wallet info, balances, and quick actions including withdraw.
 */

import {
    ArrowDown,
    ArrowUpRight,
    Check,
    ChevronLeft,
    Copy,
    ExternalLink,
    Loader2,
    RefreshCw,
    User,
    Wallet,
    X,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getTokenColor, TOKEN_COLORS } from "@/config/token-colors";
import { getUserDisplay, useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { useWalletPolling } from "@/hooks/useWalletPolling";
import { apiClient } from "@/lib/api-client";
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
    const [showWithdraw, setShowWithdraw] = useState(false);
    const [withdrawTo, setWithdrawTo] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawToken, setWithdrawToken] = useState("ETH");
    const [withdrawing, setWithdrawing] = useState(false);
    const [withdrawResult, setWithdrawResult] = useState<{
        success?: boolean;
        txHash?: string;
        error?: string;
    } | null>(null);

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

    const ethBalance = wallet?.balance ? parseFloat(wallet.balance.eth) : 0;
    const hasTokens = wallet?.balance?.tokens && wallet.balance.tokens.length > 0;

    // Build the list of available tokens for withdraw dropdown
    const availableTokens = ["ETH"];
    if (wallet?.balance?.tokens) {
        for (const t of wallet.balance.tokens) {
            if (!availableTokens.includes(t.symbol)) {
                availableTokens.push(t.symbol);
            }
        }
    }

    const handleWithdraw = async () => {
        if (!withdrawTo || !withdrawAmount) return;

        setWithdrawing(true);
        setWithdrawResult(null);

        try {
            const token = await privy?.getAccessToken?.();
            if (!token) {
                setWithdrawResult({ error: "Not authenticated" });
                return;
            }

            const result = await apiClient.wallet.withdraw(
                token,
                withdrawTo,
                withdrawAmount,
                withdrawToken,
            );

            setWithdrawResult({ success: true, txHash: result.txHash });
            // Refresh balance after withdrawal
            setTimeout(() => refreshBalance(), 2000);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Withdrawal failed";
            setWithdrawResult({ error: msg });
        } finally {
            setWithdrawing(false);
        }
    };

    const resetWithdraw = () => {
        setShowWithdraw(false);
        setWithdrawTo("");
        setWithdrawAmount("");
        setWithdrawToken("ETH");
        setWithdrawResult(null);
    };

    // Collapsed state
    if (collapsed) {
        return (
            <div
                className="w-14 bg-background flex flex-col cursor-pointer hover:bg-secondary/20 transition-colors"
                onClick={onToggle}
            >
                {/* Collapsed Header */}
                <div className="py-4 border-b border-border flex justify-center">
                    <div className="size-8 bg-lavender/50 flex items-center justify-center text-primary border border-border">
                        <Wallet className="size-4" />
                    </div>
                </div>
                {/* Status indicator */}
                <div className="flex-1 flex flex-col items-center py-4 gap-2">
                    {wallet?.exists && <div className="size-2 bg-green-500" />}
                    {isAuthenticated && (
                        <div className="size-6 bg-lavender/50 flex items-center justify-center text-xs font-medium text-primary border border-border">
                            {userInfo?.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                {/* Network badge */}
                <div className="py-3 border-t border-border flex justify-center">
                    <div className="size-2 bg-green-500" />
                </div>
            </div>
        );
    }

    // Expanded state
    return (
        <div className="w-72 bg-background flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Portfolio
                </span>
                <button
                    type="button"
                    onClick={onToggle}
                    className="size-6 hover:bg-background flex items-center justify-center transition-colors border border-border"
                    title="Collapse"
                >
                    <ChevronLeft className="size-3 text-muted-foreground" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                {/* User identity section */}
                {isAuthenticated && userInfo && (
                    <>
                        <div className="px-4 py-2 border-b border-border bg-sage/20">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Account
                            </span>
                        </div>
                        <div className="px-4 py-4 border-b border-border">
                            <div className="flex items-center gap-3">
                                <div className="size-10 bg-lavender/50 flex items-center justify-center shrink-0 border border-border">
                                    <span className="text-sm font-semibold text-primary">
                                        {userInfo.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground truncate">
                                        {userInfo.name}
                                    </p>
                                    {userInfo.provider && (
                                        <p className="text-xs text-muted-foreground">
                                            via {userInfo.provider}
                                        </p>
                                    )}
                                </div>
                                <div className="size-2 bg-green-500" />
                            </div>
                        </div>
                    </>
                )}

                {/* Not signed in state */}
                {!isAuthenticated && privy && (
                    <>
                        <div className="px-4 py-2 border-b border-border bg-sage/20">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Get Started
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 border-b border-border bg-cream/20" />
                            <div className="px-4 py-6 border-b border-border flex justify-center bg-lavender/10">
                                <div className="size-14 bg-background border border-border flex items-center justify-center">
                                    <User className="size-7 text-primary" />
                                </div>
                            </div>
                            <div className="px-4 py-3 border-b border-border text-center">
                                <p className="text-sm font-semibold text-foreground lowercase">
                                    sign in to get started
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Log in with GitHub, Telegram, or email
                                </p>
                            </div>
                            <div className="px-4 py-4 border-b border-border">
                                <Button
                                    onClick={() => privy.login?.()}
                                    className="w-full"
                                    size="sm"
                                >
                                    Sign In
                                </Button>
                            </div>
                            <div className="flex-1 bg-sage/10" />
                        </div>
                    </>
                )}

                {/* No wallet state */}
                {!wallet?.exists && (isAuthenticated || !privy) && (
                    <>
                        <div className="px-4 py-2 border-b border-border bg-sage/20">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Wallet
                            </span>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 border-b border-border bg-cream/20" />
                            <div className="px-4 py-6 border-b border-border flex justify-center bg-lavender/10">
                                <div className="size-14 bg-background border border-border flex items-center justify-center">
                                    <Wallet className="size-7 text-primary" />
                                </div>
                            </div>
                            <div className="px-4 py-3 border-b border-border text-center">
                                <p className="text-sm font-semibold text-foreground lowercase">
                                    {loading ? "creating wallet..." : "no wallet yet"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {loading ? "Please wait" : "Create a wallet to start trading"}
                                </p>
                            </div>
                            <div className="px-4 py-4 border-b border-border">
                                <Button
                                    onClick={createWallet}
                                    disabled={loading || (!sessionId && !isAuthenticated)}
                                    className="w-full"
                                    size="sm"
                                >
                                    {loading ? "Creating..." : "Create Wallet"}
                                </Button>
                            </div>
                            <div className="flex-1 bg-sage/10" />
                        </div>
                    </>
                )}

                {/* Error state */}
                {error && (
                    <div className="px-4 py-3 border-b border-border bg-red-50">
                        <p className="text-xs text-red-600">{error}</p>
                    </div>
                )}

                {/* Wallet exists - show details */}
                {wallet?.exists && (
                    <>
                        {/* Address section */}
                        <div className="px-4 py-2 border-b border-border bg-sage/20">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Address
                                </span>
                                <button
                                    type="button"
                                    onClick={copyAddress}
                                    className="size-5 hover:bg-background flex items-center justify-center transition-colors"
                                    title="Copy address"
                                >
                                    {copied ? (
                                        <Check className="size-3 text-green-500" />
                                    ) : (
                                        <Copy className="size-3 text-muted-foreground" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="px-4 py-3 border-b border-border">
                            <p className="text-sm font-mono text-foreground">
                                {wallet.address
                                    ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}`
                                    : "—"}
                            </p>
                        </div>

                        {/* Balance section */}
                        <div className="px-4 py-2 border-b border-border bg-sage/20">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    Balance
                                </span>
                                <button
                                    type="button"
                                    onClick={refreshBalance}
                                    className={cn(
                                        "size-5 hover:bg-background flex items-center justify-center transition-colors",
                                        refreshing && "animate-spin",
                                    )}
                                    title="Refresh"
                                >
                                    <RefreshCw className="size-3 text-muted-foreground" />
                                </button>
                            </div>
                        </div>
                        <div className="border-b border-border divide-y divide-border">
                            {/* ETH balance */}
                            <div className="px-4 py-3 flex items-center gap-3">
                                <div
                                    className="size-8 flex items-center justify-center text-white font-bold text-xs border border-border"
                                    style={{ background: TOKEN_COLORS.ETH }}
                                >
                                    Ξ
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">
                                        {ethBalance.toFixed(ethBalance < 0.001 && ethBalance > 0 ? 6 : 4)} ETH
                                    </p>
                                </div>
                            </div>

                            {/* Token balances */}
                            {hasTokens &&
                                wallet.balance?.tokens.map((token) => (
                                    <div key={token.symbol} className="px-4 py-3 flex items-center gap-3">
                                        <div
                                            className="size-8 flex items-center justify-center text-white text-xs font-medium border border-border"
                                            style={{ background: getTokenColor(token.symbol) }}
                                        >
                                            {token.symbol.charAt(0)}
                                        </div>
                                        <div className="flex-1 flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">
                                                {token.symbol}
                                            </span>
                                            <span className="text-sm font-medium text-foreground">
                                                {parseFloat(token.balance).toFixed(
                                                    parseFloat(token.balance) < 1 ? 4 : 2,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                            {/* Empty balance hint */}
                            {ethBalance === 0 && !hasTokens && (
                                <div className="px-4 py-3 bg-cream/30">
                                    <p className="text-xs text-muted-foreground">
                                        Send ETH on Base to get started
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Quick Actions section */}
                        <div className="px-4 py-2 border-b border-border bg-sage/20">
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                Quick Actions
                            </span>
                        </div>
                        <div className="px-4 py-3 border-b border-border">
                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={copyAddress}
                                    className="gap-1.5"
                                >
                                    <ArrowDown className="size-3.5" />
                                    Deposit
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowWithdraw(!showWithdraw)}
                                    className="gap-1.5"
                                >
                                    <ArrowUpRight className="size-3.5" />
                                    Send
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="gap-1.5"
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
                                        <ExternalLink className="size-3.5" />
                                        Explorer
                                    </a>
                                </Button>
                            </div>
                        </div>

                        {/* Withdraw form */}
                        {showWithdraw && (
                            <>
                                <div className="px-4 py-2 border-b border-border bg-lavender/20">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                            Send / Withdraw
                                        </span>
                                        <button
                                            type="button"
                                            onClick={resetWithdraw}
                                            className="size-5 hover:bg-background flex items-center justify-center transition-colors"
                                        >
                                            <X className="size-3 text-muted-foreground" />
                                        </button>
                                    </div>
                                </div>
                                <div className="px-4 py-3 border-b border-border space-y-3">
                                    {/* Token selector */}
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">
                                            Token
                                        </label>
                                        <select
                                            value={withdrawToken}
                                            onChange={(e) => setWithdrawToken(e.target.value)}
                                            className="w-full text-sm border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            {availableTokens.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Destination address */}
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">
                                            To Address
                                        </label>
                                        <input
                                            type="text"
                                            value={withdrawTo}
                                            onChange={(e) => setWithdrawTo(e.target.value)}
                                            placeholder="0x..."
                                            className="w-full text-sm font-mono border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                                        />
                                    </div>

                                    {/* Amount */}
                                    <div>
                                        <label className="text-xs text-muted-foreground block mb-1">
                                            Amount
                                        </label>
                                        <input
                                            type="text"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            placeholder="0.01"
                                            className="w-full text-sm border border-border bg-background px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                                        />
                                    </div>

                                    {/* Submit */}
                                    <Button
                                        size="sm"
                                        className="w-full gap-1.5"
                                        onClick={handleWithdraw}
                                        disabled={withdrawing || !withdrawTo || !withdrawAmount}
                                    >
                                        {withdrawing ? (
                                            <>
                                                <Loader2 className="size-3.5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <ArrowUpRight className="size-3.5" />
                                                Send {withdrawToken}
                                            </>
                                        )}
                                    </Button>

                                    {/* Result */}
                                    {withdrawResult?.success && (
                                        <div className="p-2 bg-green-50 border border-green-200 text-xs">
                                            <p className="text-green-700 font-medium">✓ Sent successfully</p>
                                            {withdrawResult.txHash && (
                                                <a
                                                    href={`https://basescan.org/tx/${withdrawResult.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-green-600 underline mt-1 block truncate"
                                                >
                                                    View on BaseScan →
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    {withdrawResult?.error && (
                                        <div className="p-2 bg-red-50 border border-red-200 text-xs">
                                            <p className="text-red-700">{withdrawResult.error}</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Spacer */}
                        <div className="flex-1 bg-cream/10" />
                    </>
                )}
            </div>

            {/* Footer - Network Status */}
            <div className="px-4 py-3 border-t border-border bg-secondary/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-2 bg-green-500" />
                        <span className="text-xs text-muted-foreground">Base Mainnet</span>
                    </div>
                    <span className="text-xs text-muted-foreground">L2</span>
                </div>
            </div>
        </div>
    );
}
