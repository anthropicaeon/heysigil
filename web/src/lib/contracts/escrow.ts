/**
 * SigilEscrow Contract Config
 *
 * ABI, address, and publicClient for reading from the multi-token escrow.
 */

import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";

// ─── Address ─────────────────────────────────────────────

export const ESCROW_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as Address;

// ─── Public Client (reads only) ─────────────────────────

export const publicClient = createPublicClient({
    chain: base,
    transport: http(),
});

// ─── ABI (minimal — only what the frontend needs) ───────

export const ESCROW_ABI = [
    // ── Views ────────────────────────────────────────────
    {
        name: "proposalCount",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "getProposalCore",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "proposalId", type: "uint256" }],
        outputs: [
            { name: "proposer", type: "address" },
            { name: "token", type: "address" },
            { name: "tokenAmount", type: "uint256" },
            { name: "targetDate", type: "uint256" },
            { name: "status", type: "uint8" },
            { name: "snapshotBlock", type: "uint256" },
            { name: "snapshotTotalSupply", type: "uint256" },
        ],
    },
    {
        name: "getProposalVotes",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "proposalId", type: "uint256" }],
        outputs: [
            { name: "votingDeadline", type: "uint256" },
            { name: "yesVotes", type: "uint256" },
            { name: "noVotes", type: "uint256" },
            { name: "completionDeadline", type: "uint256" },
            { name: "completionYes", type: "uint256" },
            { name: "completionNo", type: "uint256" },
        ],
    },
    {
        name: "getProposalText",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "proposalId", type: "uint256" }],
        outputs: [
            { name: "title", type: "string" },
            { name: "description", type: "string" },
            { name: "proofUri", type: "string" },
        ],
    },
    {
        name: "getEscrowBalance",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "token", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "proposalThreshold",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "token", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "quorumThreshold",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "token", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "hasVoted",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "proposalId", type: "uint256" },
            { name: "voter", type: "address" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "hasVotedCompletion",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "proposalId", type: "uint256" },
            { name: "voter", type: "address" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "devWallet",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "address" }],
    },

    // ── Writes ───────────────────────────────────────────
    {
        name: "createProposal",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "token", type: "address" },
            { name: "title", type: "string" },
            { name: "description", type: "string" },
            { name: "tokenAmount", type: "uint256" },
            { name: "targetDate", type: "uint256" },
        ],
        outputs: [{ name: "proposalId", type: "uint256" }],
    },
    {
        name: "vote",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "proposalId", type: "uint256" },
            { name: "support", type: "bool" },
        ],
        outputs: [],
    },
    {
        name: "voteWithComment",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "proposalId", type: "uint256" },
            { name: "support", type: "bool" },
            { name: "comment", type: "string" },
        ],
        outputs: [],
    },
    {
        name: "finalizeVote",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "proposalId", type: "uint256" }],
        outputs: [],
    },
    {
        name: "submitProof",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "proposalId", type: "uint256" },
            { name: "proofUri", type: "string" },
        ],
        outputs: [],
    },
    {
        name: "voteCompletion",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "proposalId", type: "uint256" },
            { name: "confirmed", type: "bool" },
        ],
        outputs: [],
    },
    {
        name: "voteCompletionWithComment",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "proposalId", type: "uint256" },
            { name: "confirmed", type: "bool" },
            { name: "comment", type: "string" },
        ],
        outputs: [],
    },
    {
        name: "finalizeCompletion",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "proposalId", type: "uint256" }],
        outputs: [],
    },
    {
        name: "protocolOverride",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "proposalId", type: "uint256" }],
        outputs: [],
    },
] as const;
