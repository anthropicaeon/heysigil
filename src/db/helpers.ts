/**
 * Database Query Helpers
 *
 * Common query patterns abstracted for reuse.
 */

import { eq } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { getDb, schema } from "./client.js";

/**
 * Generic single-record lookup by column value.
 * Eliminates repetitive select/where/limit patterns.
 *
 * Note: Return type uses $inferSelect to preserve full type inference.
 */
async function findBy<TTable extends PgTable, TResult = TTable["$inferSelect"]>(
    table: TTable,
    column: PgColumn,
    value: unknown,
): Promise<TResult | null> {
    const db = getDb();
    // biome-ignore lint/suspicious/noExplicitAny: Drizzle's complex generics require casting
    const [record] = await db
        .select()
        .from(table as any)
        .where(eq(column, value))
        .limit(1);
    return (record as TResult) ?? null;
}

/**
 * Shortcut helpers for common single-record lookups.
 *
 * @example
 * const verification = await find.verification(verificationId);
 * const project = await find.projectByProjectId("github.com/org/repo");
 */
export const find = {
    verification: (id: string) => findBy(schema.verifications, schema.verifications.id, id),
    project: (id: string) => findBy(schema.projects, schema.projects.id, id),
    projectByProjectId: (projectId: string) =>
        findBy(schema.projects, schema.projects.projectId, projectId),
    user: (id: string) => findBy(schema.users, schema.users.id, id),
    userByPrivyId: (privyUserId: string) =>
        findBy(schema.users, schema.users.privyUserId, privyUserId),
    userByWallet: (walletAddress: string) =>
        findBy(schema.users, schema.users.walletAddress, walletAddress),
};
