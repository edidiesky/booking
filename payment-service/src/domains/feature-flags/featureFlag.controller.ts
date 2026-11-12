import { Request, Response, NextFunction } from "express";
import { FeatureFlagService } from "./featureFlag.service";

/**
 * Same shape as createPaymentController: factory returning handler map.
 */
export function createFeatureFlagController(service: FeatureFlagService) {
  return {
    async list(_req: Request, res: Response, next: NextFunction) {
      try {
        res.status(200).json({ success: true, data: service.getAll() });
      } catch (err) {
        next(err);
      }
    },

    async get(req: Request, res: Response, next: NextFunction) {
      try {
        const data = service.getOne(req.params.key as string);
        res.status(200).json({ success: true, data });
      } catch (err) {
        next(err);
      }
    },

    async patch(req: Request, res: Response, next: NextFunction) {
      try {
        const key = req.params.key as string;
        const { enabled } = req.body as { enabled: boolean };
        const changedBy =
          (req.header("x-actor-id") as string | undefined) ?? "system";

        const data = await service.setFlag(key, enabled, changedBy);

        res.status(200).json({
          success: true,
          message: `${data.key} ${data.enabled ? "enabled" : "disabled"}.`,
          data,
        });
      } catch (err) {
        next(err);
      }
    },
  };
}
