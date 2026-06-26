import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { notificationRepository }   from "./notification.repository";
import { AppError }                  from "../../utils/AppError";

const GetTenantNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 50);
  const logs  = await notificationRepository.listByTenant(req.tenantId, page, limit);
  res.status(200).json({ success: true, data: logs });
});

const GetMyNotificationsHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw AppError.unauthorized();
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 50);
  const logs  = await notificationRepository.listByUser(req.user.userId, page, limit);
  res.status(200).json({ success: true, data: logs });
});

export {
  GetMyNotificationsHandler,
  GetTenantNotificationsHandler
}