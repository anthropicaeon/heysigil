import { spawn } from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import postgres from "postgres";

const LOCK_KEY = 792281625142643375n;
const DB_READY_ATTEMPTS = 20;
const DB_READY_DELAY_MS = 3000;
const LOCK_ATTEMPTS = 120;
const LOCK_DELAY_MS = 2000;

function loadEnvDatabaseUrl() {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
    if (!fs.existsSync(".env")) return undefined;

    const lines = fs.readFileSync(".env", "utf8").split(/\r?\n/);
    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const [key, ...rest] = line.split("=");
        if (key.trim() !== "DATABASE_URL") continue;
        const value = rest.join("=").trim();
        if (value) return value;
    }
    return undefined;
}

const databaseUrl = loadEnvDatabaseUrl();
if (!databaseUrl) {
    console.error("[db:migrate:safe] DATABASE_URL is required");
    process.exit(1);
}

const ssl = databaseUrl.includes("railway") ? { rejectUnauthorized: false } : false;
const sql = postgres(databaseUrl, {
    ssl,
    max: 1,
});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDbReady() {
    for (let attempt = 1; attempt <= DB_READY_ATTEMPTS; attempt += 1) {
        try {
            await sql`select 1 as ok`;
            return;
        } catch (err) {
            if (attempt === DB_READY_ATTEMPTS) throw err;
            console.warn(
                `[db:migrate:safe] DB not ready (attempt ${attempt}/${DB_READY_ATTEMPTS}), retrying...`,
            );
            await sleep(DB_READY_DELAY_MS);
        }
    }
}

async function acquireLock() {
    for (let attempt = 1; attempt <= LOCK_ATTEMPTS; attempt += 1) {
        const rows = await sql`select pg_try_advisory_lock(${LOCK_KEY}) as locked`;
        if (rows[0]?.locked) {
            console.log("[db:migrate:safe] migration lock acquired");
            return true;
        }

        if (attempt === LOCK_ATTEMPTS) break;

        console.log(
            `[db:migrate:safe] waiting for migration lock (${attempt}/${LOCK_ATTEMPTS})...`,
        );
        await sleep(LOCK_DELAY_MS);
    }

    return false;
}

async function releaseLock() {
    try {
        await sql`select pg_advisory_unlock(${LOCK_KEY})`;
        console.log("[db:migrate:safe] migration lock released");
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[db:migrate:safe] failed to release lock: ${message}`);
    }
}

function runDrizzleMigrate() {
    return new Promise((resolve) => {
        const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
        const child = spawn(npxCommand, ["drizzle-kit", "push", "--force"], {
            stdio: "inherit",
            env: process.env,
        });

        child.on("exit", (code) => resolve(code ?? 1));
        child.on("error", () => resolve(1));
    });
}

let lockHeld = false;

async function main() {
    try {
        await waitForDbReady();

        lockHeld = await acquireLock();
        if (!lockHeld) {
            console.error("[db:migrate:safe] could not acquire migration lock");
            process.exitCode = 1;
            return;
        }

        const exitCode = await runDrizzleMigrate();
        if (exitCode !== 0) {
            process.exitCode = exitCode;
            return;
        }
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[db:migrate:safe] ${message}`);
        process.exitCode = 1;
    } finally {
        if (lockHeld) {
            await releaseLock();
        }
        await sql.end({ timeout: 5 });
    }
}

void main();
