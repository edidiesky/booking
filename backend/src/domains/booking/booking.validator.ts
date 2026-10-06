import Joi from "joi";
import { paginationKeys } from "../../utils/pagination";


//  Validators
export const initiateSchema = Joi.object({
  propertyId:      Joi.string().uuid().required(),
  roomTypeId:      Joi.string().uuid().required(),
  checkIn:         Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  checkOut:        Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  roomsCount:      Joi.number().integer().min(1).max(20).default(1),
  guestCount:      Joi.number().integer().min(1).required(),
  specialRequests: Joi.string().max(1000).optional(),
});

export const cancelSchema = Joi.object({
  reason: Joi.string().max(500).optional(),
});


export const transitionStatusSchema = Joi.object({
  status: Joi.string()
    .valid("pending_payment", "confirmed", "checked_in", "checked_out", "cancelled", "refunded")
    .required(),
});

export const listQuerySchema = Joi.object({
  status: Joi.string().valid("pending_payment","confirmed","checked_in","checked_out","cancelled","refunded").optional(),
  checkInAfter:  Joi.date().iso().optional(),
  checkInBefore: Joi.date().iso().optional(),
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
});


const BOOKING_STATUSES = [
  "pending_payment",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "refunded",
] as const;

const isoDay = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);

export const tenantListQuerySchema = Joi.object({
  // 200 because the analytics page requests 200 rows today.
  ...paginationKeys(200, 20),
  status: Joi.array()
    .items(Joi.string().valid(...BOOKING_STATUSES))
    .single()
    .unique()
    .optional(),
  search: Joi.string().trim().max(50).allow("").optional(),
  checkInFrom: isoDay.optional(),
  checkInTo: isoDay.optional(),
});