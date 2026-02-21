"use client";

import { AlertTriangle, CheckCircle, Loader2, RefreshCw, ExternalLink, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import type { Address } from "viem";

import { Button } from "@/components/ui/button";
import { useOptionalPrivy, useOptionalWallets } from "@/hooks/useOptionalPrivy";
import { useMigrationStatus } from "@/hooks/useMigrationStatus";
import { MIGRATOR_ADDRESS, V1_TOKEN_ADDRESS, V2_TOKEN_ADDRESS } from "@/lib/contracts/migrator";

// ─── Constants ──────────────────────────────────────────

const ZERO = BigInt(0);
const RELAYER_ADDRESS_FALLBACK = process.env.NEXT_PUBLIC_MIGRATION_RELAYER_ADDRESS ?? "";

// ─── Page ───────────────────────────────────────────────

export default function MigratePage() {
    const { authenticated, login } = useOptionalPrivy();
    const { wallets } = useOptionalWallets();
    const walletAddress = wallets[0]?.address as Address | undefined;

    const data = useMigrationStatus(walletAddress ?? null);
    const [copied, setCopied] = useState(false);

    const relayerAddress = data.relayerAddress || RELAYER_ADDRESS_FALLBACK;
    const isFullyMigrated = data.allocation > ZERO && data.remaining === ZERO;

    const handleCopy = useCallback(() => {
        if (!relayerAddress) return;
        navigator.clipboard.writeText(relayerAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }, [relayerAddress]);

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
                            Swap your V1 HeySigil tokens for V2 SIGIL. 1:1 ratio, no fees.
                            Send your V1 tokens to the address below and receive V2 automatically.
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

                {/* ─── Send To Address ─────────────────────── */}
                <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                    <h2 className="text-lg font-semibold text-foreground lowercase">
                        send v1 tokens here
                    </h2>
                </div>

                <div className="px-6 py-8 lg:px-12 border-border border-b bg-background">
                    <div className="max-w-lg">
                        <p className="text-sm text-muted-foreground mb-4">
                            Send your V1 HeySigil tokens to this address. Our relayer will automatically
                            send V2 SIGIL back to your wallet within ~30 seconds.
                        </p>

                        {/* Relayer address box */}
                        {relayerAddress ? (
                            <div className="border border-border bg-secondary/20 p-4 mb-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                                            Migration Address
                                        </p>
                                        <p className="text-sm font-mono font-medium text-foreground break-all">
                                            {relayerAddress}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCopy}
                                        className="shrink-0"
                                    >
                                        {copied ? (
                                            <><Check className="size-3.5" /> Copied</>
                                        ) : (
                                            <><Copy className="size-3.5" /> Copy</>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="border border-border bg-destructive/5 p-4 mb-4">
                                <p className="text-sm text-destructive">
                                    Migration relayer address not configured.
                                </p>
                            </div>
                        )}

                        {/* Steps */}
                        <div className="space-y-3 text-sm">
                            <div className="flex gap-3">
                                <div className="size-6 bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">1</div>
                                <p className="text-muted-foreground">Send V1 HeySigil tokens to the address above from your wallet</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="size-6 bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">2</div>
                                <p className="text-muted-foreground">Our relayer checks your snapshot allocation automatically</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="size-6 bg-primary/10 flex items-center justify-center shrink-0 text-xs font-semibold text-primary">3</div>
                                <p className="text-muted-foreground">V2 SIGIL sent to your wallet automatically</p>
                            </div>
                        </div>

                        <div className="mt-4 px-4 py-3 bg-lavender/30 border border-lavender text-sm text-foreground">
                            <strong>Not whitelisted?</strong> If your address isn&apos;t in the V1 snapshot,
                            your tokens are returned automatically. No risk.
                        </div>
                    </div>
                </div>

                {/* ─── Wallet / Status ────────────────────── */}
                {!authenticated || !walletAddress ? (
                    <div className="px-6 py-8 lg:px-12 border-border border-b bg-background">
                        <div className="max-w-md mx-auto text-center">
                            <h2 className="text-lg font-semibold text-foreground mb-3 lowercase">
                                check your allocation
                            </h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                Connect your wallet to see your V1 allocation and migration status.
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

                        {/* ─── Error State ───────────────────── */}
                        {!data.loading && data.error && (
                            <div className="px-6 py-8 lg:px-12 border-border border-b bg-background">
                                <div className="max-w-md mx-auto text-center">
                                    <div className="size-16 bg-rose/50 flex items-center justify-center mx-auto mb-6">
                                        <AlertTriangle className="size-7 text-destructive" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-foreground mb-3 lowercase">
                                        error loading migration data
                                    </h2>
                                    <p className="text-muted-foreground text-sm mb-4 break-all">
                                        {data.error}
                                    </p>
                                    <Button variant="outline" size="sm" onClick={data.refetch}>
                                        <RefreshCw className="size-3.5 mr-2" /> Retry
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* ─── No Allocation State ────────────── */}
                        {!data.loading && !data.error && data.allocation === ZERO && (
                            <div className="px-6 py-12 lg:px-12 border-border border-b bg-background">
                                <div className="max-w-md mx-auto text-center">
                                    <div className="size-16 bg-rose/50 flex items-center justify-center mx-auto mb-6">
                                        <AlertTriangle className="size-7 text-destructive" />
                                    </div>
                                    <h2 className="text-lg font-semibold text-foreground mb-3 lowercase">
                                        no allocation found
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        This wallet ({shortenAddress(walletAddress)}) was not included in the V1 snapshot.
                                        If you send V1 tokens to the migration address, they will be returned automatically.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ─── Fully Migrated State ────────────── */}
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
                                        You have migrated all {data.allocationFormatted} tokens.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ─── Loading State ──────────────────── */}
                        {data.loading && (
                            <div className="px-6 py-12 lg:px-12 border-border border-b bg-background flex items-center justify-center">
                                <Loader2 className="size-6 text-primary animate-spin" />
                                <span className="ml-3 text-muted-foreground">Loading migration data...</span>
                            </div>
                        )}

                        {/* ─── Allocation Panel ──────────────── */}
                        {!data.loading && !data.error && data.allocation > ZERO && (
                            <>
                                <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                                    <h2 className="text-lg font-semibold text-foreground lowercase">your allocation</h2>
                                </div>

                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-border border-b">
                                    <div className="px-6 py-5 border-border border-b sm:border-b-0 sm:border-r">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Allocation</p>
                                        <p className="text-xl font-semibold text-foreground">{data.allocationFormatted}</p>
                                        <p className="text-xs text-muted-foreground">V2 tokens reserved</p>
                                    </div>
                                    <div className="px-6 py-5 border-border border-b sm:border-b-0 lg:border-r">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Claimed</p>
                                        <p className="text-xl font-semibold text-foreground">{data.claimedFormatted}</p>
                                        <p className="text-xs text-muted-foreground">Via contract</p>
                                    </div>
                                    <div className="px-6 py-5 border-border border-b sm:border-r sm:border-b-0">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Relayed</p>
                                        <p className="text-xl font-semibold text-foreground">{data.relayedFormatted}</p>
                                        <p className="text-xs text-muted-foreground">Via relayer</p>
                                    </div>
                                    <div className="px-6 py-5">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Remaining</p>
                                        <p className="text-xl font-semibold text-primary">{data.remainingFormatted}</p>
                                        <p className="text-xs text-muted-foreground">Still available</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="px-6 py-4 lg:px-12 border-border border-b bg-background">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs text-muted-foreground">Migration progress</span>
                                        <span className="text-xs font-medium text-foreground">
                                            {data.allocation > ZERO
                                                ? `${((Number(data.allocation - data.remaining) / Number(data.allocation)) * 100).toFixed(1)}%`
                                                : "0%"}
                                        </span>
                                    </div>
                                    <div className="w-full h-1.5 bg-secondary">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{
                                                width: data.allocation > ZERO
                                                    ? `${(Number(data.allocation - data.remaining) / Number(data.allocation)) * 100}%`
                                                    : "0%",
                                            }}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* ─── Relay History ──────────────────── */}
                        {!data.loading && data.history.length > 0 && (
                            <>
                                <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                                    <h2 className="text-lg font-semibold text-foreground lowercase">relay history</h2>
                                </div>

                                <div className="divide-y divide-border">
                                    {data.history.map((entry) => (
                                        <div key={entry.txIn} className="px-6 py-4 lg:px-12 bg-background flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {entry.status === "sent" && (
                                                        <div className="size-2 bg-green-500" />
                                                    )}
                                                    {entry.status === "returned" && (
                                                        <div className="size-2 bg-amber-500" />
                                                    )}
                                                    {entry.status === "failed" && (
                                                        <div className="size-2 bg-destructive" />
                                                    )}
                                                    {entry.status === "pending" && (
                                                        <div className="size-2 bg-muted-foreground animate-pulse" />
                                                    )}
                                                    <span className="text-sm font-medium text-foreground capitalize">
                                                        {entry.status}
                                                    </span>
                                                    {entry.reason && (
                                                        <span className="text-xs text-muted-foreground">
                                                            ({entry.reason.replace(/_/g, " ")})
                                                        </span>
                                                    )}
                                                </div>
                                                <a
                                                    href={`https://basescan.org/tx/${entry.txIn}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                                                >
                                                    {shortenAddress(entry.txIn)} <ExternalLink className="size-3" />
                                                </a>
                                            </div>
                                            <span className="text-sm font-medium text-foreground shrink-0">
                                                {entry.amount}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
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
                        <h3 className="font-medium text-foreground mb-1">How does it work?</h3>
                        <p className="text-sm text-muted-foreground">
                            Send V1 tokens to the migration address. Our backend checks your allocation
                            and sends V2 back automatically. If you&apos;re not whitelisted, your V1 tokens are returned.
                        </p>
                    </div>
                    <div className="px-6 py-5 lg:px-12 bg-background">
                        <h3 className="font-medium text-foreground mb-1">Can I migrate partially?</h3>
                        <p className="text-sm text-muted-foreground">
                            Yes. You can migrate any amount up to your remaining allocation. Come back and migrate more at any time.
                        </p>
                    </div>
                    <div className="px-6 py-5 lg:px-12 bg-background">
                        <h3 className="font-medium text-foreground mb-1">What happens to my V1 tokens?</h3>
                        <p className="text-sm text-muted-foreground">
                            Your V1 tokens are deposited into the migration address. The swap is permanent.
                        </p>
                    </div>
                </div>

                {/* ─── Contracts Band ───────────────────────── */}
                <div className="px-6 py-4 lg:px-12 border-border border-b bg-secondary/30">
                    <h2 className="text-lg font-semibold text-foreground lowercase">contract addresses</h2>
                </div>

                <div className="divide-y divide-border">
                    {[
                        { label: "Migration Relayer", address: relayerAddress },
                        { label: "SigilMigrator", address: MIGRATOR_ADDRESS },
                        { label: "V1 HeySigil", address: V1_TOKEN_ADDRESS },
                        { label: "V2 SIGIL", address: V2_TOKEN_ADDRESS },
                    ].filter(({ address }) => !!address).map(({ label, address }) => (
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
