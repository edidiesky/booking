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
  UpdateTenantProfileHandler,
  UpdateCancellationPolicyHandler,
  ListTenantsHandler,
  SuspendTenantHandler,
  ActivateTenantHandler,
  GetPublicTenantProfileHandler,
  GetAdminTenantDetailHandler,
  ResolveSubdomainHandler,
  ClaimSubdomainHandler,
  AddCustomDomainHandler,
  VerifyCustomDomainHandler,
  RemoveCustomDomainHandler,
} from "./tenant.controller";
import { requirePermission } from "../../middleware/require-permission.middleware";
import { requireInternalSecret } from "../../middleware/internal.middleware";

const updateSettingsSchema = Joi.object({
  timezone: Joi.string().optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  locale: Joi.string().optional(),
});

const updateProfileSchema = Joi.object({
  bio: Joi.string().max(1000).allow("").optional(),
  avatarUrl: Joi.string().uri().allow("").optional(),
  city: Joi.string().max(100).allow("").optional(),
  state: Joi.string().max(100).allow("").optional(),
  country: Joi.string().max(100).allow("").optional(),
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
  requirePermission("tenant", "update"),
  validate(updateSettingsSchema),
  UpdateTenantSettingsHandler,
);
router.patch(
  "/me/profile",
  authenticate,
  requireTenantMember,
  requirePermission("tenant", "update"),
  validate(updateProfileSchema),
  UpdateTenantProfileHandler,
);
router.patch(
  "/me/policy",
  authenticate,
  requireTenantMember,
  requirePermission("tenant", "update"),
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
router.patch(
  "/me/subdomain",
  authenticate,
  requireTenantMember,
  ClaimSubdomainHandler,
);

router.post(
  "/me/custom-domain",
  authenticate,
  requireTenantMember,
  AddCustomDomainHandler,
);
router.post(
  "/me/custom-domain/verify",
  authenticate,
  requireTenantMember,
  VerifyCustomDomainHandler,
);
router.delete(
  "/me/custom-domain",
  authenticate,
  requireTenantMember,
  RemoveCustomDomainHandler,
);

router.get(
  "/:tenantId/admin-detail",
  authenticate,
  authorize("platform:admin"),
  GetAdminTenantDetailHandler,
);
router.get(
  "/internal/subdomain/:subdomain",
  requireInternalSecret,
  ResolveSubdomainHandler,
);

router.get(
  "/by-subdomain/:subdomain",
  ResolveSubdomainHandler,
);

export default router;
