import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";
import { getEnv } from "../config/env.js";

let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    const env = getEnv();
    const sql = postgres(env.DATABASE_URL);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

export { schema };
