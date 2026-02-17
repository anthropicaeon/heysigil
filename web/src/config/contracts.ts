// ─── Sigil Contract Config ──────────────────────────────
// Minimal ABIs for frontend reads/writes. Only functions we actually call.

import { createPublicClient, http } from "viem";
import { base } from "viem/chains";

// ─── Addresses ──────────────────────────────────────────

export const USDC_ADDRESS =
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

// TODO: Update after V3 deployment
export const FEE_VAULT_ADDRESS =
    (process.env.NEXT_PUBLIC_FEE_VAULT_ADDRESS ??
        "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const LP_LOCKER_ADDRESS =
    (process.env.NEXT_PUBLIC_LP_LOCKER_ADDRESS ??
        "0x0000000000000000000000000000000000000000") as `0x${string}`;

// ─── FeeVault ABI (minimal) ─────────────────────────────

export const FEE_VAULT_ABI = [
    // ── Reads ──
    {
        name: "devFees",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "dev", type: "address" },
            { name: "token", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "getDevFeeBalances",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "dev", type: "address" }],
        outputs: [
            { name: "tokens", type: "address[]" },
            { name: "balances", type: "uint256[]" },
        ],
    },
    {
        name: "totalDevFeesEarned",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "dev", type: "address" },
            { name: "token", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },

    // ── Writes ──
    {
        name: "claimDevFees",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "token", type: "address" }],
        outputs: [],
    },
    {
        name: "claimAllDevFees",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [],
        outputs: [],
    },
] as const;

// ─── LP Locker ABI (minimal — for triggering fee collection) ─

export const LP_LOCKER_ABI = [
    {
        name: "collectFees",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "tokenId", type: "uint256" }],
        outputs: [],
    },
    {
        name: "getLockedCount",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "lockedTokenIds",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "index", type: "uint256" }],
        outputs: [{ name: "", type: "uint256" }],
    },
] as const;

// ─── Public Client (read-only) ──────────────────────────

export const publicClient = createPublicClient({
    chain: base,
    transport: http(),
});
