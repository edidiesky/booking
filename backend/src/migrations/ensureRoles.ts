import { Pool } from "pg";
import logger from "../utils/logger";

/**
 * Idempotent. Must run with a connection that can CREATE ROLE
 * (MIGRATION_DATABASE_URL or ADMIN_DATABASE_URL = Postgres owner).
 */
export async function ensureRoles(): Promise<void> {
  const url =
    process.env.ADMIN_DATABASE_URL ??
    process.env.MIGRATION_DATABASE_URL ??
    process.env.DATABASE_URL;

  if (!url) {
    throw new Error("ADMIN_DATABASE_URL or MIGRATION_DATABASE_URL is required to ensure roles");
  }

  const appPassword = process.env.APP_DB_PASSWORD;
  const workerPassword = process.env.WORKER_DB_PASSWORD;

  if (!appPassword || !workerPassword) {
    throw new Error("APP_DB_PASSWORD and WORKER_DB_PASSWORD must be set");
  }

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();

  try {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'booking_app') THEN
          CREATE ROLE booking_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS
            PASSWORD '${appPassword.replace(/'/g, "''")}';
        ELSE
          ALTER ROLE booking_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS
            PASSWORD '${appPassword.replace(/'/g, "''")}';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'booking_worker') THEN
          CREATE ROLE booking_worker LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS
            PASSWORD '${workerPassword.replace(/'/g, "''")}';
        ELSE
          ALTER ROLE booking_worker LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS
            PASSWORD '${workerPassword.replace(/'/g, "''")}';
        END IF;
      END $$;
    `);

    await client.query(`
      GRANT CONNECT ON DATABASE current_database() TO booking_app, booking_worker;
    `).catch(() => {
      // some managed providers restrict GRANT CONNECT; ignore if already granted
    });

    await client.query(`
      GRANT USAGE ON SCHEMA public TO booking_app, booking_worker;
      GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO booking_app, booking_worker;
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO booking_app, booking_worker;

      ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO booking_app, booking_worker;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT USAGE, SELECT ON SEQUENCES TO booking_app, booking_worker;

      CREATE SCHEMA IF NOT EXISTS app;
      GRANT USAGE ON SCHEMA app TO booking_app, booking_worker;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA app TO booking_app, booking_worker;
      ALTER DEFAULT PRIVILEGES IN SCHEMA app
        GRANT EXECUTE ON FUNCTIONS TO booking_app, booking_worker;
    `);

    // append-only audit_events
    await client.query(`
      DO $$
      BEGIN
        IF to_regclass('public.audit_events') IS NOT NULL THEN
          REVOKE UPDATE, DELETE ON public.audit_events FROM booking_app, booking_worker;
        END IF;
      END $$;
    `);

    logger.info("roles_ensured", {
      event: "roles_ensured",
      roles: ["booking_app", "booking_worker"],
    });
  } finally {
    client.release();
    await pool.end();
  }
}