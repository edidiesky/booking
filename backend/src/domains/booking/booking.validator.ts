import Joi from "joi";
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

export const listQuerySchema = Joi.object({
  status: Joi.string().valid("pending_payment","confirmed","checked_in","checked_out","cancelled","refunded").optional(),
  page:   Joi.number().integer().min(1).default(1),
  limit:  Joi.number().integer().min(1).max(100).default(20),
});
