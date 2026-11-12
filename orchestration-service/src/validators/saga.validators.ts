import Joi from "joi";

/**
 * Accepts YYYY-MM-DD or a full ISO timestamp and ALWAYS yields a plain
 * YYYY-MM-DD string. (Joi.date() would turn it into a Date object, which then
 * serialises to a timestamp and breaks downstream date arithmetic.)
 */
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

export const startBookingPaymentSagaSchema = Joi.object({
  tenantId: Joi.string().uuid().required(),
  propertyId: Joi.string().uuid().required(),
  roomTypeId: Joi.string().uuid().required(),
  guestUserId: Joi.string().uuid().required(),
  guestEmail: Joi.string().email().required(),
  checkIn: dateOnly.required(),
  checkOut: dateOnly.required(),
  roomsCount: Joi.number().integer().min(1).max(50).required(),
  guestCount: Joi.number().integer().min(1).required(),
  totalAmountNgn: Joi.number().positive().required(),
  platformFeeNgn: Joi.number().min(0).required(),
  hostPayoutNgn: Joi.number().min(0).required(),
  gateway: Joi.string().valid("paystack", "flutterwave").required(),
  callbackUrl: Joi.string().uri().required(),
  phone: Joi.string().optional(),
  /** Existing pending_payment booking to adopt (created by the monolith). */
  bookingId: Joi.string().uuid().optional(),
}).custom((value, helpers) => {
  if (value.checkOut <= value.checkIn) return helpers.error("any.invalid");
  if (value.platformFeeNgn > value.totalAmountNgn) return helpers.error("any.invalid");
  return value;
}, "dates and fee sanity");

export const bookingIdParamSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
});

export const sagaIdParamSchema = Joi.object({
  sagaId: Joi.string().uuid().required(),
});
