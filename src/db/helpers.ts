/**
 * Database Query Helpers
 *
 * Common query patterns abstracted for reuse.
 */

import { eq } from "drizzle-orm";
import { getDb, schema } from "./client.js";

/**
 * Shortcut helpers for common single-record lookups.
 *
 * @example
 * const verification = await find.verification(verificationId);
 * const project = await find.projectByProjectId("github.com/org/repo");
 */
export const find = {
    verification: async (id: string) => {
        const db = getDb();
        const [record] = await db
            .select()
            .from(schema.verifications)
            .where(eq(schema.verifications.id, id))
            .limit(1);
        return record ?? null;
    },

    project: async (id: string) => {
        const db = getDb();
        const [record] = await db
            .select()
            .from(schema.projects)
            .where(eq(schema.projects.id, id))
            .limit(1);
        return record ?? null;
    },

    projectByProjectId: async (projectId: string) => {
        const db = getDb();
        const [record] = await db
            .select()
            .from(schema.projects)
            .where(eq(schema.projects.projectId, projectId))
            .limit(1);
        return record ?? null;
    },

    user: async (id: string) => {
        const db = getDb();
        const [record] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, id))
            .limit(1);
        return record ?? null;
    },

    userByPrivyId: async (privyUserId: string) => {
        const db = getDb();
        const [record] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.privyUserId, privyUserId))
            .limit(1);
        return record ?? null;
    },

    userByWallet: async (walletAddress: string) => {
        const db = getDb();
        const [record] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.walletAddress, walletAddress))
            .limit(1);
        return record ?? null;
    },
};
