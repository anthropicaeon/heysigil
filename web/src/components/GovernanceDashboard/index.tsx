/**
 * GovernanceDashboard
 *
 * Main governance dashboard component — reads proposals and balances
 * from the on-chain SigilEscrow contract for a specific token.
 * Token is determined by the `?token=` URL parameter.
 */

"use client";

import { AlertTriangle, Loader2, Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Address } from "viem";

import { useEscrowRead } from "@/hooks/useEscrowRead";

import { CreateProposalModal } from "./components/CreateProposalModal";
import { GovernanceHeader } from "./components/GovernanceHeader";
import { ProposalDetail } from "./components/ProposalDetail";
import { ProposalFilter } from "./components/ProposalFilter";
import { ProposalListView } from "./components/ProposalListView";
import type { Proposal, TabFilter } from "./types";

export default function GovernanceDashboard() {
    const searchParams = useSearchParams();
    const tokenParam = searchParams.get("token");
    const tokenAddress = tokenParam && /^0x[a-fA-F0-9]{40}$/.test(tokenParam)
        ? (tokenParam as Address)
        : null;

    const {
        proposals: onChainProposals,
        escrowBalance,
        loading,
        error,
        refetch,
    } = useEscrowRead(tokenAddress);

    const [activeTab, setActiveTab] = useState<TabFilter>("all");
    const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    const filteredProposals = useMemo(
        () =>
            onChainProposals.filter((p) => {
                if (activeTab === "all") return true;
                if (activeTab === "active")
                    return ["Voting", "Approved", "ProofSubmitted"].includes(p.status);
                if (activeTab === "completed")
                    return ["Completed", "Overridden"].includes(p.status);
                if (activeTab === "rejected")
                    return ["Rejected", "Expired", "Disputed"].includes(p.status);
                return true;
            }),
        [onChainProposals, activeTab],
    );

    const handleCreated = useCallback(() => {
        setShowCreate(false);
        refetch();
    }, [refetch]);

    const handleVoteComplete = useCallback(() => {
        refetch();
    }, [refetch]);

    // ─── No token selected ──────────────────────────────

    if (!tokenAddress) {
        return (
            <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
                <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col items-center justify-center">
                    <div className="size-20 bg-lavender/30 border border-border flex items-center justify-center mb-6">
                        <Search className="size-10 text-muted-foreground" />
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground mb-2">
                        select a token
                    </h1>
                    <p className="text-muted-foreground text-center max-w-md">
                        Navigate here from a token page to view its governance proposals.
                        Each token has its own escrow and voting.
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-4 font-mono">
                        /governance?token=0x...
                    </p>
                </div>
            </section>
        );
    }

    // ─── Loading state ──────────────────────────────────

    if (loading && onChainProposals.length === 0) {
        return (
            <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
                <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col items-center justify-center">
                    <Loader2 className="size-8 animate-spin text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Loading governance data...</p>
                    <p className="text-xs text-muted-foreground/60 font-mono mt-2">
                        {tokenAddress.slice(0, 6)}...{tokenAddress.slice(-4)}
                    </p>
                </div>
            </section>
        );
    }

    // ─── Error state ────────────────────────────────────

    if (error && onChainProposals.length === 0) {
        return (
            <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
                <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col items-center justify-center">
                    <div className="size-16 bg-rose/20 border border-border flex items-center justify-center mb-4">
                        <AlertTriangle className="size-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                        Failed to load governance
                    </h2>
                    <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                        {error}
                    </p>
                    <button
                        type="button"
                        onClick={refetch}
                        className="px-4 py-2 border border-border bg-background hover:bg-secondary/30 text-sm transition-colors"
                    >
                        Try again
                    </button>
                </div>
            </section>
        );
    }

    // ─── Proposal detail view ───────────────────────────

    if (selectedProposal) {
        return (
            <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
                <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                    <ProposalDetail
                        proposal={selectedProposal}
                        onBack={() => setSelectedProposal(null)}
                        onVoteComplete={handleVoteComplete}
                    />
                </div>
            </section>
        );
    }

    // ─── Main dashboard ─────────────────────────────────

    return (
        <section className="bg-background relative overflow-hidden px-2.5 lg:px-0">
            <div className="border-border relative container border-l border-r min-h-[calc(100vh-5rem)] px-0 bg-cream flex flex-col">
                <GovernanceHeader
                    proposals={onChainProposals}
                    escrowBalance={escrowBalance}
                    tokenAddress={tokenAddress}
                />
                <ProposalFilter
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onCreateClick={() => setShowCreate(true)}
                />

                <ProposalListView
                    proposals={filteredProposals}
                    activeTab={activeTab}
                    onSelectProposal={setSelectedProposal}
                />

                {/* Footer */}
                <div className="border-border border-t px-6 py-4 lg:px-12 bg-sage/20">
                    <p className="text-xs text-muted-foreground text-center">
                        Governance is onchain. All votes are recorded permanently on Base.
                    </p>
                </div>
            </div>
            {showCreate && tokenAddress && (
                <CreateProposalModal
                    tokenAddress={tokenAddress}
                    onClose={() => setShowCreate(false)}
                    onCreated={handleCreated}
                />
            )}
        </section>
    );
}

// Re-export types for external use
export type { Proposal, ProposalStatus, TabFilter } from "./types";
