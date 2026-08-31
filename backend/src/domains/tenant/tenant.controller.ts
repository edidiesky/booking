import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { tenantService } from "./tenant.service";
import {  AppError } from "@booking/shared";
import { CancellationPolicyTier } from "../../types";

export const GetMyTenantHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) throw AppError.badRequest("Tenant context required.");
  const tenant = await tenantService.getMyTenant(tenantId);
  res.status(200).json({ success: true, data: tenant });
});


export const ListTenantsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenants = await tenantService.listAll(Number(req.query["page"] ?? 1), Number(req.query["limit"] ?? 20));
  res.status(200).json({ success: true, data: tenants });
});

export const GetPublicTenantProfileHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const profile = await tenantService.getPublicProfile(req.params["tenantId"] as string);
  res.status(200).json({ success: true, data: profile });
});

export const GetAdminTenantDetailHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.params["tenantId"] as string;
  const data = await tenantService.getAdminDetail(tenantId);
  res.status(200).json({ success: true, data });
});


export const SuspendTenantHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.params["tenantId"] as string;
  const updated = await tenantService.suspend(tenantId, req.user!.userId);
  res.status(200).json({ success: true, data: updated });
});

export const ActivateTenantHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tenantId = req.params["tenantId"] as string;
  const updated = await tenantService.activate(tenantId, req.user!.userId);
  res.status(200).json({ success: true, data: updated });
});

export const UpdateTenantSettingsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const updated = await tenantService.updateSettings(req.tenantId, req.user!.userId, req.body);
  res.status(200).json({ success: true, data: updated });
});

export const UpdateTenantProfileHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const updated = await tenantService.updateProfile(req.tenantId, req.user!.userId, req.body);
  res.status(200).json({ success: true, data: updated });
});

export const UpdateCancellationPolicyHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { policy } = req.body as { policy: CancellationPolicyTier[] };
  const updated = await tenantService.updateCancellationPolicy(req.tenantId, req.user!.userId, policy);
  res.status(200).json({ success: true, data: updated });
});