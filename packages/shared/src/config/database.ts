import { Pool, PoolClient, types } from "pg";
import logger from "../utils/logger";
import { trackError } from "../utils/metrics";
import { requestContext } from "../context/requestContext";

types.setTypeParser(1700, (val: string) => parseFloat(val));

function makePool(url: string | undefined, label: string): Pool {
  const p = new Pool({
    connectionString:        url,
    max:                     20,
    idleTimeoutMillis:       30_000,
    connectionTimeoutMillis: 10_000,
  });
  p.on("error", (err) => {
    trackError("pg_pool_error", "database", "critical");
    logger.error("pg_pool_error", { event: "pg_pool_error", pool: label, error: err.message });
  });
  return p;
}

// booking_app
export const appPool = makePool(process.env.DATABASE_URL, "app");

// booking_worker: BYPASSRLS. Background jobs and queue consumers.
export const workerPool: Pool = process.env.WORKER_DATABASE_URL
  ? makePool(process.env.WORKER_DATABASE_URL, "worker")
  : appPool;

/**
 * Pool selection
 */
function poolFor(): Pool {
  const ctx = requestContext.get();
  if (!ctx) return workerPool;
  return ctx.dbRole === "worker" ? workerPool : appPool;
}

const MAX_RETRIES   = 5;
const BASE_DELAY_MS = 3_000;
const MAX_DELAY_MS  = 30_000;

async function probe(p: Pool): Promise<void> {
  const client = await p.connect();
  client.release();
}

export async function connectDB(): Promise<void> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await probe(appPool);
      if (workerPool !== appPool) await probe(workerPool);
      logger.info("pg_connected", { event: "pg_connected", attempt, workerPoolSeparate: workerPool !== appPool });
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
  const runner = requestContext.get()?.dbClient ?? poolFor();
  const result = await runner.query(text, params);
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

export async function checkoutClient(): Promise<PoolClient> {
  return poolFor().connect();
}

export type RlsContext = {
  tenantId?: string | null;
  userId?: string | null;
};

/**
 * Runs `fn` inside a transaction.
 *
 * RLS session vars:
 *   - explicit `opts` win
 *   - else fall back to requestContext (HTTP paths)
 *   - worker/webhook paths that have no context must pass opts
 *     or rely on the worker role (BYPASSRLS)
 *
 * If requestContext already holds a dbClient (rlsMiddleware /
 * beginTenantScopedTransaction), we reuse it and do NOT open a
 * nested transaction or re-set GUCs (they are already set).
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
  opts?: RlsContext,
): Promise<T> {
  const existing = requestContext.get()?.dbClient;

  // Already inside a request-scoped transaction → just run the callback.
  if (existing) {
    return fn(existing);
  }

  const client = await poolFor().connect();
  try {
    await client.query("BEGIN");

    const ctx = requestContext.get();
    const tenantId = opts?.tenantId ?? ctx?.tenantId ?? null;
    const userId = opts?.userId ?? ctx?.userId ?? null;

    if (tenantId) {
      await client.query(
        `SELECT set_config('app.current_tenant_id', $1, true)`,
        [tenantId],
      );
    }
    if (userId) {
      await client.query(
        `SELECT set_config('app.current_user_id', $1, true)`,
        [userId],
      );
    }

    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore rollback errors
    }
    throw e;
  } finally {
    client.release();
  }
}
export async function disconnectDB(): Promise<void> {
  await appPool.end();
  if (workerPool !== appPool) await workerPool.end();
  logger.info("pg_pool_closed", { event: "pg_pool_closed" });
}

export default appPool;
