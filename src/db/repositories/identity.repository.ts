/**
 * Identity Repository
 *
 * Database persistence for users and identities.
 * Falls back to in-memory storage when DATABASE_URL is not set.
 */

import { eq, and } from "drizzle-orm";
import { getDb, schema, DatabaseUnavailableError } from "../client.js";

// ─── Types ──────────────────────────────────────────────

export interface DbUser {
    id: string;
    walletAddress: string;
    privyUserId: string | null;
    status: "phantom" | "claimed";
    createdAt: Date;
    claimedAt: Date | null;
    mergedInto: string | null;
}

export interface DbIdentity {
    id: string;
    userId: string;
    platform: string;
    platformId: string;
    createdBy: string | null;
    createdAt: Date;
}

// ─── In-Memory Fallback ─────────────────────────────────

const memoryUsers = new Map<string, DbUser>();
const memoryIdentities = new Map<string, DbIdentity>();
const memoryPlatformIndex = new Map<string, string>(); // "platform:platformId" → identityId
const memoryPrivyIndex = new Map<string, string>(); // privyUserId → userId

function getPlatformKey(platform: string, platformId: string): string {
    return `${platform}:${platformId}`;
}

// ─── User Repository ────────────────────────────────────

export async function findUserById(userId: string): Promise<DbUser | null> {
    try {
        const db = getDb();
        const [row] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, userId))
            .limit(1);

        if (!row) return null;

        return {
            id: row.id,
            walletAddress: row.walletAddress,
            privyUserId: row.privyUserId,
            status: row.status as "phantom" | "claimed",
            createdAt: row.createdAt,
            claimedAt: row.claimedAt,
            mergedInto: row.mergedInto,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            return memoryUsers.get(userId) || null;
        }
        throw err;
    }
}

export async function findUserByPrivyId(privyUserId: string): Promise<DbUser | null> {
    try {
        const db = getDb();
        const [row] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.privyUserId, privyUserId))
            .limit(1);

        if (!row) return null;

        return {
            id: row.id,
            walletAddress: row.walletAddress,
            privyUserId: row.privyUserId,
            status: row.status as "phantom" | "claimed",
            createdAt: row.createdAt,
            claimedAt: row.claimedAt,
            mergedInto: row.mergedInto,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            const userId = memoryPrivyIndex.get(privyUserId);
            if (!userId) return null;
            return memoryUsers.get(userId) || null;
        }
        throw err;
    }
}

export async function findUserByWalletAddress(walletAddress: string): Promise<DbUser | null> {
    try {
        const db = getDb();
        const [row] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.walletAddress, walletAddress))
            .limit(1);

        if (!row) return null;

        return {
            id: row.id,
            walletAddress: row.walletAddress,
            privyUserId: row.privyUserId,
            status: row.status as "phantom" | "claimed",
            createdAt: row.createdAt,
            claimedAt: row.claimedAt,
            mergedInto: row.mergedInto,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            for (const user of memoryUsers.values()) {
                if (user.walletAddress === walletAddress) return user;
            }
            return null;
        }
        throw err;
    }
}

export async function findUsersMergedInto(primaryUserId: string): Promise<DbUser[]> {
    try {
        const db = getDb();
        const rows = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.mergedInto, primaryUserId));

        return rows.map((row) => ({
            id: row.id,
            walletAddress: row.walletAddress,
            privyUserId: row.privyUserId,
            status: row.status as "phantom" | "claimed",
            createdAt: row.createdAt,
            claimedAt: row.claimedAt,
            mergedInto: row.mergedInto,
        }));
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            return Array.from(memoryUsers.values()).filter((u) => u.mergedInto === primaryUserId);
        }
        throw err;
    }
}

export async function createUser(data: {
    id: string;
    walletAddress: string;
    privyUserId?: string | null;
    status?: "phantom" | "claimed";
}): Promise<DbUser> {
    const user: DbUser = {
        id: data.id,
        walletAddress: data.walletAddress,
        privyUserId: data.privyUserId || null,
        status: data.status || "phantom",
        createdAt: new Date(),
        claimedAt: null,
        mergedInto: null,
    };

    try {
        const db = getDb();
        const [row] = await db
            .insert(schema.users)
            .values({
                id: user.id,
                walletAddress: user.walletAddress,
                privyUserId: user.privyUserId,
                status: user.status,
            })
            .returning();

        return {
            id: row.id,
            walletAddress: row.walletAddress,
            privyUserId: row.privyUserId,
            status: row.status as "phantom" | "claimed",
            createdAt: row.createdAt,
            claimedAt: row.claimedAt,
            mergedInto: row.mergedInto,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            memoryUsers.set(user.id, user);
            if (user.privyUserId) {
                memoryPrivyIndex.set(user.privyUserId, user.id);
            }
            return user;
        }
        throw err;
    }
}

