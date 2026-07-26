import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { sellerNotificationRepository } from "./seller.notification.repository";
import { AppError } from "../../utils/AppError";

export const ListSellerNotificationsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 30);
  const [notifications, unreadCount] = await Promise.all([
    sellerNotificationRepository.listByTenant(req.tenantId, page, limit),
    sellerNotificationRepository.unreadCount(req.tenantId),
  ]);
  res.status(200).json({ success: true, data: { notifications, unreadCount } });
});

export const GetUnreadCountHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const unreadCount = await sellerNotificationRepository.unreadCount(req.tenantId);
  res.status(200).json({ success: true, data: { unreadCount } });
});

export const MarkNotificationReadHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { id } = req.params as { id: string };
  await sellerNotificationRepository.markRead(id, req.tenantId);
  res.status(200).json({ success: true, message: "Marked read." });
});

export const MarkAllNotificationsReadHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  await sellerNotificationRepository.markAllRead(req.tenantId);
  res.status(200).json({ success: true, message: "All marked read." });
});