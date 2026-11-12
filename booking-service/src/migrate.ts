import { Pool } from "pg";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { logger } from "./logger";

const MIGRATION_LOCK_KEY = 8_934_101;

/**
 * Applies db/*.sql (idempotent). Needs a role that can CREATE TABLE, so it uses
 * MIGRATION_DATABASE_URL (superuser) when set; default privileges configured by
 * infra/postgres/bootstrap-roles.sh let booking_app use the new tables.
 */
export async function runMigrations(): Promise<void> {
  const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
  const dir = join(__dirname, "..", "db");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const pool = new Pool({ connectionString: url, max: 1 });
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    for (const f of files)
      await client.query(readFileSync(join(dir, f), "utf8"));
    logger.info("booking_migrations_applied", {
      event: "booking_migrations_applied",
      files,
    });
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY]);
    } finally {
      client.release();
      await pool.end();
    }
  }
}
