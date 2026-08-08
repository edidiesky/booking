import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { adminService } from "./admin.service";
import { AppError } from "@booking/shared";
import { BookingStatus } from "../../types";

function pageParams(req: Request) {
  return {
    page:  Number(req.query["page"]  ?? 1),
    limit: Number(req.query["limit"] ?? 20),
  };
}
export const GetPlatformStatsHandler = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const data = await adminService.getPlatformStats();
  res.status(200).json({ success: true, data });
});
export const ListGuestsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = pageParams(req);
  res.status(200).json({ success: true, data: await adminService.listGuests(page, limit) });
});

export const ListAdministratorsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = pageParams(req);
  res.status(200).json({ success: true, data: await adminService.listAdministrators(page, limit) });
});

export const PromoteAdministratorHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = await adminService.promoteToAdministrator(req.params["userId"] as string);
  res.status(200).json({ success: true, message: "User promoted to platform administrator.", data });
});

export const DemoteAdministratorHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const data = await adminService.demoteAdministrator(req.params["userId"] as string);
  res.status(200).json({ success: true, message: "Administrator access revoked.", data });
});

export const ListAuditLogsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = pageParams(req);
  res.status(200).json({ success: true, data: await adminService.listAuditLogs(page, limit) });
});

export const ListPropertiesAdminHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = pageParams(req);
  res.status(200).json({ success: true, data: await adminService.listProperties(page, limit) });
});

export const ListBookingsAdminHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = pageParams(req);
  const status = req.query["status"] as BookingStatus | undefined;
  res.status(200).json({ success: true, data: await adminService.listBookings(page, limit, status) });
});

export const ListPaymentsAdminHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = pageParams(req);
  res.status(200).json({ success: true, data: await adminService.listPayments(page, limit) });
});

export const GetCalendarAdminHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startDate = req.query["startDate"] as string;
  const endDate   = req.query["endDate"] as string;
  if (!startDate || !endDate) throw AppError.badRequest("startDate and endDate are required.");
  const data = await adminService.getCalendar(startDate, endDate);
  res.status(200).json({ success: true, data });
});

export const GetTenantActivityHandler = asyncHandler(async (req, res) => {
  const { page, limit } = pageParams(req);
  const data = await adminService.getTenantActivity(req.params["tenantId"] as string, page, limit);
  res.status(200).json({ success: true, data });
});

export const ListNotificationsAdminHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = pageParams(req);
  const tenantId = req.query["tenantId"] as string | undefined;
  const data = await adminService.listNotifications(page, limit, tenantId);
  res.status(200).json({ success: true, data });
});

export const GetAdminRevenueTrendHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const rangeParam = (req.query["range"] as string) ?? "7-days";
  const data = await adminService.getRevenueTrend(rangeParam);
  res.status(200).json({ success: true, data });
});