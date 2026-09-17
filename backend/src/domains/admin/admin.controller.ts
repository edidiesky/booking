import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { adminService } from "./admin.service";
import { AppError } from "@booking/shared";
import { BookingStatus } from "../../types";
import { disable, enable, getStatus, listDisabled } from "@booking/shared/dist/utils/killSwitch";

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



export const ListEscrowHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = pageParams(req);
  res.status(200).json({ success: true, data: await adminService.listEscrow(page, limit) });
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

export const GetEscrowStatsHandler = asyncHandler(async (_req, res) => {
  const data = await adminService.getEscrowStats();
  res.status(200).json({ success: true, data });
});

export const GetGanttBookingsInRangeHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const from = req.query["from"] as string;
  const to = req.query["to"] as string;
  const data = await adminService.getGanttBookingsInRange(from, to);
  res.status(200).json({ success: true, data });
});

export const ListKillSwitchesHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const corridors = await listDisabled();
  const statuses = await Promise.all(
    corridors.map(async (c) => ({ corridor: c, ...(await getStatus(c)) })),
  );
  res.status(200).json({ success: true, data: statuses });
});

export const GetKillSwitchStatusHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { corridor } = req.params as { corridor: string };
  const status = await getStatus(corridor);
  res.status(200).json({ success: true, data: status });
});

export const DisableKillSwitchHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { corridor } = req.params as { corridor: string };
  const { reason } = req.body as { reason?: string };
  if (!reason?.trim()) throw AppError.badRequest("A reason is required to disable a corridor.");
  await disable(corridor, reason, req.user.userId);
  res.status(200).json({ success: true, message: `${corridor} disabled.` });
});

export const EnableKillSwitchHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { corridor } = req.params as { corridor: string };
  await enable(corridor, req.user.userId);
  res.status(200).json({ success: true, message: `${corridor} re-enabled.` });
});