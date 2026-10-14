import { bootstrap } from "./bootstrap";
import { registerGracefulShutdown } from "./shutdown";
import { logger } from "./logger";

const PORT = process.env.PORT ?? 4103;

async function main() {
  const { app, pool } = await bootstrap();
  const server = app.listen(PORT, () => {
    logger.info("ledger_service_started", { port: Number(PORT) });
  });
  registerGracefulShutdown(server, pool);
}

main().catch((err) => {
  logger.error("ledger_service_startup_failed", {
    error: (err as Error).message,
    stack: (err as Error).stack,
  });
  process.exit(1);
});
