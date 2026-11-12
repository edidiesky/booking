import type { Request, Response, NextFunction } from "express";
import type { FeatureFlagKey } from "../config/feature-registry";
import { getFeatureFlagEngine } from "../domains/feature-flags/FeatureFlagEngine";
import { AppError } from "../utils/AppError";

export function requireFeatureFlag(key: FeatureFlagKey) {
  return function featureFlagGuard(
    _req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    if (!getFeatureFlagEngine().isEnabled(key)) {
      next(AppError.notFound("Feature is not available."));
      return;
    }
    next();
  };
}