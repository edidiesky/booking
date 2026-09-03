import Joi from "joi";

export const startConversationSchema = Joi.object({
  guestUserId: Joi.string().uuid().required(),
  propertyId:  Joi.string().uuid().optional(),
  bookingId:   Joi.string().uuid().optional(),
});

export const listQuerySchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});