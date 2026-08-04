import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export default async function globalSetup(): Promise<void> {
  console.log("[globalSetup] starting PostgreSQL container...");

  const container: StartedPostgreSqlContainer = await new PostgreSqlContainer("postgres:16-alpine")
    .withDatabase("booking_test")
    .withUsername("booking_test")
    .withPassword("booking_test")
    .start();

  process.env["DATABASE_URL"] = container.getConnectionUri();
  process.env["NODE_ENV"]     = "test";
  const { runMigrations } = await import("../../../migrations/runner");
  await runMigrations();

  console.log("[globalSetup] migrations applied");
  (global as Record<string, unknown>)["__PG_CONTAINER__"] = container;
}