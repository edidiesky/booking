import { Router } from "express";
import Joi from "joi";
import {
  authenticate,
  authorize,
  requireTenantMember,
} from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  GetMyTenantHandler,
  UpdateTenantSettingsHandler,
  UpdateCancellationPolicyHandler,
  ListTenantsHandler,
  SuspendTenantHandler,
  ActivateTenantHandler,
  GetPublicTenantProfileHandler,
} from "./tenant.controller";

const updateSettingsSchema = Joi.object({
  timezone: Joi.string().optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  locale: Joi.string().optional(),
});

const cancellationPolicySchema = Joi.object({
  policy: Joi.array()
    .items(
      Joi.object({
        hours_before: Joi.number().integer().min(0).required(),
        refund_pct: Joi.number().min(0).max(100).required(),
      }),
    )
    .min(1)
    .required(),
});

const router = Router();

// static routes
router.get("/me", authenticate, GetMyTenantHandler);
router.patch(
  "/me/settings",
  authenticate,
  requireTenantMember,
  validate(updateSettingsSchema),
  UpdateTenantSettingsHandler,
);
router.patch(
  "/me/policy",
  authenticate,
  requireTenantMember,
  validate(cancellationPolicySchema),
  UpdateCancellationPolicyHandler,
);
router.get("/", authenticate, authorize("platform:admin"), ListTenantsHandler);

router.get("/:tenantId/profile", GetPublicTenantProfileHandler);

router.patch(
  "/:tenantId/suspend",
  authenticate,
  authorize("platform:admin"),
  SuspendTenantHandler,
);
router.patch(
  "/:tenantId/activate",
  authenticate,
  authorize("platform:admin"),
  ActivateTenantHandler,
);

export default router;
