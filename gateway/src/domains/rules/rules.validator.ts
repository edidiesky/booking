import Joi from "joi";

export const createRuleSchema = Joi.object({
  idType:     Joi.string().valid("ip", "user_id", "api_key").required(),
  idValue:    Joi.string().required(),
  resource:   Joi.string().required(),
  algorithm:  Joi.string().valid("token-bucket", "sliding-window-log").required(),
  maxRequest: Joi.number().integer().min(1).required(),
  intervalMs: Joi.number().integer().min(1).required(),
  enabled:    Joi.boolean().optional(),
});

export const updateRuleSchema = Joi.object({
  algorithm:  Joi.string().valid("token-bucket", "sliding-window-log").optional(),
  maxRequest: Joi.number().integer().min(1).optional(),
  intervalMs: Joi.number().integer().min(1).optional(),
  enabled:    Joi.boolean().optional(),
});

export const listQuerySchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});