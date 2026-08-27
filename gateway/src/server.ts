import "dotenv/config";
import { logger } from "@booking/shared";
import { bootstrapGateway } from "./server/bootstrap";
import { registerShutdownHooks } from "./server/shutdown";

const PORT = process.env.PORT ?? 8080;

async function start(): Promise<void> {
  const { app, engine, rulesSync } = await bootstrapGateway();

  const server = app.listen(PORT, () => {
    logger.info("gateway_started", { event: "gateway_started", port: PORT });
  });

  registerShutdownHooks(server, engine, rulesSync);
}

start().catch((err) => {
  logger.error("gateway_start_failed", { event: "gateway_start_failed", error: (err as Error).message });
  process.exit(1);
});