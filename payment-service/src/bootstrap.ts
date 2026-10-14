import express, { Express, Request } from "express";
import { Pool } from "pg";
import { connectRabbitMQ } from "@booking/shared";
import { createPaymentRouter } from "./domains/payment/payment.routes";
import { errorHandler } from "./middleware/errorHandler";

export interface BootstrappedApp {
  app: Express;
  pool: Pool;
}

export async function bootstrap(): Promise<BootstrappedApp> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await connectRabbitMQ();

  const app = express();
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = buf;
      },
    }),
  );
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.use(createPaymentRouter(pool));
  app.use(errorHandler);

  return { app, pool };
}
