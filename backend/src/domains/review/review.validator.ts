import Joi from "joi";

export const createReviewSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
  rating:    Joi.number().integer().min(1).max(5).required(),
  title:     Joi.string().min(10).max(150).required(),
  comment:   Joi.string().min(20).max(2000).required(),
  images:    Joi.array().items(Joi.string().uri()).max(6).optional(),
});

export const respondSchema = Joi.object({ text: Joi.string().min(1).max(1000).required() });
export const helpfulSchema = Joi.object({ helpful: Joi.boolean().required() });