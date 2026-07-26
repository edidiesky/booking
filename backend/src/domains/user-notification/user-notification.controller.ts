import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { userNotificationRepository } from "./user-notification.repository";
import { AppError } from "../../utils/AppError";

export const ListUserNotificationsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const page  = Number(req.query["page"]  ?? 1);
  const limit = Number(req.query["limit"] ?? 30);
  const [notifications, unreadCount] = await Promise.all([
    userNotificationRepository.listByUser(req.user.userId, page, limit),
    userNotificationRepository.unreadCount(req.user.userId),
  ]);
  res.status(200).json({ success: true, data: { notifications, unreadCount } });
});

export const MarkUserNotificationReadHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { id } = req.params as { id: string };
  await userNotificationRepository.markRead(id, req.user.userId);
  res.status(200).json({ success: true, message: "Marked read." });
});

export const MarkAllUserNotificationsReadHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  await userNotificationRepository.markAllRead(req.user.userId);
  res.status(200).json({ success: true, message: "All marked read." });
});