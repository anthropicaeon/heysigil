/**
 * Diagnostic: check feeDistributions table for HeySigil data.
 */
import { getDb, schema } from "../db/client.js";
import { getEnv } from "../config/env.js";
import { sql, eq } from "drizzle-orm";

// Force env load
getEnv();

async function main() {
    const db = getDb();

    // 1. Total records in feeDistributions
    const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.feeDistributions);
    console.log(`Total feeDistributions records: ${countResult.count}\n`);

    // 2. Records grouped by eventType
    const byType = await db
        .select({
            eventType: schema.feeDistributions.eventType,
            count: sql<number>`COUNT(*)`,
        })
        .from(schema.feeDistributions)
        .groupBy(schema.feeDistributions.eventType);
    console.log("By event type:");
    for (const row of byType) {
        console.log(`  ${row.eventType}: ${row.count}`);
    }

    // 3. Records with non-null projectId
    const [withProject] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(schema.feeDistributions)
        .where(sql`${schema.feeDistributions.projectId} IS NOT NULL`);
    console.log(`\nRecords with projectId set: ${withProject.count}`);

    // 4. All unique projectIds
    const projectIds = await db
        .selectDistinct({ projectId: schema.feeDistributions.projectId })
        .from(schema.feeDistributions)
        .where(sql`${schema.feeDistributions.projectId} IS NOT NULL`);
    console.log("\nUnique projectIds in feeDistributions:");
    for (const row of projectIds) {
        console.log(`  ${row.projectId}`);
    }

    // 5. Check projects table for poolId mapping
    const projects = await db
        .select({
            projectId: schema.projects.projectId,
            poolId: schema.projects.poolId,
            name: schema.projects.name,
            tokenAddress: schema.projects.poolTokenAddress,
        })
        .from(schema.projects);
    console.log("\nProjects in projects table:");
    for (const p of projects) {
        console.log(`  ${p.projectId} → poolId: ${p.poolId || "NULL"}, token: ${p.tokenAddress}`);
    }

    // 6. Check recent feeDistributions
    const recent = await db
        .select({
            id: schema.feeDistributions.id,
            eventType: schema.feeDistributions.eventType,
            poolId: schema.feeDistributions.poolId,
            projectId: schema.feeDistributions.projectId,
            devAmount: schema.feeDistributions.devAmount,
            amount: schema.feeDistributions.amount,
            blockNumber: schema.feeDistributions.blockNumber,
        })
        .from(schema.feeDistributions)
        .orderBy(sql`${schema.feeDistributions.blockNumber} DESC`)
        .limit(10);
    console.log("\nLast 10 feeDistributions:");
    for (const r of recent) {
        console.log(
            `  block=${r.blockNumber} type=${r.eventType} poolId=${r.poolId?.slice(0, 18)}... projectId=${r.projectId || "NULL"} devAmount=${r.devAmount} amount=${r.amount}`,
        );
    }

    // 7. Check indexer state
    const [indexerState] = await db.select().from(schema.indexerState);
    if (indexerState) {
        console.log(
            `\nIndexer state: last_block=${indexerState.lastProcessedBlock}, updated=${indexerState.updatedAt}`,
        );
    } else {
        console.log("\nNo indexer state found (indexer hasn't run)");
    }
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Error:", err);
        process.exit(1);
    });
