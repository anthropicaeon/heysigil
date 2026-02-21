/**
 * useMigratorWrite — Send approve + migrate transactions via Privy wallet.
 *
 * Same pattern as useEscrowWrite: Privy wallet → createWalletClient → writeContract.
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

import {
    ERC20_ABI,
    MIGRATOR_ABI,
    MIGRATOR_ADDRESS,
    V1_TOKEN_ADDRESS,
} from "@/lib/contracts/migrator";

import { useOptionalWallets } from "./useOptionalPrivy";

// ─── Return type ────────────────────────────────────────

export interface MigratorWriteState {
    isPending: boolean;
    error: string | null;
    txHash: Hash | null;
    step: "idle" | "approving" | "migrating" | "done";
}

export interface MigratorWriteActions {
    state: MigratorWriteState;

    /** Approve V1 tokens to the migrator contract */
    approve: (amount: bigint) => Promise<Hash | null>;

    /** Call migrate(amount) on the migrator */
    migrate: (amount: bigint) => Promise<Hash | null>;

    /** Reset state */
    reset: () => void;
}

// ─── Hook ───────────────────────────────────────────────

export function useMigratorWrite(): MigratorWriteActions {
    const { wallets } = useOptionalWallets();
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [txHash, setTxHash] = useState<Hash | null>(null);
    const [step, setStep] = useState<MigratorWriteState["step"]>("idle");

    const getWalletClient = useCallback(async () => {
        const wallet = wallets[0];
        if (!wallet) throw new Error("No wallet connected. Please sign in first.");

        await wallet.switchChain(base.id);
        const provider = await wallet.getEthereumProvider();

        return createWalletClient({
            chain: base,
            transport: custom(provider as Parameters<typeof custom>[0]),
            account: wallet.address as Address,
        });
    }, [wallets]);

    const approve = useCallback(
        async (amount: bigint): Promise<Hash | null> => {
            setIsPending(true);
            setError(null);
            setTxHash(null);
            setStep("approving");

            try {
                const client = await getWalletClient();
                const hash = await client.writeContract({
                    address: V1_TOKEN_ADDRESS,
                    abi: ERC20_ABI,
                    functionName: "approve",
                    args: [MIGRATOR_ADDRESS, amount],
                    account: client.account!,
                    chain: base,
                });

                setTxHash(hash);
                return hash;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Approval failed";
                console.error("[useMigratorWrite] approve failed:", err);
                setError(message);
                setStep("idle");
                return null;
            } finally {
                setIsPending(false);
            }
        },
        [getWalletClient],
    );

    const migrateTokens = useCallback(
        async (amount: bigint): Promise<Hash | null> => {
            setIsPending(true);
            setError(null);
            setTxHash(null);
            setStep("migrating");

            try {
                const client = await getWalletClient();
                const hash = await client.writeContract({
                    address: MIGRATOR_ADDRESS,
                    abi: MIGRATOR_ABI,
                    functionName: "migrate",
                    args: [amount],
                    account: client.account!,
                    chain: base,
                });

                setTxHash(hash);
                setStep("done");
                return hash;
            } catch (err) {
                const message = err instanceof Error ? err.message : "Migration failed";
                console.error("[useMigratorWrite] migrate failed:", err);
                setError(message);
                setStep("idle");
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
        setStep("idle");
    }, []);

    return {
        state: { isPending, error, txHash, step },
        approve,
        migrate: migrateTokens,
        reset,
    };
}
