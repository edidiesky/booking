import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createProxyMiddleware } from "http-proxy-middleware";
import { RateLimitEngine, RulesSyncPubSub, createRateLimitService, logger } from "@booking/shared";
import redisClient from "./config/redis";
import { createRateLimitMiddleware } from "./middleware/rateLimitMiddleware";
import { createRulesRouter } from "./domains/rules/rules.routes";

const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:4000";

export function createApp(engine: RateLimitEngine, rulesSync: RulesSyncPubSub) {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.get("/metrics", (_req, res) => res.status(200).json(engine.getStats()));

  const rateLimitService = createRateLimitService(rulesSync);
  app.use("/admin/rate-limit-rules", createRulesRouter(rateLimitService));

  app.use(createRateLimitMiddleware(redisClient, engine));

  app.use(
    "/",
    createProxyMiddleware({
      target: BACKEND_ORIGIN,
      changeOrigin: true,
      on: {
        error: (err, _req, res) => {
          logger.error("gateway_proxy_error", { event: "gateway_proxy_error", error: err.message });
          if ("writeHead" in res) {
            res.writeHead(502, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: "error", error: "Upstream service unavailable." }));
          }
        },
      },
    }),
  );

  return app;
}