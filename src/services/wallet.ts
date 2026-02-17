/**
 * Custodial Wallet Service
 *
 * Creates and manages server-side wallets for users.
 * Each chat session gets its own wallet. Private keys are
 * AES-256-GCM encrypted at rest.
 *
 * Persistence:
 * - Uses PostgreSQL when DATABASE_URL is set
 * - Falls back to in-memory when not configured (development)
 *
 * Flow:
 * 1. User starts a chat → wallet auto-created
 * 2. User funds it (show deposit address)
 * 3. User trades via chat
 * 4. User can export private key (double confirmation)
 */

import { ethers } from "ethers";
import { getEnv } from "../config/env.js";
import { createShortTTLMap } from "../utils/ttl-map.js";
import { encryptWalletKeystore, decryptWalletKeystore, decryptKey } from "../utils/crypto.js";
import { BALANCE_CHECK_TOKENS } from "../config/tokens.js";
import * as walletRepo from "../db/repositories/wallet.repository.js";
import { loggers } from "../utils/logger.js";

const log = loggers.crypto;

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

// ─── Pending Export Confirmations ────────────────────────
// These remain in-memory (ephemeral by nature - 2 min TTL)

const exportConfirmations = createShortTTLMap<{ requestedAt: number }>({
    name: "export-confirmations",
});

// ─── Wallet Management ──────────────────────────────────

/**
 * Create a new wallet for a session. If one already exists, return it.
 * Uses ethers keystore format for secure encryption.
 */
export async function createWallet(sessionId: string): Promise<WalletInfo> {
    // Check if wallet already exists
    const existing = await walletRepo.findWalletByKey("session", sessionId);
    if (existing) {
        return {
            address: existing.address,
            sessionId,
            createdAt: existing.createdAt,
        };
    }

    // Generate random wallet
    const wallet = ethers.Wallet.createRandom();

    // Encrypt using ethers keystore format (industry standard)
    const { keystore } = await encryptWalletKeystore(wallet);

    // Store in database (or in-memory fallback)
    const stored = await walletRepo.createWallet({
        address: wallet.address,
        encryptedKeystore: keystore,
        keyType: "session",
        keyId: sessionId,
    });

    return {
        address: stored.address,
        sessionId,
        createdAt: stored.createdAt,
    };
}

/**
 * Check if a session has a wallet.
 */
export async function hasWallet(sessionId: string): Promise<boolean> {
    const wallet = await walletRepo.findWalletByKey("session", sessionId);
    return wallet !== null;
}

/**
 * Get wallet address for a session.
 */
export async function getAddress(sessionId: string): Promise<string | undefined> {
    const wallet = await walletRepo.findWalletByKey("session", sessionId);
    return wallet?.address;
}

/**
 * Get the ethers.Wallet instance for a session (for signing transactions).
 * Supports both keystore (v2+) and legacy AES-256-GCM formats.
 * Legacy wallets are lazily migrated to keystore format on read.
 */
export async function getSignerWallet(sessionId: string): Promise<ethers.Wallet | undefined> {
    const stored = await walletRepo.findWalletByKey("session", sessionId);
    if (!stored) return undefined;

    const env = getEnv();
    const rpcUrl = env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // New keystore format (v2+)
    if (stored.keystoreVersion && stored.encryptedKeystore) {
        const wallet = await decryptWalletKeystore(stored.encryptedKeystore);
        return wallet.connect(provider);
    }

    // Legacy AES-256-GCM format - decrypt and migrate
    if (stored.encryptedKey && stored.iv && stored.authTag) {
        const privateKey = decryptKey(stored.encryptedKey, stored.iv, stored.authTag);
        const wallet = new ethers.Wallet(privateKey, provider);

        // Lazy migration to keystore format
        try {
            const { keystore } = await encryptWalletKeystore(new ethers.Wallet(privateKey));
            await walletRepo.updateWalletKeystore(stored.id, keystore);
            log.info({ address: stored.address }, "Migrated wallet to keystore format");
        } catch (err) {
            log.warn(
                { address: stored.address, error: err },
                "Failed to migrate wallet to keystore format",
            );
        }

        return wallet;
    }

    log.error({ address: stored.address }, "Wallet has no valid encryption data");
    return undefined;
}

const BALANCE_OF_ABI = ["function balanceOf(address) view returns (uint256)"];

/**
 * Get ETH and token balances for a session's wallet.
 * Fetches all balances in parallel for optimal performance.
 */
export async function getBalance(sessionId: string): Promise<WalletBalance | undefined> {
    const stored = await walletRepo.findWalletByKey("session", sessionId);
    if (!stored) return undefined;

    const env = getEnv();
    const rpcUrl = env.BASE_RPC_URL || "https://mainnet.base.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Fetch ETH balance and all token balances in parallel
    const [ethBalance, ...tokenResults] = await Promise.all([
        provider.getBalance(stored.address),
        ...BALANCE_CHECK_TOKENS.map(async (token) => {
            try {
                const contract = new ethers.Contract(token.address, BALANCE_OF_ABI, provider);
                const balance = (await contract.balanceOf(stored.address)) as bigint;
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
export async function requestExport(
    sessionId: string,
): Promise<{ pending: boolean; message: string }> {
    const wallet = await walletRepo.findWalletByKey("session", sessionId);
    if (!wallet) {
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
export async function confirmExport(
    sessionId: string,
): Promise<{ success: boolean; privateKey?: string; message: string }> {
    // TTLMap.get() returns undefined for expired entries
    const pending = exportConfirmations.get(sessionId);

    if (!pending) {
        return {
            success: false,
            message:
                'No pending export request (or it expired). Say "export my private key" first.',
        };
    }

    const stored = await walletRepo.findWalletByKey("session", sessionId);
    if (!stored) {
        exportConfirmations.delete(sessionId);
        return { success: false, message: "No wallet found." };
    }

    // Decrypt using appropriate method
    let privateKey: string;

    if (stored.keystoreVersion && stored.encryptedKeystore) {
        // New keystore format (v2+)
        const wallet = await decryptWalletKeystore(stored.encryptedKeystore);
        privateKey = wallet.privateKey;
    } else if (stored.encryptedKey && stored.iv && stored.authTag) {
        // Legacy AES-256-GCM format
        privateKey = decryptKey(stored.encryptedKey, stored.iv, stored.authTag);

        // Lazy migration to keystore format
        try {
            const { keystore } = await encryptWalletKeystore(new ethers.Wallet(privateKey));
            await walletRepo.updateWalletKeystore(stored.id, keystore);
            log.info(
                { address: stored.address },
                "Migrated wallet to keystore format during export",
            );
        } catch (err) {
            log.warn(
                { address: stored.address, error: err },
                "Failed to migrate wallet during export",
            );
        }
    } else {
        exportConfirmations.delete(sessionId);
        return { success: false, message: "Wallet encryption data is corrupted." };
    }

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
