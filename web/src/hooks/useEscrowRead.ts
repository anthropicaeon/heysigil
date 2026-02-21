/**
 * useEscrowRead — Read proposals, balances, and thresholds from SigilEscrow.
 *
 * Takes a token address and fetches all on-chain governance data for that token.
 * Uses viem publicClient directly (no wagmi read hooks).
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";

import { ESCROW_ABI, ESCROW_ADDRESS, publicClient } from "@/lib/contracts/escrow";

import type { Proposal } from "@/components/GovernanceDashboard/types";

// ─── Status mapping (contract enum → frontend string) ───

const STATUS_MAP: Record<number, Proposal["status"]> = {
    0: "Voting",
    1: "Approved",
    2: "Rejected",
    3: "Expired",
    4: "ProofSubmitted",
    5: "Completed",
    6: "Disputed",
    7: "Overridden",
};

// ─── Return type ────────────────────────────────────────

export interface EscrowReadData {
    proposals: Proposal[];
    escrowBalance: string;
    proposalThreshold: string;
    quorumThreshold: string;
    devWallet: string;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

// ─── Hook ───────────────────────────────────────────────

export function useEscrowRead(tokenAddress: Address | null): EscrowReadData {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [escrowBalance, setEscrowBalance] = useState("0");
    const [threshold, setThreshold] = useState("0");
    const [quorum, setQuorum] = useState("0");
    const [devWallet, setDevWallet] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!tokenAddress) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Fetch scalar values in parallel
            const [countRaw, balanceRaw, thresholdRaw, quorumRaw, devWalletRaw] =
                await Promise.all([
                    publicClient.readContract({
                        address: ESCROW_ADDRESS,
                        abi: ESCROW_ABI,
                        functionName: "proposalCount",
                    }),
                    publicClient.readContract({
                        address: ESCROW_ADDRESS,
                        abi: ESCROW_ABI,
                        functionName: "getEscrowBalance",
                        args: [tokenAddress],
                    }),
                    publicClient.readContract({
                        address: ESCROW_ADDRESS,
                        abi: ESCROW_ABI,
                        functionName: "proposalThreshold",
                        args: [tokenAddress],
                    }),
                    publicClient.readContract({
                        address: ESCROW_ADDRESS,
                        abi: ESCROW_ABI,
                        functionName: "quorumThreshold",
                        args: [tokenAddress],
                    }),
                    publicClient.readContract({
                        address: ESCROW_ADDRESS,
                        abi: ESCROW_ABI,
                        functionName: "devWallet",
                    }),
                ]);

            const count = Number(countRaw);
            setEscrowBalance(balanceRaw.toString());
            setThreshold(thresholdRaw.toString());
            setQuorum(quorumRaw.toString());
            setDevWallet(devWalletRaw as string);

            if (count === 0) {
                setProposals([]);
                setLoading(false);
                return;
            }

            // Fetch all proposals in parallel
            const ids = Array.from({ length: count }, (_, i) => BigInt(i + 1));

            const proposalResults = await Promise.all(
                ids.map(async (id) => {
                    const [core, votes, text] = await Promise.all([
                        publicClient.readContract({
                            address: ESCROW_ADDRESS,
                            abi: ESCROW_ABI,
                            functionName: "getProposalCore",
                            args: [id],
                        }),
                        publicClient.readContract({
                            address: ESCROW_ADDRESS,
                            abi: ESCROW_ABI,
                            functionName: "getProposalVotes",
                            args: [id],
                        }),
                        publicClient.readContract({
                            address: ESCROW_ADDRESS,
                            abi: ESCROW_ABI,
                            functionName: "getProposalText",
                            args: [id],
                        }),
                    ]);

                    // core = [proposer, token, tokenAmount, targetDate, status, snapshotBlock, snapshotTotalSupply]
                    // votes = [votingDeadline, yesVotes, noVotes, completionDeadline, completionYes, completionNo]
                    // text = [title, description, proofUri]
                    const coreArr = core as [string, string, bigint, bigint, number, bigint, bigint];
                    const votesArr = votes as [bigint, bigint, bigint, bigint, bigint, bigint];
                    const textArr = text as [string, string, string];

                    return {
                        id: Number(id),
                        proposer: coreArr[0],
                        token: coreArr[1],
                        tokenAmount: coreArr[2].toString(),
                        targetDate: Number(coreArr[3]),
                        status: STATUS_MAP[coreArr[4]] ?? "Voting",
                        snapshotTotalSupply: coreArr[6].toString(),
                        votingDeadline: Number(votesArr[0]),
                        yesVotes: votesArr[1].toString(),
                        noVotes: votesArr[2].toString(),
                        completionDeadline: Number(votesArr[3]),
                        completionYes: votesArr[4].toString(),
                        completionNo: votesArr[5].toString(),
                        title: textArr[0],
                        description: textArr[1],
                        proofUri: textArr[2],
                    } satisfies Proposal;
                }),
            );

            // Filter to only proposals for this token, newest first
            const forToken = proposalResults
                .filter(
                    (p) => p.token.toLowerCase() === tokenAddress.toLowerCase(),
                )
                .reverse();

            setProposals(forToken);
        } catch (err) {
            console.error("[useEscrowRead] Error fetching escrow data:", err);
            setError(err instanceof Error ? err.message : "Failed to fetch governance data");
        } finally {
            setLoading(false);
        }
    }, [tokenAddress]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return {
        proposals,
        escrowBalance,
        proposalThreshold: threshold,
        quorumThreshold: quorum,
        devWallet,
        loading,
        error,
        refetch: fetchData,
    };
}
