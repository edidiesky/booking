import fs from "fs";
import path from "path";
import "dotenv/config";
import { Pool } from "pg";
import logger from "../utils/logger";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const MIGRATIONS_ADVISORY_LOCK_KEY = 8934221;

const SQL_DIR = path.join(__dirname, "sql");

const STANDALONE_MIGRATIONS = new Set(["038_audit_action_add_exported.sql"]);

function loadMigrationFiles(): { filename: string; sql: string }[] {
  const files = fs
    .readdirSync(SQL_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  return files.map((filename) => ({
    filename,
    sql: fs.readFileSync(path.join(SQL_DIR, filename), "utf-8"),
  }));
}

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename   VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT now()
    );
  `);
}

export async function runMigrations(): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATIONS_ADVISORY_LOCK_KEY]);

    await ensureMigrationsTable();
    const appliedRows = await client.query<{ filename: string }>(
      "SELECT filename FROM schema_migrations",
    );
    const applied = new Set(appliedRows.rows.map((r) => r.filename));

    const all = loadMigrationFiles();
    const pending = all.filter((m) => !applied.has(m.filename));

    if (pending.length === 0) {
      logger.info("migrations_up_to_date", {
        event: "migrations_up_to_date",
        totalMigrations: all.length,
      });
      return;
    }

    await client.query("BEGIN");
    let inTransaction = true;

    try {
      for (const migration of pending) {
        if (STANDALONE_MIGRATIONS.has(migration.filename)) {
          if (inTransaction) {
            await client.query("COMMIT");
            inTransaction = false;
          }
          await client.query("BEGIN");
          await client.query(migration.sql);
          await client.query(
            "INSERT INTO schema_migrations (filename) VALUES ($1)",
            [migration.filename],
          );
          await client.query("COMMIT");
          await client.query("BEGIN");
          inTransaction = true;
        } else {
          await client.query(migration.sql);
          await client.query(
            "INSERT INTO schema_migrations (filename) VALUES ($1)",
            [migration.filename],
          );
        }
      }

      if (inTransaction) {
        await client.query("COMMIT");
      }
    } catch (err) {
      if (inTransaction) {
        await client.query("ROLLBACK");
      }
      throw err;
    }

    logger.info("migrations_complete", {
      event: "migrations_complete",
      appliedCount: pending.length,
      totalMigrations: all.length,
    });
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATIONS_ADVISORY_LOCK_KEY]);
    client.release();
  }
}