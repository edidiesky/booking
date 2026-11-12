import Joi from "joi";

/** YYYY-MM-DD or ISO timestamp in, plain YYYY-MM-DD out (never a Date object). */
const dateOnly = Joi.string().custom((value: string, helpers) => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const d = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value) {
      return helpers.error("any.invalid");
    }
    return value;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return helpers.error("any.invalid");
  return d.toISOString().slice(0, 10);
}, "date-only normalisation");

export const reserveBookingSchema = Joi.object({
  tenantId: Joi.string().uuid().required(),
  roomTypeId: Joi.string().uuid().required(),
  guestUserId: Joi.string().uuid().required(),
  guestEmail: Joi.string().email().required(),
  checkIn: dateOnly.required(),
  checkOut: dateOnly.required(),
  roomsCount: Joi.number().integer().min(1).max(50).required(),
  totalAmountNgn: Joi.number().positive().required(),
  propertyId: Joi.string().uuid().required(),
  guestCount: Joi.number().integer().min(1).required(),
  platformFeeNgn: Joi.number().min(0).required(),
  hostPayoutNgn: Joi.number().min(0).required(),
}).custom((value, helpers) => {
  if (value.checkOut <= value.checkIn) return helpers.error("any.invalid");
  return value;
}, "checkOut after checkIn");

/** release/confirm bodies. tenantId is optional hardening: when given it must match the booking. */
export const tenantBodySchema = Joi.object({
  tenantId: Joi.string().uuid().optional(),
});

export const bookingIdParamSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
});
