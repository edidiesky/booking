import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { tenantService } from "./tenant.service";
import { AppError } from "@booking/shared";
import { CancellationPolicyTier } from "../../types";

export const GetMyTenantHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) throw AppError.badRequest("Tenant context required.");
    const tenant = await tenantService.getMyTenant(tenantId);
    res.status(200).json({ success: true, data: tenant });
  },
);

export const ListTenantsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tenants = await tenantService.listAll(
      Number(req.query["page"] ?? 1),
      Number(req.query["limit"] ?? 20),
    );
    res.status(200).json({ success: true, data: tenants });
  },
);

export const GetPublicTenantProfileHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const profile = await tenantService.getPublicProfile(
      req.params["tenantId"] as string,
    );
    res.status(200).json({ success: true, data: profile });
  },
);

export const GetAdminTenantDetailHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params["tenantId"] as string;
    const data = await tenantService.getAdminDetail(tenantId);
    res.status(200).json({ success: true, data });
  },
);

export const SuspendTenantHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params["tenantId"] as string;
    const updated = await tenantService.suspend(tenantId, req.user!.userId);
    res.status(200).json({ success: true, data: updated });
  },
);

export const ActivateTenantHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const tenantId = req.params["tenantId"] as string;
    const updated = await tenantService.activate(tenantId, req.user!.userId);
    res.status(200).json({ success: true, data: updated });
  },
);

export const UpdateTenantSettingsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const updated = await tenantService.updateSettings(
      req.tenantId,
      req.user!.userId,
      req.body,
    );
    res.status(200).json({ success: true, data: updated });
  },
);

export const UpdateTenantProfileHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const updated = await tenantService.updateProfile(
      req.tenantId,
      req.user!.userId,
      req.body,
    );
    res.status(200).json({ success: true, data: updated });
  },
);

export const UpdateCancellationPolicyHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const { policy } = req.body as { policy: CancellationPolicyTier[] };
    const updated = await tenantService.updateCancellationPolicy(
      req.tenantId,
      req.user!.userId,
      policy,
    );
    res.status(200).json({ success: true, data: updated });
  },
);

export const ClaimSubdomainHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId || !req.user)
      throw AppError.badRequest("Tenant context required.");
    const { subdomain } = req.body as { subdomain: string };
    if (!subdomain?.trim())
      throw AppError.badRequest("A subdomain is required.");
    const updated = await tenantService.claimSubdomain(
      req.tenantId,
      subdomain,
      req.user.userId,
    );
    res.status(200).json({ success: true, data: updated });
  },
);

export const ResolveSubdomainHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { subdomain } = req.params as { subdomain: string };
    const tenant = await tenantService.resolveBySubdomain(subdomain);
    if (!tenant) {
      res
        .status(404)
        .json({ success: false, message: "No tenant for this subdomain." });
      return;
    }
    res
      .status(200)
      .json({
        success: true,
        data: {
          tenantId: tenant.id,
          tenantName: tenant.name,
          tenantSlug: tenant.slug,
        },
      });
  },
);


export const AddCustomDomainHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId || !req.user) throw AppError.badRequest("Tenant context required.");
  const { domain } = req.body as { domain: string };
  if (!domain?.trim()) throw AppError.badRequest("A domain is required.");
  const updated = await tenantService.addCustomDomain(req.tenantId, domain, req.user.userId);
  res.status(200).json({ success: true, data: updated });
});

export const VerifyCustomDomainHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId || !req.user) throw AppError.badRequest("Tenant context required.");
  const updated = await tenantService.verifyCustomDomain(req.tenantId, req.user.userId);
  res.status(200).json({ success: true, data: updated });
});

export const RemoveCustomDomainHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId || !req.user) throw AppError.badRequest("Tenant context required.");
  const updated = await tenantService.removeCustomDomain(req.tenantId, req.user.userId);
  res.status(200).json({ success: true, data: updated });
});