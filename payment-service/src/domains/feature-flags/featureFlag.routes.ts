import { Router } from "express";
import { createFeatureFlagController } from "./featureFlag.controller";
import { FeatureFlagService } from "./featureFlag.service";
import { FeatureFlagRepository } from "./featureFlag.repository";
import { validateBody, validateParams } from "../../middleware/validate";
import {
  flagKeyParamSchema,
  patchFlagSchema,
} from "./featureFlag.validator";

/**
 * Same pattern as createPaymentRouter:
 * full paths on the router, controller factory, validators on the route.
 * Mount with app.use(createFeatureFlagRouter(service)) — no path prefix.
 */
export function createFeatureFlagRouter(service: FeatureFlagService): Router {
  const router = Router();
  const controller = createFeatureFlagController(service);

  router.get("/internal/flags", controller.list);
  router.get(
    "/internal/flags/:key",
    validateParams(flagKeyParamSchema),
    controller.get,
  );
  router.patch(
    "/internal/flags/:key",
    validateParams(flagKeyParamSchema),
    validateBody(patchFlagSchema),
    controller.patch,
  );

  return router;
}

/** Wires class-based repository + service + router for bootstrap */
export function createFeatureFlagModule(): {
  repository: FeatureFlagRepository;
  service: FeatureFlagService;
  router: Router;
} {
  const repository = new FeatureFlagRepository();
  const service = new FeatureFlagService(repository);
  const router = createFeatureFlagRouter(service);
  return { repository, service, router };
}
