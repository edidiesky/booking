import { Pool } from "pg";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { logger } from "../logger";

// Arbitrary constant: serialises concurrent boots (e.g. rolling deploys).
const MIGRATION_LOCK_KEY = 8_934_104;

/**
 * Applies every db/*.sql file in name order. All files are idempotent.
 * Uses MIGRATION_DATABASE_URL (superuser) when set because the runtime role
 * (booking_app) cannot CREATE TABLE.
 */
export async function runMigrations(): Promise<void> {
  const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!process.env.MIGRATION_DATABASE_URL) {
    logger.warn("orchestration_migrate_using_database_url", {
      event: "orchestration_migrate_using_database_url",
      hint: "Set MIGRATION_DATABASE_URL to postgres superuser DSN",
    });
  }

  const dir = join(__dirname, "..", "..", "db");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const pool = new Pool({ connectionString: url, max: 1 });
  const client = await pool.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    for (const file of files) {
      await client.query(readFileSync(join(dir, file), "utf8"));
    }
    logger.info("orchestration_migrations_applied", {
      event: "orchestration_migrations_applied",
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
