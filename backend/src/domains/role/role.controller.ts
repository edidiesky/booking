import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { roleService } from "./role.service";
import { AppError }    from "../../utils/AppError";

export const ListRolesHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const roles = await roleService.listRoles();
  res.status(200).json({ success: true, data: roles });
});

export const GetTenantRolesHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const roles = await roleService.getTenantRoles(req.tenantId);
  res.status(200).json({ success: true, data: roles });
});

export const GetUserRoleHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { userId } = req.params as { userId: string };
  const role = await roleService.getUserRole(userId, req.tenantId);
  res.status(200).json({ success: true, data: role });
});

export const AssignRoleHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user)     throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");

  const result = await roleService.assignRole({
    userId:       req.user.userId,
    tenantId:     req.tenantId,
    assignedById: req.user.userId,
    body:         req.body,
  });

  res.status(200).json({ success: true, message: "Role assigned.", data: result });
});

export const RevokeRoleHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user)     throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");

  const { userId } = req.params as { userId: string };

  await roleService.revokeRole({
    userId,
    tenantId:         req.tenantId,
    requestingUserId: req.user.userId,
  });

  res.status(200).json({ success: true, message: "Role revoked." });
});

export const GrantUserPermissionHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user)     throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");

  const result = await roleService.grantUserPermission({
    tenantId:     req.tenantId,
    assignedById: req.user.userId,
    body:         req.body,
  });

  res.status(200).json({ success: true, message: "Permission override applied.", data: result });
});

export const GetUserPermissionsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { userId } = req.params as { userId: string };
  const overrides = await roleService.getUserPermissions(userId, req.tenantId);
  res.status(200).json({ success: true, data: overrides });
});

export const RevokeUserPermissionHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user)     throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");

  const { userId, permissionId } = req.params as { userId: string; permissionId: string };

  await roleService.revokeUserPermission({
    userId,
    tenantId:         req.tenantId,
    permissionId,
    requestingUserId: req.user.userId,
  });

  res.status(200).json({ success: true, message: "Permission override removed." });
});

export const GetResolvedPermissionsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { userId } = req.params as { userId: string };
  const result = await roleService.getResolvedPermissions(userId, req.tenantId);
  res.status(200).json({ success: true, data: result });
});
