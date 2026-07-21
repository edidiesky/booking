import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { tenantService } from "./tenant.service";
import {  AppError } from "@booking/shared";
import { CancellationPolicyTier } from "../../types";
import { auditRepository } from "../audit/audit.repository";

export const GetMyTenantHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) throw AppError.badRequest("Tenant context required.");
  const tenant = await tenantService.getMyTenant(tenantId);
  res.status(200).json({ success: true, data: tenant });
});

export const UpdateTenantSettingsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const updated = await tenantService.updateSettings(req.tenantId, req.body);
  await auditRepository.log({
    action: "updated", resource: "tenant", resourceId: req.tenantId,
    tenantId: req.tenantId, userId: req.user?.userId, newValue: req.body,
  });
  res.status(200).json({ success: true, data: updated });
});

export const UpdateCancellationPolicyHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { policy } = req.body as { policy: CancellationPolicyTier[] };
  const updated = await tenantService.updateCancellationPolicy(req.tenantId, policy);
  await auditRepository.log({
    action: "updated", resource: "tenant_policy", resourceId: req.tenantId,
    tenantId: req.tenantId, userId: req.user?.userId, newValue: { policy },
  });
  res.status(200).json({ success: true, data: updated });
});

export const ListTenantsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenants = await tenantService.listAll(Number(req.query["page"] ?? 1), Number(req.query["limit"] ?? 20));
  res.status(200).json({ success: true, data: tenants });
});

export const SuspendTenantHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.params["tenantId"] as string;
  const updated = await tenantService.suspend(tenantId);
  await auditRepository.log({
    action: "status_changed", resource: "tenant", resourceId: tenantId,
    userId: req.user?.userId, newValue: { status: "suspended" },
  });
  res.status(200).json({ success: true, data: updated });
});

export const ActivateTenantHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.params["tenantId"] as string;
  const updated = await tenantService.activate(tenantId);
  await auditRepository.log({
    action: "status_changed", resource: "tenant", resourceId: tenantId,
    userId: req.user?.userId, newValue: { status: "active" },
  });
  res.status(200).json({ success: true, data: updated });
});

export const GetPublicTenantProfileHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const profile = await tenantService.getPublicProfile(req.params["tenantId"] as string);
  res.status(200).json({ success: true, data: profile });
});