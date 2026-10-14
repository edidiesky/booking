import express, { Express } from "express";
import { Pool } from "pg";
import { createSagaRouter } from "./routes/saga.routes";
import { errorHandler } from "./middleware/errorHandler";
import { startSagaSweeper } from "./services/sagaSweeper";

export interface BootstrappedApp {
  app: Express;
  pool: Pool;
  stopSweeper: () => void;
}

export async function bootstrap(): Promise<BootstrappedApp> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const app = express();
  app.use(express.json());
  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.use(createSagaRouter(pool));
  app.use(errorHandler);
  const stopSweeper = startSagaSweeper(pool);
  return { app, pool, stopSweeper };
}
