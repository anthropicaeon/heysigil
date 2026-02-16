/**
 * Custodial Wallet Service
 *
 * Creates and manages server-side wallets for users.
 * Each chat session gets its own wallet. Private keys are
 * AES-256-GCM encrypted at rest.
 *
 * Flow:
 * 1. User starts a chat → wallet auto-created
 * 2. User funds it (show deposit address)
 * 3. User trades via chat
 * 4. User can export private key (double confirmation)
 */

import { ethers } from "ethers";
import crypto from "node:crypto";
import { getEnv } from "../config/env.js";
import { createShortTTLMap } from "../utils/ttl-map.js";

// ─── Types ──────────────────────────────────────────────

export interface WalletInfo {
    address: string;
    sessionId: string;
    createdAt: Date;
}

export interface WalletBalance {
    eth: string;
    ethFormatted: string;
    tokens: { symbol: string; address: string; balance: string; formatted: string }[];
}

interface StoredWallet {
    address: string;
    encryptedKey: string;   // AES-256-GCM encrypted private key
    iv: string;             // Initialization vector (hex)
    authTag: string;        // GCM auth tag (hex)
    createdAt: Date;
}

// ─── In-Memory Store ────────────────────────────────────
// In production, persist to DB (wallets table). For now, in-memory.

const walletStore = new Map<string, StoredWallet>();

// Pending key export confirmations: auto-expire after 2 minutes
const exportConfirmations = createShortTTLMap<{ requestedAt: number }>({
    name: "export-confirmations",
});

// ─── Encryption ─────────────────────────────────────────

function getEncryptionKey(): Buffer {
    const env = getEnv();
    const keyHex = env.WALLET_ENCRYPTION_KEY;

    if (!keyHex) {
        // Dev fallback — generate deterministic key from a seed
        // In production, WALLET_ENCRYPTION_KEY must be set
        const fallback = crypto.createHash("sha256").update("sigil-dev-key-do-not-use-in-prod").digest();
        return fallback;
    }

    // Key should be 32 bytes (64 hex chars)
    return Buffer.from(keyHex, "hex");
}

