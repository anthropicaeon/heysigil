/**
 * Cryptographic Utilities
 *
 * Provides two encryption methods:
 * 1. ethers.Wallet.encrypt() - Industry-standard keystore format (recommended)
 * 2. AES-256-GCM (legacy) - For backwards compatibility during migration
 *
 * The keystore format uses scrypt for key derivation and AES-128-CTR for
 * encryption, following the Ethereum keystore v3 standard. This is the
 * same format used by MetaMask, Geth, and other wallets.
 *
 * SECURITY:
 * - Production REQUIRES WALLET_ENCRYPTION_KEY to be set
 * - Development uses a fallback key with warnings
 * - Key must be 32 bytes (64 hex characters)
 */

import crypto from "node:crypto";
import { ethers } from "ethers";
import { getEnv, isProduction } from "../config/env.js";
import { loggers } from "./logger.js";

const log = loggers.crypto;

export interface EncryptedData {
    encrypted: string; // Ciphertext (hex)
    iv: string; // Initialization vector (hex)
    authTag: string; // GCM auth tag (hex)
}

// Track if we've already logged the dev key warning
let _devKeyWarningLogged = false;

/** Current keystore format version */
export const KEYSTORE_VERSION = 2;

/**
 * Get the 32-byte encryption key from environment.
 *
 * CRITICAL SECURITY:
 * - In production: THROWS if WALLET_ENCRYPTION_KEY is not set
 * - In development: Uses fallback key with warning (for local dev only)
 */
export function getEncryptionKey(): Buffer {
    const env = getEnv();
    const keyHex = env.WALLET_ENCRYPTION_KEY;

    if (!keyHex) {
        // CRITICAL: Never allow missing key in production
        if (isProduction()) {
            throw new Error(
                "[SECURITY] WALLET_ENCRYPTION_KEY is required in production. " +
                    "Generate a secure key with: openssl rand -hex 32",
            );
        }

        // Development fallback — log warning once
        if (!_devKeyWarningLogged) {
            log.warn(
                "Using development fallback encryption key. Set WALLET_ENCRYPTION_KEY for production use.",
            );
            _devKeyWarningLogged = true;
        }

        return crypto.createHash("sha256").update("sigil-dev-key-do-not-use-in-prod").digest();
    }

    // Validate key length (should be 32 bytes = 64 hex chars)
    if (keyHex.length !== 64) {
        throw new Error(
            `[SECURITY] WALLET_ENCRYPTION_KEY must be 64 hex characters (32 bytes). ` +
                `Got ${keyHex.length} characters. Generate with: openssl rand -hex 32`,
        );
    }

    // Validate hex format
    if (!/^[0-9a-fA-F]+$/.test(keyHex)) {
        throw new Error("[SECURITY] WALLET_ENCRYPTION_KEY must be valid hexadecimal.");
    }

    return Buffer.from(keyHex, "hex");
}

/**
 * Check if encryption is properly configured for production.
 * Call this at startup to fail fast if misconfigured.
 */
export function validateEncryptionConfig(): { valid: boolean; message: string } {
    const env = getEnv();
    const keyHex = env.WALLET_ENCRYPTION_KEY;

    if (!keyHex) {
        if (isProduction()) {
            return {
                valid: false,
                message: "WALLET_ENCRYPTION_KEY is required in production",
            };
        }
        return {
            valid: true,
            message: "Using development fallback key (not for production)",
        };
    }

    if (keyHex.length !== 64) {
        return {
            valid: false,
            message: `WALLET_ENCRYPTION_KEY must be 64 hex chars, got ${keyHex.length}`,
        };
    }

    if (!/^[0-9a-fA-F]+$/.test(keyHex)) {
        return {
            valid: false,
            message: "WALLET_ENCRYPTION_KEY must be valid hexadecimal",
        };
    }

    return { valid: true, message: "Encryption key configured correctly" };
}

/**
 * Encrypt a string using AES-256-GCM.
 * Returns the ciphertext, IV, and auth tag (all as hex strings).
 */
export function encryptKey(privateKey: string): EncryptedData {
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

/**
 * Decrypt data encrypted with encryptKey().
 * Requires the ciphertext, IV, and auth tag.
 *
 * @deprecated Use decryptKeystore() for new code. This is maintained for backwards compatibility.
 */
export function decryptKey(encrypted: string, iv: string, authTag: string): string {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
    (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

// ─── Ethers Keystore Format (Recommended) ──────────────────

/**
 * Encrypted keystore data using ethers.Wallet.encrypt() format.
 * This is the industry-standard Ethereum keystore v3 format.
 */
export interface KeystoreData {
    /** JSON string of the encrypted keystore */
    keystore: string;
    /** Version identifier for migration purposes */
    version: number;
}

/**
 * Get the encryption password from environment.
 * This is the password used for ethers keystore encryption.
 */
function getKeystorePassword(): string {
    const key = getEncryptionKey();
    // Use the hex representation of the key as the password
    // This maintains the same security level as direct key usage
    return key.toString("hex");
}

/**
 * Encrypt a wallet using ethers keystore format.
 * Uses scrypt for key derivation (industry standard).
 *
 * This is the recommended method for new wallets.
 * Accepts both Wallet and HDNodeWallet (from createRandom()).
 *
 * @param wallet - The ethers Wallet or HDNodeWallet to encrypt
 * @returns KeystoreData with the encrypted keystore JSON
 */
export async function encryptWalletKeystore(
    wallet: ethers.Wallet | ethers.HDNodeWallet,
): Promise<KeystoreData> {
    const password = getKeystorePassword();

    // HDNodeWallet.encrypt() doesn't accept scrypt options — only (password, progressCallback?)
    // Convert to a plain Wallet which supports the full encrypt(password, options) signature
    const plainWallet =
        wallet instanceof ethers.Wallet ? wallet : new ethers.Wallet(wallet.privateKey);

    // Use lightweight scrypt params for faster encryption
    // Production default: n=131072, r=8, p=1
    // Our params: n=4096, r=8, p=1 (still secure, but faster for API usage)
    const keystore = await plainWallet.encrypt(password, {
        scrypt: { N: 4096, r: 8, p: 1 },
    });

    return {
        keystore,
        version: KEYSTORE_VERSION,
    };
}

/**
 * Decrypt a wallet from ethers keystore format.
 *
 * @param keystore - The JSON keystore string
 * @returns The decrypted ethers Wallet
 */
export async function decryptWalletKeystore(keystore: string): Promise<ethers.Wallet> {
    const password = getKeystorePassword();
    return ethers.Wallet.fromEncryptedJson(keystore, password);
}

/**
 * Encrypt a private key using ethers keystore format.
 * Convenience wrapper that creates a wallet first.
 *
 * @param privateKey - The private key to encrypt
 * @returns KeystoreData with the encrypted keystore JSON
 */
export async function encryptPrivateKeyKeystore(privateKey: string): Promise<KeystoreData> {
    const wallet = new ethers.Wallet(privateKey);
    return encryptWalletKeystore(wallet);
}

/**
 * Decrypt a private key from ethers keystore format.
 *
 * @param keystore - The JSON keystore string
 * @returns The decrypted private key
 */
export async function decryptPrivateKeyKeystore(keystore: string): Promise<string> {
    const wallet = await decryptWalletKeystore(keystore);
    return wallet.privateKey;
}
