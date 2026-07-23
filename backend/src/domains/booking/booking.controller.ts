import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { bookingService }     from "./booking.service";
import { AppError }           from "../../utils/AppError";
import { BookingStatus }      from "../../types";

//  Handlers 
export const InitiateBookingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();

  const body = req.body as { propertyId: string; roomTypeId: string; checkIn: string; checkOut: string; roomsCount: number; guestCount: number; specialRequests?: string };

  const result = await bookingService.initiateBooking({
    propertyId:      body.propertyId,
    roomTypeId:      body.roomTypeId,
    guestUserId:     req.user.userId,
    roomsCount:      body.roomsCount,
    checkIn:         body.checkIn,
    checkOut:        body.checkOut,
    guestCount:      body.guestCount,
    specialRequests: body.specialRequests,
  });

  res.status(201).json({ success: true, message: "Booking initiated. Proceed to payment.", data: result });
});

export const GetBookingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const booking = await bookingService.getBookingById(req.params["bookingId"] as string);

  if (req.user.userType === "guest" && booking.guestUserId !== req.user.userId) {
    throw AppError.forbidden("Access denied.");
  }
  res.status(200).json({ success: true, data: booking });
});

export const GetMyBookingsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { page, limit } = req.query as Record<string, string>;
  const bookings = await bookingService.getGuestBookings(req.user.userId, Number(page ?? 1), Number(limit ?? 20));
  res.status(200).json({ success: true, data: bookings });
});


export const GetTenantBookingsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const q = req.query as Record<string, string>;
  const bookings = await bookingService.getTenantBookings(req.tenantId, {
    status: q["status"] as BookingStatus | undefined,
    page:   Number(q["page"]  ?? 1),
    limit:  Number(q["limit"] ?? 20),
  });
  res.status(200).json({ success: true, data: bookings });
});

export const GetTenantBookingStatsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const stats = await bookingService.getTenantBookingStats(req.tenantId);
  res.status(200).json({ success: true, data: stats });
});

export const CancelBookingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await bookingService.cancelBooking(
    req.params["bookingId"] as string,
    req.user.userId,
    (req.body as { reason?: string }).reason
  );
  res.status(200).json({ success: true, message: "Booking cancelled.", data: result });
});

export const CheckInHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await bookingService.checkIn(req.params["bookingId"] as string, req.user.userId);
  res.status(200).json({ success: true, message: "Guest checked in.", data: result });
});

export const CheckOutHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await bookingService.checkOut(req.params["bookingId"] as string, req.user.userId);
  res.status(200).json({ success: true, message: "Guest checked out. Escrow released.", data: result });
});


export const InternalCancelBookingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const bookingId = req.params["bookingId"] as string;
  const { reason } = req.body as { reason?: string };

  const booking = await bookingService.cancelBooking(bookingId, "system", reason ?? "Payment window expired.");
  res.status(200).json({ success: true, data: booking });
});