import { Pool } from "pg";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { logger } from "../logger";

const MIGRATIONS_TABLE = "payment_schema_migrations";

export async function runMigrations(): Promise<void> {
  const url =
    process.env.MIGRATION_DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL (or MIGRATION_DATABASE_URL) is required");
  }

  if (!process.env.MIGRATION_DATABASE_URL) {
    logger.warn("migrate_using_database_url", {
      event: "migrate_using_database_url",
      hint: "Set MIGRATION_DATABASE_URL to a role that can CREATE TABLE",
    });
  }

  const pool = new Pool({ connectionString: url });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
        id          TEXT PRIMARY KEY,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const dbDir = join(process.cwd(), "db");
    const files = readdirSync(dbDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const { rows } = await pool.query(
        `SELECT 1 FROM ${MIGRATIONS_TABLE} WHERE id = $1`,
        [file],
      );
      if (rows.length > 0) {
        logger.info("migration_skipped", { file });
        continue;
      }

      const sql = readFileSync(join(dbDir, file), "utf8");
      await pool.query("BEGIN");
      try {
        await pool.query(sql);
        await pool.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (id) VALUES ($1)`,
          [file],
        );
        await pool.query("COMMIT");
        logger.info("migration_applied", { file });
      } catch (err) {
        await pool.query("ROLLBACK");
        throw err;
      }
    }

    logger.info("migrations_complete", { count: files.length });
  } finally {
    await pool.end();
  }
}