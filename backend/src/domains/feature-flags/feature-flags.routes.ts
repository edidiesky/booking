import { Router } from "express";
import asyncHandler from "express-async-handler";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/AppError";
import {
  isKnownFeatureFlag,
} from "../../config/feature-registry";
import type { FeatureFlagRepository } from "./featureFlag.repository";
import type { FeatureFlagEngine } from "./FeatureFlagEngine";

export function createFeatureFlagRouter(
  repository: FeatureFlagRepository,
  engine: FeatureFlagEngine,
): Router {
  const router = Router();

  router.get(
    "/",
    authenticate,
    authorize("platform:admin"),
    asyncHandler(async (_req, res) => {
      res.status(200).json({ success: true, data: engine.getAll() });
    }),
  );

  router.get(
    "/:key",
    authenticate,
    authorize("platform:admin"),
    asyncHandler(async (req, res) => {
      const key = req.params.key as string;
      if (!isKnownFeatureFlag(key))
        throw AppError.notFound("Unknown feature flag.");
      res.status(200).json({
        success: true,
        data: { key, enabled: engine.isEnabled(key) },
      });
    }),
  );

  router.patch(
    "/:key",
    authenticate,
    authorize("platform:admin"),
    asyncHandler(async (req, res) => {
      const key = req.params.key as string;
      const { enabled } = req.body as { enabled?: boolean };

      if (!isKnownFeatureFlag(key))
        throw AppError.notFound("Unknown feature flag.");
      if (typeof enabled !== "boolean") {
        throw AppError.badRequest("enabled must be a boolean.");
      }

      await repository.set(key, enabled, req.user!.userId);
      // Local apply immediately (pub/sub will update other instances)
      engine.applyUpdate(key, enabled);

      res.status(200).json({
        success: true,
        message: `${key} ${enabled ? "enabled" : "disabled"}.`,
        data: { key, enabled },
      });
    }),
  );

  return router;
}
