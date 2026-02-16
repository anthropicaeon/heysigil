/**
 * Wallet Repository
 *
 * Database persistence for custodial wallets.
 * Falls back to in-memory storage when DATABASE_URL is not set.
 */

import { eq } from "drizzle-orm";
import { getDb, schema, DatabaseUnavailableError } from "../client.js";

// ─── Types ──────────────────────────────────────────────

export interface StoredWallet {
    id: string;
    address: string;
    encryptedKey: string;
    iv: string;
    authTag: string;
    keyType: "user" | "session";
    keyId: string;
    createdAt: Date;
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
 * Find a wallet by its address.
 */
export async function findWalletByAddress(address: string): Promise<StoredWallet | null> {
    try {
        const db = getDb();
        const [row] = await db
            .select()
            .from(schema.wallets)
            .where(eq(schema.wallets.address, address))
            .limit(1);

        if (!row) return null;

        return {
            id: row.id,
            address: row.address,
            encryptedKey: row.encryptedKey,
            iv: row.iv,
            authTag: row.authTag,
            keyType: row.keyType as "user" | "session",
            keyId: row.keyId,
            createdAt: row.createdAt,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            // Fallback to in-memory scan
            for (const wallet of memoryStore.values()) {
                if (wallet.address === address) return wallet;
            }
            return null;
        }
        throw err;
    }
}

/**
 * Create a new wallet record.
 */
export async function createWallet(data: {
    address: string;
    encryptedKey: string;
    iv: string;
    authTag: string;
    keyType: "user" | "session";
    keyId: string;
}): Promise<StoredWallet> {
    try {
        const db = getDb();
        const [row] = await db
            .insert(schema.wallets)
            .values({
                address: data.address,
                encryptedKey: data.encryptedKey,
                iv: data.iv,
                authTag: data.authTag,
                keyType: data.keyType,
                keyId: data.keyId,
            })
            .returning();

        return {
            id: row.id,
            address: row.address,
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
 * Check if database is available.
 */
export function isDatabaseAvailable(): boolean {
    try {
        getDb();
        return true;
    } catch {
        return false;
    }
}
