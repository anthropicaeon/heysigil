/**
 * Cryptographic Utilities
 *
 * AES-256-GCM encryption for sensitive data (private keys, secrets).
 * Centralized to ensure consistent security practices.
 */

import crypto from "node:crypto";
import { getEnv } from "../config/env.js";

export interface EncryptedData {
    encrypted: string;  // Ciphertext (hex)
    iv: string;         // Initialization vector (hex)
    authTag: string;    // GCM auth tag (hex)
}

/**
 * Get the 32-byte encryption key from environment.
 * Falls back to a deterministic dev key if not configured (NOT for production).
 */
export function getEncryptionKey(): Buffer {
    const env = getEnv();
    const keyHex = env.WALLET_ENCRYPTION_KEY;

    if (!keyHex) {
        // Dev fallback — generate deterministic key from a seed
        // In production, WALLET_ENCRYPTION_KEY must be set
        return crypto.createHash("sha256").update("sigil-dev-key-do-not-use-in-prod").digest();
    }

    // Key should be 32 bytes (64 hex chars)
    return Buffer.from(keyHex, "hex");
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
 */
export function decryptKey(encrypted: string, iv: string, authTag: string): string {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
    (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
