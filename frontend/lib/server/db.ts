// Server-only PostgreSQL pool for the Next.js API routes.
// Connection string comes from FLOWBENDER_DATABASE_URL (frontend/.env.local).
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __flowbenderPgPool: Pool | undefined;
}

export function getPool(): Pool {
  if (!global.__flowbenderPgPool) {
    const connectionString = process.env.FLOWBENDER_DATABASE_URL;
    if (!connectionString) {
      throw new Error("FLOWBENDER_DATABASE_URL is not set (frontend/.env.local).");
    }
    global.__flowbenderPgPool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
  }
  return global.__flowbenderPgPool;
}

let tableReady: Promise<void> | null = null;

export function ensureAppStateTable(): Promise<void> {
  if (!tableReady) {
    tableReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS app_state (
           key        text PRIMARY KEY,
           data       jsonb NOT NULL,
           updated_at timestamptz NOT NULL DEFAULT now()
         )`
      )
      .then(() => undefined)
      .catch((error) => {
        tableReady = null;
        throw error;
      });
  }
  return tableReady;
}