function encryptKey(privateKey: string): { encrypted: string; iv: string; authTag: string } {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(privateKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    return {
        encrypted,
        iv: iv.toString("hex"),
        authTag: (cipher as crypto.CipherGCM).getAuthTag().toString("hex"),
    };
}

function decryptKey(encrypted: string, iv: string, authTag: string): string {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
    (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

// ─── Wallet Management ──────────────────────────────────

/**
 * Create a new wallet for a session. If one already exists, return it.
 */
export function createWallet(sessionId: string): WalletInfo {
    const existing = walletStore.get(sessionId);
    if (existing) {
        return { address: existing.address, sessionId, createdAt: existing.createdAt };
    }

    // Generate random wallet
    const wallet = ethers.Wallet.createRandom();

    // Encrypt private key
    const { encrypted, iv, authTag } = encryptKey(wallet.privateKey);

    const stored: StoredWallet = {
        address: wallet.address,
        encryptedKey: encrypted,
        iv,
        authTag,
        createdAt: new Date(),
    };

    walletStore.set(sessionId, stored);

    return { address: wallet.address, sessionId, createdAt: stored.createdAt };
}

/**
 * Check if a session has a wallet.
 */
export function hasWallet(sessionId: string): boolean {
    return walletStore.has(sessionId);
}

/**
 * Get wallet address for a session.
 */
export function getAddress(sessionId: string): string | undefined {
    return walletStore.get(sessionId)?.address;
}

/**
 * Get the ethers.Wallet instance for a session (for signing transactions).
 */
export function getSignerWallet(sessionId: string): ethers.Wallet | undefined {
    const stored = walletStore.get(sessionId);
    if (!stored) return undefined;

    const env = getEnv();
    const rpcUrl = env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const privateKey = decryptKey(stored.encryptedKey, stored.iv, stored.authTag);
    return new ethers.Wallet(privateKey, provider);
}

// Common tokens on Base with pre-cached decimals (avoids RPC calls)
const BASE_TOKENS = [
    { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
    { symbol: "WETH", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
    { symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
] as const;

const BALANCE_OF_ABI = ["function balanceOf(address) view returns (uint256)"];

/**
 * Get ETH and token balances for a session's wallet.
 * Fetches all balances in parallel for optimal performance.
 */
export async function getBalance(sessionId: string): Promise<WalletBalance | undefined> {
    const stored = walletStore.get(sessionId);
    if (!stored) return undefined;

    const env = getEnv();
    const rpcUrl = env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Fetch ETH balance and all token balances in parallel
    const [ethBalance, ...tokenResults] = await Promise.all([
        provider.getBalance(stored.address),
        ...BASE_TOKENS.map(async (token) => {
            try {
                const contract = new ethers.Contract(token.address, BALANCE_OF_ABI, provider);
                const balance = await contract.balanceOf(stored.address) as bigint;
                return { token, balance };
            } catch {
                return { token, balance: 0n };
            }
        }),
    ]);

    // Filter to non-zero balances and format
    const tokens: WalletBalance["tokens"] = tokenResults
        .filter((result) => result.balance > 0n)
        .map((result) => ({
            symbol: result.token.symbol,
            address: result.token.address,
            balance: result.balance.toString(),
            formatted: ethers.formatUnits(result.balance, result.token.decimals),
        }));

    return {
        eth: ethBalance.toString(),
        ethFormatted: ethers.formatEther(ethBalance),
        tokens,
    };
}

// ─── Private Key Export ─────────────────────────────────

/**
 * Request to export private key. Returns a warning and requires confirmation.
 * Call this first, then call confirmExport() to actually reveal the key.
 */
export function requestExport(sessionId: string): { pending: boolean; message: string } {
    if (!walletStore.has(sessionId)) {
        return { pending: false, message: "No wallet found for this session." };
    }

    exportConfirmations.set(sessionId, { requestedAt: Date.now() });

    return {
        pending: true,
        message: [
            "⚠️ **Warning: Private Key Export**",
            "",
            "You are about to reveal your private key. Please understand:",
            "",
            "• **Anyone with this key has full control** of your wallet and all funds in it",
            "• **Never share it** with anyone — no legitimate service will ask for it",
            "• **Store it safely** — once revealed, you're responsible for its security",
            "• **We recommend** importing into a hardware wallet (Ledger, Trezor) for long-term storage",
            "",
            '**To confirm, reply:** `"yes, export my key"`',
        ].join("\n"),
    };
}

/**
 * Confirm private key export. Only works if requestExport() was called first.
 * Returns the decrypted private key exactly once.
 * Note: TTLMap auto-expires entries after 2 minutes.
 */
export function confirmExport(sessionId: string): { success: boolean; privateKey?: string; message: string } {
    // TTLMap.get() returns undefined for expired entries
    const pending = exportConfirmations.get(sessionId);

    if (!pending) {
        return {
            success: false,
            message: 'No pending export request (or it expired). Say "export my private key" first.',
        };
    }

    const stored = walletStore.get(sessionId);
    if (!stored) {
        exportConfirmations.delete(sessionId);
        return { success: false, message: "No wallet found." };
    }

    // Decrypt and return
    const privateKey = decryptKey(stored.encryptedKey, stored.iv, stored.authTag);
    exportConfirmations.delete(sessionId);

    return {
        success: true,
        privateKey,
        message: [
            "🔑 **Your Private Key:**",
            "",
            `\`${privateKey}\``,
            "",
            "⚠️ **This is shown only once.** Copy it now and store it safely.",
            "Import it into MetaMask, Rabby, or a hardware wallet.",
            "",
            `Your wallet address: \`${stored.address}\``,
        ].join("\n"),
    };
}

/**
 * Check if there's a pending export confirmation for this session.
 * TTLMap handles expiration automatically.
 */
export function hasPendingExport(sessionId: string): boolean {
    return exportConfirmations.has(sessionId);
}
