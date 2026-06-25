import asyncHandler from "express-async-handler";
import { Request, Response, Router } from "express";
import Joi from "joi";
import { bookingService }     from "./booking.service";
import { authenticate, authorize, requireTenantMember } from "../../middleware/auth.middleware";
import { validate }           from "../../middleware/validate.middleware";
import { AppError }           from "../../utils/AppError";
import { BookingStatus }      from "../../types";

// -- Validators --
const initiateSchema = Joi.object({
  propertyId:      Joi.string().uuid().required(),
  roomTypeId:      Joi.string().uuid().required(),
  checkIn:         Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  checkOut:        Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  roomsCount:      Joi.number().integer().min(1).max(20).default(1),
  guestCount:      Joi.number().integer().min(1).required(),
  specialRequests: Joi.string().max(1000).optional(),
});

const cancelSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});

const listQuerySchema = Joi.object({
  status: Joi.string().valid("pending_payment","confirmed","checked_in","checked_out","cancelled","refunded").optional(),
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
});

// -- Handlers --
const InitiateBookingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user)     throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");

  const body = req.body as { propertyId: string; roomTypeId: string; checkIn: string; checkOut: string; roomsCount: number; guestCount: number; specialRequests?: string };

  const result = await bookingService.initiateBooking({
    tenantId:        req.tenantId,
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

const GetBookingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const booking = await bookingService.getBookingById(req.params["bookingId"] as string);

  if (req.user.userType === "guest" && booking.guestUserId !== req.user.userId) {
    throw AppError.forbidden("Access denied.");
  }
  res.status(200).json({ success: true, data: booking });
});

const GetMyBookingsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { page, limit } = req.query as Record<string, string>;
  const bookings = await bookingService.getGuestBookings(req.user.userId, Number(page ?? 1), Number(limit ?? 20));
  res.status(200).json({ success: true, data: bookings });
});

const GetTenantBookingsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const q = req.query as Record<string, string>;
  const bookings = await bookingService.getTenantBookings(req.tenantId, {
    status: q["status"] as BookingStatus | undefined,
    page:   Number(q["page"]  ?? 1),
    limit:  Number(q["limit"] ?? 20),
  });
  res.status(200).json({ success: true, data: bookings });
});

const CancelBookingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await bookingService.cancelBooking(
    req.params["bookingId"] as string,
    req.user.userId,
    (req.body as { reason?: string }).reason
  );
  res.status(200).json({ success: true, message: "Booking cancelled.", data: result });
});

const CheckInHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await bookingService.checkIn(req.params["bookingId"] as string, req.user.userId);
  res.status(200).json({ success: true, message: "Guest checked in.", data: result });
});

const CheckOutHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await bookingService.checkOut(req.params["bookingId"] as string, req.user.userId);
  res.status(200).json({ success: true, message: "Guest checked out. Escrow released.", data: result });
});

// -- Router --
const router = Router();

router.post("/",                     authenticate, authorize("guest"),    validate(initiateSchema),    InitiateBookingHandler);
router.get("/mine",                  authenticate, authorize("guest"),    validate(listQuerySchema, "query"), GetMyBookingsHandler);
router.get("/tenant",                authenticate, requireTenantMember,   validate(listQuerySchema, "query"), GetTenantBookingsHandler);
router.get("/:bookingId",            authenticate,                        GetBookingHandler);
router.patch("/:bookingId/cancel",   authenticate, authorize("guest"),    validate(cancelSchema),      CancelBookingHandler);
router.patch("/:bookingId/checkin",  authenticate, requireTenantMember,   CheckInHandler);
router.patch("/:bookingId/checkout", authenticate, requireTenantMember,   CheckOutHandler);

export default router;
