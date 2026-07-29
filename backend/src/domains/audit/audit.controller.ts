import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { auditService, type ListTenantAuditLogsQuery } from "./audit.service";
import { AppError } from "../../utils/AppError";

export const GetTenantAuditLogsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const logs = await auditService.listTenantAuditLogs(req.tenantId, req.query as unknown as ListTenantAuditLogsQuery);
  res.status(200).json({ success: true, data: logs });
});

export const GetMyAuditLogsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const logs = await auditService.listMyAuditLogs(req.user.userId, page, limit);
  res.status(200).json({ success: true, data: logs });
});