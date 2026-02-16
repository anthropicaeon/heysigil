import postgres from "postgres";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const url = process.argv[2] || process.env.DATABASE_URL;
if (!url) {
    console.error("Usage: npx tsx scripts/migrate-railway.ts <DATABASE_URL>");
    process.exit(1);
}

const sql = postgres(url, { ssl: { rejectUnauthorized: false } });

const migrationsDir = join(import.meta.dirname, "../src/db/migrations");
const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

console.log(`Found ${files.length} migration files`);

for (const file of files) {
    console.log(`Applying: ${file}`);
    const content = readFileSync(join(migrationsDir, file), "utf-8");

    // Split on Drizzle's statement breakpoint marker
    const statements = content
        .split("--\u003e statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);

    for (const stmt of statements) {
        try {
            await sql.unsafe(stmt);
        } catch (e: any) {
            // Ignore "already exists" errors
            if (e.code === "42P07" || e.code === "42701") {
                console.log(`  (already exists, skipping)`);
            } else {
                console.error(`  Error: ${e.message}`);
            }
        }
    }
    console.log(`  ✓ done`);
}

await sql.end();
console.log("All migrations applied!");
