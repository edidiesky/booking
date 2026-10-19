import Joi from "joi";

export const reserveBookingSchema = Joi.object({
  tenantId: Joi.string().uuid().required(),
  roomTypeId: Joi.string().uuid().required(),
  guestUserId: Joi.string().uuid().required(),
  guestEmail: Joi.string().email().required(),
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().greater(Joi.ref("checkIn")).required(),
  roomsCount: Joi.number().integer().min(1).max(50).required(),
  totalAmountNgn: Joi.number().positive().required(),
});

export const bookingIdParamSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
});
