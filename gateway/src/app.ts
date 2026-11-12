import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import {
  RateLimitEngine,
  RulesSyncPubSub,
  createRateLimitService,
  logger,
} from "@booking/shared";
import redisClient from "./config/redis";
import { createRateLimitMiddleware } from "./middleware/rateLimitMiddleware";
import { createRulesRouter } from "./domains/rules/rules.routes";
import { createProxyHandler } from "./proxy";
import { createSubdomainResolver } from "./middleware/subdomainResolver";
const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN ?? "bukkings.space";
const WEB_ORIGIN = process.env.WEB_ORIGIN;

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); 
    if (origin === WEB_ORIGIN) return callback(null, true);
    try {
      const { protocol, hostname } = new URL(origin);
      if (protocol === "https:" && hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
        return callback(null, true);
      }
    } catch {}
    return callback(null, false);
  },
  credentials: true,
};

export function createApp(engine: RateLimitEngine, rulesSync: RulesSyncPubSub) {
  const app = express();

   app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? 1));

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(cookieParser());
  app.use(express.json());

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
  app.get("/metrics", (_req, res) => res.status(200).json(engine.getStats()));

  const rateLimitService = createRateLimitService(rulesSync);
  app.use("/admin/rate-limit-rules", createRulesRouter(rateLimitService));

  app.use(createSubdomainResolver(redisClient));

  app.use(createRateLimitMiddleware(redisClient, engine));

  app.use("/", createProxyHandler());

  return app;
}