export async function updateUser(
    userId: string,
    updates: Partial<Pick<DbUser, "privyUserId" | "status" | "claimedAt" | "mergedInto">>,
): Promise<DbUser | null> {
    try {
        const db = getDb();
        const [row] = await db
            .update(schema.users)
            .set(updates)
            .where(eq(schema.users.id, userId))
            .returning();

        if (!row) return null;

        return {
            id: row.id,
            walletAddress: row.walletAddress,
            privyUserId: row.privyUserId,
            status: row.status as "phantom" | "claimed",
            createdAt: row.createdAt,
            claimedAt: row.claimedAt,
            mergedInto: row.mergedInto,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            const user = memoryUsers.get(userId);
            if (!user) return null;

            Object.assign(user, updates);
            if (updates.privyUserId) {
                memoryPrivyIndex.set(updates.privyUserId, userId);
            }
            return user;
        }
        throw err;
    }
}

export async function listPhantomUsers(): Promise<DbUser[]> {
    try {
        const db = getDb();
        const rows = await db.select().from(schema.users).where(eq(schema.users.status, "phantom"));

        return rows
            .filter((row) => !row.mergedInto)
            .map((row) => ({
                id: row.id,
                walletAddress: row.walletAddress,
                privyUserId: row.privyUserId,
                status: row.status as "phantom" | "claimed",
                createdAt: row.createdAt,
                claimedAt: row.claimedAt,
                mergedInto: row.mergedInto,
            }));
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            return Array.from(memoryUsers.values()).filter(
                (u) => u.status === "phantom" && !u.mergedInto,
            );
        }
        throw err;
    }
}

// ─── Identity Repository ────────────────────────────────

export async function findIdentityByPlatform(
    platform: string,
    platformId: string,
): Promise<DbIdentity | null> {
    try {
        const db = getDb();
        const [row] = await db
            .select()
            .from(schema.identities)
            .where(
                and(
                    eq(schema.identities.platform, platform),
                    eq(schema.identities.platformId, platformId),
                ),
            )
            .limit(1);

        if (!row) return null;

        return {
            id: row.id,
            userId: row.userId,
            platform: row.platform,
            platformId: row.platformId,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            const identityId = memoryPlatformIndex.get(getPlatformKey(platform, platformId));
            if (!identityId) return null;
            return memoryIdentities.get(identityId) || null;
        }
        throw err;
    }
}

export async function findIdentitiesByUserId(userId: string): Promise<DbIdentity[]> {
    try {
        const db = getDb();
        const rows = await db
            .select()
            .from(schema.identities)
            .where(eq(schema.identities.userId, userId));

        return rows.map((row) => ({
            id: row.id,
            userId: row.userId,
            platform: row.platform,
            platformId: row.platformId,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
        }));
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            return Array.from(memoryIdentities.values()).filter((i) => i.userId === userId);
        }
        throw err;
    }
}

export async function createIdentity(data: {
    id: string;
    userId: string;
    platform: string;
    platformId: string;
    createdBy?: string | null;
}): Promise<DbIdentity> {
    const identity: DbIdentity = {
        id: data.id,
        userId: data.userId,
        platform: data.platform,
        platformId: data.platformId,
        createdBy: data.createdBy || null,
        createdAt: new Date(),
    };

    try {
        const db = getDb();
        const [row] = await db
            .insert(schema.identities)
            .values({
                id: identity.id,
                userId: identity.userId,
                platform: identity.platform,
                platformId: identity.platformId,
                createdBy: identity.createdBy,
            })
            .returning();

        return {
            id: row.id,
            userId: row.userId,
            platform: row.platform,
            platformId: row.platformId,
            createdBy: row.createdBy,
            createdAt: row.createdAt,
        };
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            memoryIdentities.set(identity.id, identity);
            memoryPlatformIndex.set(
                getPlatformKey(identity.platform, identity.platformId),
                identity.id,
            );
            return identity;
        }
        throw err;
    }
}

export async function updateIdentitiesUserId(
    fromUserId: string,
    toUserId: string,
): Promise<number> {
    try {
        const db = getDb();
        const result = await db
            .update(schema.identities)
            .set({ userId: toUserId })
            .where(eq(schema.identities.userId, fromUserId));

        return result.count ?? 0;
    } catch (err) {
        if (err instanceof DatabaseUnavailableError) {
            let count = 0;
            for (const identity of memoryIdentities.values()) {
                if (identity.userId === fromUserId) {
                    identity.userId = toUserId;
                    count++;
                }
            }
            return count;
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
