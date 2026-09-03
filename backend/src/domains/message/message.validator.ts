import Joi from "joi";

export const sendMessageSchema = Joi.object({
  body: Joi.string().trim().min(1).max(4000).required(),
});