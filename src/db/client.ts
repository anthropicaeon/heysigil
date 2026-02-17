import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { getEnv } from "../config/env.js";
import { loggers } from "../utils/logger.js";

let _db: ReturnType<typeof drizzle> | null = null;
let _warned = false;

/**
 * Database unavailable error.
 * Routes can catch this and return HTTP 503.
 */
export class DatabaseUnavailableError extends Error {
    constructor() {
        super("Database not configured. Set DATABASE_URL in your .env file.");
        this.name = "DatabaseUnavailableError";
    }
}

/**
 * Returns a drizzle DB instance connected to Postgres.
 * Throws DatabaseUnavailableError if DATABASE_URL is not set.
 */
export function getDb(): ReturnType<typeof drizzle> {
    const env = getEnv();

    if (!env.DATABASE_URL) {
        if (!_warned) {
            loggers.db.warn("DATABASE_URL not set — database features are disabled");
            _warned = true;
        }
        throw new DatabaseUnavailableError();
    }

    if (!_db) {
        const sql = postgres(env.DATABASE_URL);
        _db = drizzle(sql, { schema });
    }
    return _db;
}

export { schema };
