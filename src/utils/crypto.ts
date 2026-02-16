/**
 * Cryptographic Utilities
 *
 * AES-256-GCM encryption for sensitive data (private keys, secrets).
 * Centralized to ensure consistent security practices.
 *
 * SECURITY:
 * - Production REQUIRES WALLET_ENCRYPTION_KEY to be set
 * - Development uses a fallback key with warnings
 * - Key must be 32 bytes (64 hex characters)
 */

import crypto from "node:crypto";
import { getEnv, isProduction } from "../config/env.js";

export interface EncryptedData {
    encrypted: string; // Ciphertext (hex)
    iv: string; // Initialization vector (hex)
    authTag: string; // GCM auth tag (hex)
}

// Track if we've already logged the dev key warning
let _devKeyWarningLogged = false;

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
            console.warn(
                "[SECURITY WARNING] Using development fallback encryption key. " +
                    "Set WALLET_ENCRYPTION_KEY for production use.",
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
 */
export function decryptKey(encrypted: string, iv: string, authTag: string): string {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "hex"));
    (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(authTag, "hex"));

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
