import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { bookingService } from "./booking.service";
import { AppError } from "../../utils/AppError";
import { BookingStatus } from "../../types";
import { bookingRepository } from "./booking.repository";

//  Handlers
export const InitiateBookingHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();

    const body = req.body as {
      propertyId: string;
      roomTypeId: string;
      checkIn: string;
      checkOut: string;
      roomsCount: number;
      guestCount: number;
      specialRequests?: string;
    };

    const result = await bookingService.initiateBooking({
      propertyId: body.propertyId,
      roomTypeId: body.roomTypeId,
      guestUserId: req.user.userId,
      roomsCount: body.roomsCount,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      guestCount: body.guestCount,
      specialRequests: body.specialRequests,
    });

    res
      .status(201)
      .json({
        success: true,
        message: "Booking initiated. Proceed to payment.",
        data: result,
      });
  },
);

export const GetBookingHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const booking = await bookingService.getBookingById(
      req.params["bookingId"] as string,
    );

    if (
      req.user.userType === "guest" &&
      booking.guestUserId !== req.user.userId
    ) {
      throw AppError.forbidden("Access denied.");
    }
    res.status(200).json({ success: true, data: booking });
  },
);

export const GetMyBookingsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const { page, limit } = req.query as Record<string, string>;
    const bookings = await bookingService.getGuestBookings(
      req.user.userId,
      Number(page ?? 1),
      Number(limit ?? 20),
    );
    res.status(200).json({ success: true, data: bookings });
  },
);

export const GetTenantBookingsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const q = req.query as Record<string, string>;
    const bookings = await bookingService.getTenantBookings(req.tenantId, {
      status: q["status"] as BookingStatus | undefined,
      page: Number(q["page"] ?? 1),
      limit: Number(q["limit"] ?? 20),
    });
    res.status(200).json({ success: true, data: bookings });
  },
);

export const GetTenantBookingStatsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const stats = await bookingService.getTenantBookingStats(req.tenantId);
    res.status(200).json({ success: true, data: stats });
  },
);

export const CancelBookingHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const result = await bookingService.cancelBooking(
      req.params["bookingId"] as string,
      req.user.userId,
      (req.body as { reason?: string }).reason,
    );
    res
      .status(200)
      .json({ success: true, message: "Booking cancelled.", data: result });
  },
);

export const CheckInHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const result = await bookingService.checkIn(
      req.params["bookingId"] as string,
      req.user.userId,
    );
    res
      .status(200)
      .json({ success: true, message: "Guest checked in.", data: result });
  },
);

export const CheckOutHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const result = await bookingService.checkOut(
      req.params["bookingId"] as string,
      req.user.userId,
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Guest checked out. Escrow released.",
        data: result,
      });
  },
);

export const InternalCancelBookingHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const bookingId = req.params["bookingId"] as string;
    const { reason } = req.body as { reason?: string };

    const booking = await bookingService.cancelBooking(
      bookingId,
      "system",
      reason ?? "Payment window expired.",
    );
    res.status(200).json({ success: true, data: booking });
  },
);

export const ExportTenantBookingsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const tenantId = req.tenantId;

    const { nanoid } = await import("nanoid");
    const { enqueueExportJob, runExportJob } =
      await import("../../utils/runExportJob");
    const { bookingRepository } = await import("./booking.repository");

    const jobId = nanoid(21);
    await enqueueExportJob(jobId);
    res.status(202).json({ success: true, data: { jobId } });

    const { auditRepository } = await import("../audit/audit.repository");
    await auditRepository.log({
      action: "exported",
      resource: "bookings_pdf",
      tenantId,
      userId: req.user?.userId,
      req,
    });

    void runExportJob(
      jobId,
      async () => {
        const bookings = await bookingRepository.listByTenant(tenantId,undefined, 1, 1000);
        return {
          title: "Bookings Export",
          subtitle: "All bookings for your properties",
          generatedAt: new Date(),
          columns: [
            { key: "ref", label: "Reference" },
            { key: "guest", label: "Guest" },
            { key: "checkIn", label: "Check-in" },
            { key: "checkOut", label: "Check-out" },
            { key: "status", label: "Status" },
            { key: "total", label: "Total (₦)", align: "right" as const },
          ],
          rows: bookings.map((b) => ({
            ref: b.booking_ref,
            guest:
              [b.guest_first_name, b.guest_last_name]
                .filter(Boolean)
                .join(" ") || b.guest_user_id,
            checkIn: new Date(b.check_in).toLocaleDateString("en-NG"),
            checkOut: new Date(b.check_out).toLocaleDateString("en-NG"),
            status: b.status,
            total: Number(b.total_amount_ngn).toLocaleString("en-NG"),
          })),
        };
      },
      `bookings_export_${tenantId}`,
    );
  },
);

export const TransitionBookingStatusHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const { status } = req.body as { status: BookingStatus };
    const result = await bookingService.transitionStatus(
      req.tenantId,
      req.params["bookingId"] as string,
      status,
      req.user.userId,
    );
    res
      .status(200)
      .json({
        success: true,
        message: "Booking status updated.",
        data: result,
      });
  },
);

export const GetRevenueTrendHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const rangeParam = (req.query["range"] as string) ?? "7-days";
    const days = { "7-days": 7, "30-days": 30, "90-days": 90 }[rangeParam] ?? 7;
    const data = await bookingRepository.getRevenueTrend(req.tenantId, days);
    res.status(200).json({ success: true, data });
  },
);
