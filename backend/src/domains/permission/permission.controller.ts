import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { permissionService } from "./permission.service";
import { AppError }          from "../../utils/AppError";

export const ListPermissionsHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const permissions = await permissionService.listAll();
  res.status(200).json({ success: true, data: permissions });
});

export const GetPermissionsByRoleHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { roleId } = req.params as { roleId: string };
  const permissions = await permissionService.getByRole(roleId);
  res.status(200).json({ success: true, data: permissions });
});

export const AddPermissionToRoleHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  await permissionService.addPermissionToRole(req.body, req.user.userId, req.tenantId);
  res.status(200).json({ success: true, message: "Permission added to role." });
});

export const RemovePermissionFromRoleHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  await permissionService.removePermissionFromRole(req.body, req.user.userId, req.tenantId);
  res.status(200).json({ success: true, message: "Permission removed from role." });
});
