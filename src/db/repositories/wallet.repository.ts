/**
 * Wallet Repository
 *
 * Database persistence for custodial wallets.
 * Falls back to in-memory storage when DATABASE_URL is not set.
 *
 * Supports two encryption formats:
 * 1. ethers keystore v3 (recommended) - encryptedKeystore field
 * 2. AES-256-GCM (legacy) - encryptedKey/iv/authTag fields
 *
 * Legacy wallets are lazily migrated to keystore format on read.
 */

import { eq } from "drizzle-orm";
import { getDb, schema, DatabaseUnavailableError } from "../client.js";
import { KEYSTORE_VERSION } from "../../utils/crypto.js";

// ─── Types ──────────────────────────────────────────────

export interface StoredWallet {
    id: string;
    address: string;
    /** Keystore format version (null/undefined = legacy v1, 2+ = keystore) */
    keystoreVersion: number | null;
    /** JSON keystore (v2+ format) */
    encryptedKeystore: string | null;
    /** @deprecated Legacy AES-256-GCM encrypted key */
    encryptedKey: string | null;
    /** @deprecated Legacy IV */
    iv: string | null;
    /** @deprecated Legacy auth tag */
    authTag: string | null;
    keyType: "user" | "session";
    keyId: string;
    createdAt: Date;
}

/** Input for creating a wallet with keystore format */
export interface CreateWalletKeystoreInput {
    address: string;
    encryptedKeystore: string;
    keyType: "user" | "session";
    keyId: string;
}

/** @deprecated Input for creating a wallet with legacy format */
export interface CreateWalletLegacyInput {
    address: string;
    encryptedKey: string;
    iv: string;
    authTag: string;
    keyType: "user" | "session";
    keyId: string;
}

// ─── In-Memory Fallback ─────────────────────────────────

const memoryStore = new Map<string, StoredWallet>();

function getMemoryKey(keyType: string, keyId: string): string {
    return `${keyType}:${keyId}`;
}

// ─── Repository Functions ───────────────────────────────

/**
 * Find a wallet by its key (userId or sessionId).
 */
export async function findWalletByKey(
    keyType: "user" | "session",
    keyId: string,
): Promise<StoredWallet | null> {
    try {
        const db = getDb();
        const [row] = await db
            .select()
            .from(schema.wallets)
            .where(eq(schema.wallets.keyId, keyId))
            .limit(1);

        if (!row) return null;

        return {
            id: row.id,
            address: row.address,
            keystoreVersion: row.keystoreVersion,
            encryptedKeystore: row.encryptedKeystore,
            encryptedKey: row.encryptedKey,
            iv: row.iv,
            authTag: row.authTag,
            keyType: row.keyType as "user" | "session",
            keyId: row.keyId,
            createdAt: row.createdAt,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            // Fallback to in-memory
            return memoryStore.get(getMemoryKey(keyType, keyId)) || null;
        }
        throw err;
    }
}

/**
 * Create a new wallet record using keystore format (recommended).
 */
export async function createWallet(data: CreateWalletKeystoreInput): Promise<StoredWallet> {
    try {
        const db = getDb();
        const [row] = await db
            .insert(schema.wallets)
            .values({
                address: data.address,
                encryptedKeystore: data.encryptedKeystore,
                keystoreVersion: KEYSTORE_VERSION,
                keyType: data.keyType,
                keyId: data.keyId,
            })
            .returning();

        return {
            id: row.id,
            address: row.address,
            keystoreVersion: row.keystoreVersion,
            encryptedKeystore: row.encryptedKeystore,
            encryptedKey: row.encryptedKey,
            iv: row.iv,
            authTag: row.authTag,
            keyType: row.keyType as "user" | "session",
            keyId: row.keyId,
            createdAt: row.createdAt,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            // Fallback to in-memory
            const wallet: StoredWallet = {
                id: crypto.randomUUID(),
                address: data.address,
                keystoreVersion: KEYSTORE_VERSION,
                encryptedKeystore: data.encryptedKeystore,
                encryptedKey: null,
                iv: null,
                authTag: null,
                keyType: data.keyType,
                keyId: data.keyId,
                createdAt: new Date(),
            };
            memoryStore.set(getMemoryKey(data.keyType, data.keyId), wallet);
            return wallet;
        }
        throw err;
    }
}

/**
 * @deprecated Create a wallet using legacy AES-256-GCM format.
 * Use createWallet() with keystore format instead.
 */
export async function createWalletLegacy(data: CreateWalletLegacyInput): Promise<StoredWallet> {
    try {
        const db = getDb();
        const [row] = await db
            .insert(schema.wallets)
            .values({
                address: data.address,
                encryptedKey: data.encryptedKey,
                iv: data.iv,
                authTag: data.authTag,
                keystoreVersion: null, // Legacy format
                keyType: data.keyType,
                keyId: data.keyId,
            })
            .returning();

        return {
            id: row.id,
            address: row.address,
            keystoreVersion: row.keystoreVersion,
            encryptedKeystore: row.encryptedKeystore,
            encryptedKey: row.encryptedKey,
            iv: row.iv,
            authTag: row.authTag,
            keyType: row.keyType as "user" | "session",
            keyId: row.keyId,
            createdAt: row.createdAt,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            // Fallback to in-memory
            const wallet: StoredWallet = {
                id: crypto.randomUUID(),
                address: data.address,
                keystoreVersion: null,
                encryptedKeystore: null,
                encryptedKey: data.encryptedKey,
                iv: data.iv,
                authTag: data.authTag,
                keyType: data.keyType,
                keyId: data.keyId,
                createdAt: new Date(),
            };
            memoryStore.set(getMemoryKey(data.keyType, data.keyId), wallet);
            return wallet;
        }
        throw err;
    }
}

/**
 * Update a wallet's encrypted keystore (for lazy migration).
 */
export async function updateWalletKeystore(id: string, encryptedKeystore: string): Promise<void> {
    try {
        const db = getDb();
        await db
            .update(schema.wallets)
            .set({
                encryptedKeystore,
                keystoreVersion: KEYSTORE_VERSION,
                // Clear legacy fields after migration
                encryptedKey: null,
                iv: null,
                authTag: null,
            })
            .where(eq(schema.wallets.id, id));
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            // For in-memory, find and update
            for (const [key, wallet] of memoryStore) {
                if (wallet.id === id) {
                    wallet.encryptedKeystore = encryptedKeystore;
                    wallet.keystoreVersion = KEYSTORE_VERSION;
                    wallet.encryptedKey = null;
                    wallet.iv = null;
                    wallet.authTag = null;
                    memoryStore.set(key, wallet);
                    break;
                }
            }
        } else {
            throw err;
        }
    }
}
