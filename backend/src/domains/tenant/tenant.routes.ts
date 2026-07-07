import asyncHandler from "express-async-handler";
import { Request, Response, Router } from "express";
import Joi from "joi";
import { tenantRepository }  from "./tenant.repository";
import { auditRepository }   from "../audit/audit.repository";
import { authenticate, authorize, requireTenantMember } from "../../middleware/auth.middleware";
import { validate }          from "../../middleware/validate.middleware";
import { AppError }          from "../../utils/AppError";
import { CancellationPolicyTier } from "../../types";

const updateSettingsSchema = Joi.object({
  timezone: Joi.string().optional(),
  currency: Joi.string().length(3).uppercase().optional(),
  locale:   Joi.string().optional(),
});

const cancellationPolicySchema = Joi.object({
  policy: Joi.array().items(
    Joi.object({
      hours_before: Joi.number().integer().min(0).required(),
      refund_pct:   Joi.number().min(0).max(100).required(),
    })
  ).min(1).required(),
});

const GetMyTenantHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.user?.tenantId;       
  if (!tenantId) throw AppError.badRequest("Tenant context required.");
  const tenant = await tenantRepository.findById(tenantId);
  if (!tenant) throw AppError.notFound("Tenant not found.");
  res.status(200).json({ success: true, data: tenant });
});

const UpdateTenantSettingsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const updated = await tenantRepository.updateSettings(
    req.tenantId,
    req.body as { timezone?: string; currency?: string; locale?: string }
  );
  await auditRepository.log({
    action: "updated", resource: "tenant", resourceId: req.tenantId,
    tenantId: req.tenantId, userId: req.user?.userId,
    newValue: req.body as Record<string, unknown>,
  });
  res.status(200).json({ success: true, data: updated });
});

const UpdateCancellationPolicyHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { policy } = req.body as { policy: CancellationPolicyTier[] };
  const updated = await tenantRepository.updateCancellationPolicy(req.tenantId, policy);
  await auditRepository.log({
    action: "updated", resource: "tenant_policy", resourceId: req.tenantId,
    tenantId: req.tenantId, userId: req.user?.userId, newValue: { policy },
  });
  res.status(200).json({ success: true, data: updated });
});


const ListTenantsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenants = await tenantRepository.listAll(
    Number(req.query["page"] ?? 1),
    Number(req.query["limit"] ?? 20)
  );
  res.status(200).json({ success: true, data: tenants });
});

const SuspendTenantHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.params["tenantId"] as string;
  const updated  = await tenantRepository.updateStatus(tenantId, "suspended");
  if (!updated) throw AppError.notFound("Tenant not found.");
  await auditRepository.log({
    action: "status_changed", resource: "tenant", resourceId: tenantId,
    userId: req.user?.userId, newValue: { status: "suspended" },
  });
  res.status(200).json({ success: true, data: updated });
});

const ActivateTenantHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.params["tenantId"] as string;
  const updated  = await tenantRepository.updateStatus(tenantId, "active");
  if (!updated) throw AppError.notFound("Tenant not found.");
  await auditRepository.log({
    action: "status_changed", resource: "tenant", resourceId: tenantId,
    userId: req.user?.userId, newValue: { status: "active" },
  });
  res.status(200).json({ success: true, data: updated });
});

const router = Router();

router.get("/me",              authenticate,                                       GetMyTenantHandler);
router.patch("/me/settings",   authenticate, requireTenantMember, validate(updateSettingsSchema),      UpdateTenantSettingsHandler);
router.patch("/me/policy",     authenticate, requireTenantMember, validate(cancellationPolicySchema),  UpdateCancellationPolicyHandler);
router.get("/",                authenticate, authorize("platform:admin"),                              ListTenantsHandler);
router.patch("/:tenantId/suspend",  authenticate, authorize("platform:admin"),                        SuspendTenantHandler);
router.patch("/:tenantId/activate", authenticate, authorize("platform:admin"),                        ActivateTenantHandler);

export default router;
