import { bootstrap } from "./bootstrap";
import { registerGracefulShutdown } from "./shutdown";
import { logger } from "./logger";

const PORT = process.env.PORT ?? 4104;

async function main() {
  const { app, pool, stopSweeper } = await bootstrap();
  const server = app.listen(PORT, () => {
    logger.info("orchestration_service_started", { port: Number(PORT) });
  });
  registerGracefulShutdown(server, pool, stopSweeper);
}

main().catch((err) => {
  logger.error("orchestration_service_startup_failed", {
    error: (err as Error).message,
    stack: (err as Error).stack,
  });
  process.exit(1);
});
