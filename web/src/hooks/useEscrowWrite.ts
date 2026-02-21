/**
 * useEscrowWrite — Send transactions to SigilEscrow via Privy wallet.
 *
 * Uses the user's embedded Privy wallet to sign and send transactions.
 * Returns per-action { execute, isPending, error, txHash } state.
 */

"use client";

import { useCallback, useState } from "react";
import {
    createWalletClient,
    custom,
    type Address,
    type Hash,
} from "viem";
import { base } from "viem/chains";

import { ESCROW_ABI, ESCROW_ADDRESS } from "@/lib/contracts/escrow";

import { useOptionalWallets } from "./useOptionalPrivy";

// ─── Return type ────────────────────────────────────────

export interface EscrowWriteState {
    isPending: boolean;
    error: string | null;
    txHash: Hash | null;
}

export interface EscrowWriteActions {
    state: EscrowWriteState;

    createProposal: (
        token: Address,
        title: string,
        description: string,
        tokenAmount: bigint,
        targetDate: bigint,
    ) => Promise<Hash | null>;

    vote: (proposalId: bigint, support: boolean) => Promise<Hash | null>;

    voteWithComment: (
        proposalId: bigint,
        support: boolean,
        comment: string,
    ) => Promise<Hash | null>;

    finalizeVote: (proposalId: bigint) => Promise<Hash | null>;

    submitProof: (proposalId: bigint, proofUri: string) => Promise<Hash | null>;

    voteCompletion: (proposalId: bigint, confirmed: boolean) => Promise<Hash | null>;

    voteCompletionWithComment: (
        proposalId: bigint,
        confirmed: boolean,
        comment: string,
    ) => Promise<Hash | null>;

    finalizeCompletion: (proposalId: bigint) => Promise<Hash | null>;

    reset: () => void;
}

// ─── Hook ───────────────────────────────────────────────

export function useEscrowWrite(): EscrowWriteActions {
    const { wallets } = useOptionalWallets();
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<Hash | null>(null);

    const getWalletClient = useCallback(async () => {
        const wallet = wallets[0];
        if (!wallet) throw new Error("No wallet connected. Please sign in first.");

        // Switch to Base if needed
        await wallet.switchChain(base.id);
        const provider = await wallet.getEthereumProvider();

        return createWalletClient({
            chain: base,
            transport: custom(provider as Parameters<typeof custom>[0]),
            account: wallet.address as Address,
        });
    }, [wallets]);

    const execute = useCallback(
        async (
            functionName: string,
            args: readonly unknown[],
        ): Promise<Hash | null> => {
            setIsPending(true);
            setError(null);
            setTxHash(null);

            try {
                const client = await getWalletClient();
                const hash = await client.writeContract({
                    address: ESCROW_ADDRESS,
                    abi: ESCROW_ABI,
                    functionName: functionName as "vote",
                    args: args as readonly [bigint, boolean],
                    account: client.account!,
                    chain: base,
                });

                setTxHash(hash);
                return hash;
            } catch (err) {
                const message =
                    err instanceof Error ? err.message : "Transaction failed";
                console.error(`[useEscrowWrite] ${functionName} failed:`, err);
                setError(message);
                return null;
            } finally {
                setIsPending(false);
            }
        },
        [getWalletClient],
    );

    const reset = useCallback(() => {
        setIsPending(false);
        setError(null);
        setTxHash(null);
    }, []);

    return {
        state: { isPending, error, txHash },

        createProposal: useCallback(
            (token, title, description, tokenAmount, targetDate) =>
                execute("createProposal", [token, title, description, tokenAmount, targetDate]),
            [execute],
        ),

        vote: useCallback(
            (proposalId, support) => execute("vote", [proposalId, support]),
            [execute],
        ),

        voteWithComment: useCallback(
            (proposalId, support, comment) =>
                execute("voteWithComment", [proposalId, support, comment]),
            [execute],
        ),

        finalizeVote: useCallback(
            (proposalId) => execute("finalizeVote", [proposalId]),
            [execute],
        ),

        submitProof: useCallback(
            (proposalId, proofUri) => execute("submitProof", [proposalId, proofUri]),
            [execute],
        ),

        voteCompletion: useCallback(
            (proposalId, confirmed) => execute("voteCompletion", [proposalId, confirmed]),
            [execute],
        ),

        voteCompletionWithComment: useCallback(
            (proposalId, confirmed, comment) =>
                execute("voteCompletionWithComment", [proposalId, confirmed, comment]),
            [execute],
        ),

        finalizeCompletion: useCallback(
            (proposalId) => execute("finalizeCompletion", [proposalId]),
            [execute],
        ),

        reset,
    };
}
