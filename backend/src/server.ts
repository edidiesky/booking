import "dotenv/config";
import http from "http";
import { app }                   from "./app";
import { bootstrapServer }       from "./server/bootstrap";
import { registerShutdownHooks } from "./server/shutdown";
import logger from "./utils/logger";

const PORT   = process.env.PORT ?? 4000;
const server = http.createServer(app);

async function start(): Promise<void> {
  await bootstrapServer();
  await new Promise<void>((resolve) => server.listen(PORT, () => resolve()));
  registerShutdownHooks(server);
  logger.info("server_started", { event: "server_started", service: "booking-platform", port: PORT, env: process.env.NODE_ENV });
}

start().catch((err) => {
  logger.error("server_start_failed", { event: "server_start_failed", error: (err as Error).message });
  process.exit(1);
});
