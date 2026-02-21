"use client";

import { ArrowRight, AlertTriangle, CheckCircle, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { parseEther, formatEther, type Address } from "viem";

import { Button } from "@/components/ui/button";
import { useOptionalPrivy, useOptionalWallets } from "@/hooks/useOptionalPrivy";
import { useMigratorRead } from "@/hooks/useMigratorRead";
import { useMigratorWrite } from "@/hooks/useMigratorWrite";
import { MIGRATOR_ADDRESS, V1_TOKEN_ADDRESS, V2_TOKEN_ADDRESS } from "@/lib/contracts/migrator";
import { publicClient } from "@/lib/contracts/migrator";

// ─── Constants ──────────────────────────────────────────

const ZERO = BigInt(0);

// ─── Page ───────────────────────────────────────────────

export default function MigratePage() {
    const { authenticated, login } = useOptionalPrivy();
    const { wallets } = useOptionalWallets();
    const walletAddress = wallets[0]?.address as Address | undefined;

    const data = useMigratorRead(walletAddress ?? null);
    const writer = useMigratorWrite();

    const [inputValue, setInputValue] = useState("");
    const [awaitingTx, setAwaitingTx] = useState(false);

    // Parse input amount
    const inputAmount = useMemo(() => {
        try {
            if (!inputValue || inputValue === "0") return ZERO;
            return parseEther(inputValue);
        } catch {
            return ZERO;
        }
    }, [inputValue]);

    // Determine what the user needs to do
    const needsApproval = inputAmount > ZERO && data.v1Allowance < inputAmount;
    const canMigrate = inputAmount > ZERO && inputAmount <= data.claimable && inputAmount <= data.v1Balance;
    const isFullyMigrated = data.allocation > ZERO && data.claimable === ZERO;

    // Set max amount (min of claimable and v1Balance)
    const handleMax = () => {
        const maxAmount = data.claimable < data.v1Balance ? data.claimable : data.v1Balance;
        if (maxAmount > ZERO) {
            setInputValue(formatEther(maxAmount));
        }
    };

    // Approve V1 tokens
    const handleApprove = async () => {
        if (!inputAmount) return;
        setAwaitingTx(true);
        const hash = await writer.approve(inputAmount);
        if (hash) {
            // Wait for tx confirmation
            await publicClient.waitForTransactionReceipt({ hash });
            data.refetch();
        }
        setAwaitingTx(false);
    };

    // Migrate tokens
    const handleMigrate = async () => {
        if (!inputAmount) return;
        setAwaitingTx(true);
        const hash = await writer.migrate(inputAmount);
        if (hash) {
            await publicClient.waitForTransactionReceipt({ hash });
            data.refetch();
            setInputValue("");
        }
        setAwaitingTx(false);
    };

    const shortenAddress = (addr: string) =>
        `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <section className="min-h-screen bg-sage/30 relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-screen px-0">

                {/* ─── Header Band ──────────────────────────── */}
                <div className="border-border border-b px-6 py-12 lg:px-12 lg:py-16 bg-background">
                    <div className="max-w-xl">
                        <p className="text-primary text-sm font-medium uppercase tracking-wider mb-4">
                            token migration
                        </p>
                        <h1 className="text-3xl lg:text-4xl font-semibold text-foreground mb-4 lowercase">
                            v1 → v2 migration
                        </h1>
                        <p className="text-muted-foreground">
                            Swap your V1 HeySigil tokens for V2 SIGIL. 1:1 ratio, no fees. Connect your wallet to check your allocation and migrate.
                        </p>
                    </div>
                </div>

                {/* ─── Status Band ──────────────────────────── */}
                <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                    <div className="flex items-center gap-3">
                        {data.paused ? (
                            <>
                                <div className="size-2 bg-destructive animate-pulse" />
                                <span className="text-sm font-medium text-destructive">Migration paused</span>
                            </>
                        ) : (
                            <>
                                <div className="size-2 bg-green-500 animate-pulse" />
                                <span className="text-sm font-medium text-green-700">Migration active</span>
                            </>
                        )}
                    </div>
                </div>

                {/* ─── Wallet Band ──────────────────────────── */}
                {!authenticated || !walletAddress ? (
                    <div className="px-6 py-12 lg:px-12 border-border border-b bg-background">
                        <div className="max-w-md mx-auto text-center">
                            <div className="size-16 bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                <ArrowRight className="size-7 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground mb-3 lowercase">
                                connect your wallet
                            </h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Connect the wallet that holds your V1 HeySigil tokens to check your migration allocation.
                            </p>
                            <Button size="lg" onClick={() => login?.()}>
                                Connect Wallet
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Connected wallet header */}
                        <div className="px-6 py-4 lg:px-12 border-border border-b bg-background flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="size-2 bg-green-500" />
                                <span className="text-sm text-muted-foreground">
                                    Connected: <span className="font-medium text-foreground">{shortenAddress(walletAddress)}</span>
                                </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={data.refetch} disabled={data.loading}>
                                <RefreshCw className={`size-3.5 ${data.loading ? "animate-spin" : ""}`} />
                            </Button>
                        </div>

                        {/* ─── No Allocation State ──────────────── */}
                        {!data.loading && data.allocation === ZERO && (
                            <div className="px-6 py-12 lg:px-12 border-border border-b bg-background">
                                <div className="max-w-md mx-auto text-center">
                                    <div className="size-16 bg-rose/50 flex items-center justify-center mx-auto mb-6">
                                        <AlertTriangle className="size-7 text-destructive" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-foreground mb-3 lowercase">
                                        no allocation found
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        This wallet ({shortenAddress(walletAddress)}) was not included in the V1 snapshot. Only wallets that held V1 HeySigil tokens at the time of the snapshot are eligible.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ─── Fully Migrated State ──────────────── */}
                        {!data.loading && isFullyMigrated && (
                            <div className="px-6 py-12 lg:px-12 border-border border-b bg-background">
                                <div className="max-w-md mx-auto text-center">
                                    <div className="size-16 bg-green-100 flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle className="size-7 text-green-600" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-foreground mb-3 lowercase">
                                        migration complete
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        You have migrated all {data.allocationFormatted} tokens. Your V2 SIGIL balance is {data.v2BalanceFormatted}.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ─── Loading State ───────────────────── */}
                        {data.loading && (
                            <div className="px-6 py-12 lg:px-12 border-border border-b bg-background flex items-center justify-center">
                                <Loader2 className="size-6 text-primary animate-spin" />
                                <span className="ml-3 text-muted-foreground">Loading migration data...</span>
                            </div>
                        )}

                        {/* ─── Allocation + Action Panel ────────── */}
                        {!data.loading && data.allocation > ZERO && data.claimable > ZERO && (
                            <>
                                {/* Allocation section header */}
                                <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                                    <h2 className="text-lg font-semibold text-foreground lowercase">your allocation</h2>
                                </div>

                                {/* Stats grid */}
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-border border-b">
                                    <div className="px-6 py-5 border-border border-b sm:border-b-0 sm:border-r">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Allocation</p>
                                        <p className="text-xl font-semibold text-foreground">{data.allocationFormatted}</p>
                                        <p className="text-xs text-muted-foreground">V2 tokens reserved</p>
                                    </div>
                                    <div className="px-6 py-5 border-border border-b sm:border-b-0 lg:border-r">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Claimed</p>
                                        <p className="text-xl font-semibold text-foreground">{data.claimedFormatted}</p>
                                        <p className="text-xs text-muted-foreground">Already migrated</p>
                                    </div>
                                    <div className="px-6 py-5 border-border border-b sm:border-r sm:border-b-0">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
                                        <p className="text-xl font-semibold text-primary">{data.claimableFormatted}</p>
                                        <p className="text-xs text-muted-foreground">Still claimable</p>
                                    </div>
                                    <div className="px-6 py-5">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">V1 Balance</p>
                                        <p className="text-xl font-semibold text-foreground">{data.v1BalanceFormatted}</p>
                                        <p className="text-xs text-muted-foreground">In your wallet</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="px-6 py-4 lg:px-12 border-border border-b bg-background">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-muted-foreground">Migration progress</span>
                                        <span className="text-xs font-medium text-foreground">
                                            {data.allocation > ZERO
                                                ? `${((Number(data.claimed) / Number(data.allocation)) * 100).toFixed(1)}%`
                                                : "0%"}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-secondary">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{
                                                width: data.allocation > ZERO
                                                    ? `${(Number(data.claimed) / Number(data.allocation)) * 100}%`
                                                    : "0%",
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Migrate section header */}
                                <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                                    <h2 className="text-lg font-semibold text-foreground lowercase">migrate tokens</h2>
                                </div>

                                {/* Input + Action area */}
                                <div className="px-6 py-8 lg:px-12 border-border border-b bg-background">
                                    <div className="max-w-lg">
                                        {/* Amount input */}
                                        <div className="mb-6">
                                            <label className="text-sm font-medium text-foreground mb-2 block">
                                                Amount to migrate
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="0.00"
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    className="flex-1 h-12 px-4 border border-border bg-background text-foreground text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                                                    disabled={data.paused || awaitingTx}
                                                />
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    onClick={handleMax}
                                                    disabled={data.paused || awaitingTx}
                                                >
                                                    Max
                                                </Button>
                                            </div>
                                            {inputAmount > data.claimable && inputAmount > ZERO && (
                                                <p className="text-xs text-destructive mt-2">
                                                    Amount exceeds your remaining allocation of {data.claimableFormatted}
                                                </p>
                                            )}
                                            {inputAmount > data.v1Balance && inputAmount > ZERO && inputAmount <= data.claimable && (
                                                <p className="text-xs text-destructive mt-2">
                                                    Amount exceeds your V1 balance of {data.v1BalanceFormatted}
                                                </p>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex flex-col gap-3">
                                            {needsApproval && canMigrate && (
                                                <Button
                                                    size="lg"
                                                    variant="outline"
                                                    onClick={handleApprove}
                                                    disabled={awaitingTx || data.paused}
                                                    className="w-full"
                                                >
                                                    {awaitingTx && writer.state.step === "approving" ? (
                                                        <>
                                                            <Loader2 className="size-4 animate-spin" />
                                                            Approving V1 tokens...
                                                        </>
                                                    ) : (
                                                        <>Step 1: Approve V1 tokens</>
                                                    )}
                                                </Button>
                                            )}

                                            <Button
                                                size="lg"
                                                onClick={handleMigrate}
                                                disabled={!canMigrate || needsApproval || awaitingTx || data.paused}
                                                className="w-full"
                                            >
                                                {awaitingTx && writer.state.step === "migrating" ? (
                                                    <>
                                                        <Loader2 className="size-4 animate-spin" />
                                                        Migrating...
                                                    </>
                                                ) : needsApproval ? (
                                                    <>Step 2: Migrate to V2</>
                                                ) : (
                                                    <>
                                                        Migrate to V2
                                                        <ArrowRight className="size-4" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>

                                        {/* Error */}
                                        {writer.state.error && (
                                            <div className="mt-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                                {writer.state.error}
                                            </div>
                                        )}

                                        {/* Success */}
                                        {writer.state.step === "done" && writer.state.txHash && (
                                            <div className="mt-4 px-4 py-3 bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
                                                <CheckCircle className="size-4" />
                                                Migration successful!{" "}
                                                <a
                                                    href={`https://basescan.org/tx/${writer.state.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="underline font-medium inline-flex items-center gap-1"
                                                >
                                                    View on Basescan <ExternalLink className="size-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ─── V2 Balance Band ──────────────────── */}
                        {!data.loading && data.v2Balance > ZERO && (
                            <div className="px-6 py-5 lg:px-12 border-border border-b bg-lavender/50 flex items-center gap-4">
                                <div className="size-10 bg-primary/10 flex items-center justify-center">
                                    <CheckCircle className="size-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-foreground">V2 SIGIL Balance</p>
                                    <p className="text-xs text-muted-foreground">Your current V2 holdings</p>
                                </div>
                                <span className="text-lg font-semibold text-foreground">{data.v2BalanceFormatted}</span>
                            </div>
                        )}
                    </>
                )}

                {/* ─── Info Band ────────────────────────────── */}
                <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                    <h2 className="text-lg font-semibold text-foreground lowercase">how it works</h2>
                </div>

                <div className="divide-y divide-border">
                    <div className="px-6 py-5 lg:px-12 bg-background">
                        <h3 className="font-medium text-foreground mb-1">What is this?</h3>
                        <p className="text-sm text-muted-foreground">
                            Sigil has upgraded from V1 (HeySigil) to V2 (SIGIL). If you held V1 tokens at the time of the snapshot,
                            you can swap them 1:1 for V2 tokens here.
                        </p>
                    </div>
                    <div className="px-6 py-5 lg:px-12 bg-background">
                        <h3 className="font-medium text-foreground mb-1">What happens to my V1 tokens?</h3>
                        <p className="text-sm text-muted-foreground">
                            Your V1 tokens are deposited into the migration contract when you swap. They cannot be reclaimed — the swap is permanent.
                        </p>
                    </div>
                    <div className="px-6 py-5 lg:px-12 bg-background">
                        <h3 className="font-medium text-foreground mb-1">Can I migrate partially?</h3>
                        <p className="text-sm text-muted-foreground">
                            Yes. You can migrate any amount up to your remaining allocation. You can come back and migrate more at any time.
                        </p>
                    </div>
                </div>

                {/* ─── Contracts Band ───────────────────────── */}
                <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                    <h2 className="text-lg font-semibold text-foreground lowercase">contract addresses</h2>
                </div>

                <div className="divide-y divide-border">
                    {[
                        { label: "SigilMigrator", address: MIGRATOR_ADDRESS },
                        { label: "V1 HeySigil", address: V1_TOKEN_ADDRESS },
                        { label: "V2 SIGIL", address: V2_TOKEN_ADDRESS },
                    ].map(({ label, address }) => (
                        <div key={label} className="px-6 py-4 lg:px-12 bg-background flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{label}</span>
                            <a
                                href={`https://basescan.org/address/${address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary flex items-center gap-1 hover:underline"
                            >
                                {shortenAddress(address)}
                                <ExternalLink className="size-3" />
                            </a>
                        </div>
                    ))}
                </div>

                {/* Bottom padding */}
                <div className="h-16" />
            </div>
        </section>
    );
}
