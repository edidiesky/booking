import express, { Express, Request } from "express";
import { Pool } from "pg";
import { connectRabbitMQ } from "@booking/shared";
import { createPaymentRouter } from "./domains/payment/payment.routes";
import { createFeatureFlagModule } from "./domains/feature-flags/featureFlag.routes";
import { errorHandler } from "./middleware/errorHandler";
import { runMigrations } from "./db/migrate";
import { logger } from "./logger";

export interface BootstrappedApp {
  app: Express;
  pool: Pool;
}

export async function bootstrap(): Promise<BootstrappedApp> {
  await runMigrations();

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await connectRabbitMQ();

  const featureFlags = createFeatureFlagModule();
  await featureFlags.service.start();

  const app = express();
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.use(featureFlags.router);
  app.use(createPaymentRouter(pool));
  app.use(errorHandler);

  logger.info("payment_service_bootstrapped", {
    featureFlags: featureFlags.service.getAll(),
  });

  return { app, pool };
}