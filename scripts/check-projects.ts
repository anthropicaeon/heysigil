import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("No DATABASE_URL set");
    process.exit(1);
}

const sql = postgres(url, { ssl: { rejectUnauthorized: false } });

try {
    const rows = await sql`
        SELECT project_id, name, owner_wallet, pool_token_address, deployed_by, created_at
        FROM projects
        ORDER BY created_at DESC
        LIMIT 20
    `;

    console.log(`Found ${rows.length} projects:\n`);
    for (const r of rows) {
        console.log(`  projectId: ${r.project_id}`);
        console.log(`  name: ${r.name}`);
        console.log(`  ownerWallet: ${r.owner_wallet || "(NULL)"}`);
        console.log(`  poolTokenAddress: ${r.pool_token_address || "(NULL)"}`);
        console.log(`  deployedBy: ${r.deployed_by}`);
        console.log(`  createdAt: ${r.created_at}`);
        console.log("  ---");
    }
} catch (err) {
    console.error("DB query failed:", err);
} finally {
    await sql.end();
}
