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

// Pending key export confirmations: sessionId → { timestamp, confirmed }
const exportConfirmations = new Map<string, { requestedAt: number; confirmed: boolean }>();

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

/**
 * Get ETH balance for a session's wallet.
 */
export async function getBalance(sessionId: string): Promise<WalletBalance | undefined> {
    const stored = walletStore.get(sessionId);
    if (!stored) return undefined;

    const env = getEnv();
    const rpcUrl = env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const ethBalance = await provider.getBalance(stored.address);

    // Common tokens on Base to check
    const baseTokens = [
        { symbol: "USDC", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
        { symbol: "WETH", address: "0x4200000000000000000000000000000000000006" },
        { symbol: "DAI", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb" },
    ];

    const erc20Abi = ["function balanceOf(address) view returns (uint256)", "function decimals() view returns (uint8)"];

    const tokens: WalletBalance["tokens"] = [];

    for (const token of baseTokens) {
        try {
            const contract = new ethers.Contract(token.address, erc20Abi, provider);
            const [balance, decimals] = await Promise.all([
                contract.balanceOf(stored.address),
                contract.decimals(),
            ]);
            if (balance > 0n) {
                tokens.push({
                    symbol: token.symbol,
                    address: token.address,
                    balance: balance.toString(),
                    formatted: ethers.formatUnits(balance, decimals),
                });
            }
        } catch {
            // Skip tokens that fail
        }
    }

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

    exportConfirmations.set(sessionId, { requestedAt: Date.now(), confirmed: false });

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
 */
export function confirmExport(sessionId: string): { success: boolean; privateKey?: string; message: string } {
    const pending = exportConfirmations.get(sessionId);

    if (!pending) {
        return {
            success: false,
            message: 'No pending export request. Say "export my private key" first.',
        };
    }

    // Expire after 2 minutes
    if (Date.now() - pending.requestedAt > 2 * 60 * 1000) {
        exportConfirmations.delete(sessionId);
        return {
            success: false,
            message: "Export request expired. Please request again.",
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
 */
export function hasPendingExport(sessionId: string): boolean {
    const pending = exportConfirmations.get(sessionId);
    if (!pending) return false;
    // Check if expired
    if (Date.now() - pending.requestedAt > 2 * 60 * 1000) {
        exportConfirmations.delete(sessionId);
        return false;
    }
    return true;
}
