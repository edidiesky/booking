import { Pool, PoolClient } from "pg";
import logger from "../utils/logger";
import { trackError } from "../utils/metrics";

const pool = new Pool({
  connectionString:        process.env.DATABASE_URL,
  max:                     20,
  idleTimeoutMillis:       3_000,
  connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => {
  trackError("pg_pool_error", "database", "critical");
  logger.error("pg_pool_error", { event: "pg_pool_error", error: err.message });
});

const MAX_RETRIES   = 5;
const BASE_DELAY_MS = 3_000;
const MAX_DELAY_MS  = 3_000;

export async function connectDB(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const client = await pool.connect();
      client.release();
      logger.info("pg_connected", { event: "pg_connected", attempt });
      return;
    } catch (err) {
      const isLast = attempt === MAX_RETRIES;
      logger.error("pg_connection_attempt_failed", {
        event: "pg_connection_attempt_failed", attempt,
        error: err instanceof Error ? err.message : String(err),
      });
      if (isLast) throw new Error(`Failed to connect to PostgreSQL after ${attempt} attempts`);
      const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt - 1), MAX_DELAY_MS) + Math.random() * 1_000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

export async function query<T = Record<string, unknown>>(
  text:    string,
  params?: unknown[]
): Promise<T[]> {
  const start  = Date.now();
  const result = await pool.query(text, params);
  const dur    = Date.now() - start;
  if (dur > 500) {
    logger.warn("pg_slow_query", { event: "pg_slow_query", dur, text: text.slice(0, 120) });
  }
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text:    string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function disconnectDB(): Promise<void> {
  await pool.end();
  logger.info("pg_pool_closed", { event: "pg_pool_closed" });
}

export default pool;
