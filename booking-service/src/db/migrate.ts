import { Pool } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { logger } from "../logger";

const MIGRATIONS_TABLE = "booking_schema_migrations";

export async function runMigrations(): Promise<void> {
  const url =
    process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL (or MIGRATION_DATABASE_URL) is required");
  }

  const pool = new Pool({ connectionString: url });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        filename    TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const dbDir = join(process.cwd(), "db");
    const files = readdirSync(dbDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const { rows } = await pool.query(
        `SELECT 1 FROM ${MIGRATIONS_TABLE} WHERE filename = $1`,
        [file],
      );
      if (rows.length > 0) {
        logger.info("booking_migration_skipped", { file });
        continue;
      }

      const sql = readFileSync(join(dbDir, file), "utf8");
      logger.info("booking_migration_applying", { file });

      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (filename) VALUES ($1)`,
          [file],
        );
        await pool.query("COMMIT");
        logger.info("booking_migration_applied", { file });
      } catch (err) {
        await pool.query("ROLLBACK");
        logger.error("booking_migration_failed", {
          file,
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    }

    logger.info("booking_migrations_complete", { count: files.length });
  } finally {
    await pool.end();
  }
}