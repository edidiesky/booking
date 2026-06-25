import Joi from "joi";

export const initiateSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

export const confirmEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  token: Joi.string().length(6).pattern(/^\d+$/).required(),
});

export const registerGuestSchema = Joi.object({
  email:     Joi.string().email().required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName:  Joi.string().min(2).max(50).required(),
  phone:     Joi.string().optional(),
});

export const registerHostSchema = Joi.object({
  email:          Joi.string().email().required(),
  firstName:      Joi.string().min(2).max(50).required(),
  lastName:       Joi.string().min(2).max(50).required(),
  phone:          Joi.string().optional(),
  tenantName:     Joi.string().min(2).max(100).required(),
  tenantSlug:     Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).min(3).max(50).required()
                    .messages({ "string.pattern.base": "Slug may only contain lowercase letters, numbers, and hyphens." }),
  platformFeePct: Joi.number().min(0).max(100).optional(),
});

export const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const resendOtpSchema = Joi.object({
  email: Joi.string().email().required(),
});
