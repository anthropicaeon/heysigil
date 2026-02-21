/**
 * SigilMigrator Contract Config
 *
 * ABI, addresses, and publicClient for the V1 → V2 migration.
 */

import { createPublicClient, http, type Address } from "viem";
import { base } from "viem/chains";

// ─── Addresses ──────────────────────────────────────────

export const MIGRATOR_ADDRESS = (process.env.NEXT_PUBLIC_MIGRATOR_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as Address;

export const V1_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_V1_TOKEN_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as Address;

export const V2_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_V2_TOKEN_ADDRESS ??
    "0x0000000000000000000000000000000000000000") as Address;

// ─── Public Client (reads only) ─────────────────────────

export const publicClient = createPublicClient({
    chain: base,
    transport: http(),
});

// ─── Migrator ABI (minimal) ─────────────────────────────

export const MIGRATOR_ABI = [
    {
        name: "claimable",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "user", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "allocation",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "claimed",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "paused",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "migrate",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [{ name: "amount", type: "uint256" }],
        outputs: [],
    },
] as const;

// ─── ERC20 ABI (minimal — for V1 token approve + balance) ──

export const ERC20_ABI = [
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [{ name: "account", type: "address" }],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "allowance",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "owner", type: "address" },
            { name: "spender", type: "address" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "approve",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "spender", type: "address" },
            { name: "amount", type: "uint256" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
    {
        name: "symbol",
        type: "function",
        stateMutability: "view",
        inputs: [],
        outputs: [{ name: "", type: "string" }],
    },
] as const;
