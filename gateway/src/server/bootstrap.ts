import type { Express } from "express";
import { RateLimitEngine, RulesSyncPubSub, logger } from "@booking/shared";
import redisClient from "../config/redis";
import { createApp } from "../app";

export interface GatewayContext {
  app: Express;
  engine: RateLimitEngine;
  rulesSync: RulesSyncPubSub;
}

export async function bootstrapGateway(): Promise<GatewayContext> {
  const engine = new RateLimitEngine();
  await engine.start();
  logger.info("bootstrap_step_complete", { event: "bootstrap_step_complete", step: "rate_limit_engine" });

  const rulesSync = new RulesSyncPubSub(redisClient, engine, (err) => {
    logger.error("rules_sync_error", { event: "rules_sync_error", error: (err as Error).message });
  });
  await rulesSync.subscribe();
  logger.info("bootstrap_step_complete", { event: "bootstrap_step_complete", step: "rules_sync" });

  const app = createApp(engine, rulesSync);

  return { app, engine, rulesSync };
}