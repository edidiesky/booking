import Joi from "joi";

const email = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: { allow: false } })
  .max(254)
  .required()
  .messages({
    "string.email": "Enter a valid email address.",
    "string.empty": "Email is required.",
    "any.required": "Email is required.",
  });

const password = Joi.string()
  .min(8)
  .max(24)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
  .required()
  .messages({
    "string.min": "Password must be at least 8 characters.",
    "string.max": "Password must be at most 24 characters.",
    "string.pattern.base":
      "Password must include at least one uppercase letter, one lowercase letter, and one number.",
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  });

const name = Joi.string()
  .trim()
  .min(2)
  .max(50)
  .pattern(/^[a-zA-Z][a-zA-Z\s'-]*$/)
  .required()
  .messages({
    "string.min": "Name must be at least 2 characters.",
    "string.max": "Name must be at most 50 characters.",
    "string.pattern.base":
      "Name may only contain letters, spaces, hyphens, and apostrophes.",
    "any.required": "This field is required.",
  });

const phone = Joi.string()
  .trim()
  .pattern(/^\+?[0-9]{7,15}$/)
  .optional()
  .allow(null, "")
  .messages({
    "string.pattern.base":
      "Phone must be 7–15 digits and may start with +.",
  });

const otpToken = Joi.string()
  .length(6)
  .pattern(/^\d{6}$/)
  .required()
  .messages({
    "string.length": "Code must be exactly 6 digits.",
    "string.pattern.base": "Code must be 6 digits.",
    "any.required": "Code is required.",
  });

export const initiateSchema = Joi.object({
  email,
  password,
}).required();

export const confirmEmailSchema = Joi.object({
  email,
  token: otpToken,
}).required();

export const registerGuestSchema = Joi.object({
  email,
  firstName: name.label("First name"),
  lastName: name.label("Last name"),
  phone,
}).required();

export const registerHostSchema = Joi.object({
  email,
  firstName: name.label("First name"),
  lastName: name.label("Last name"),
  phone,
  tenantName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      "string.min": "Business name must be at least 2 characters.",
      "string.max": "Business name must be at most 100 characters.",
      "any.required": "Business name is required.",
    }),
  tenantSlug: Joi.string()
    .trim()
    .lowercase()
    .min(3)
    .max(50)
    .pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .required()
    .messages({
      "string.min": "Slug must be at least 3 characters.",
      "string.max": "Slug must be at most 50 characters.",
      "string.pattern.base":
        "Slug may only contain lowercase letters, numbers, and single hyphens (no leading/trailing hyphen).",
      "any.required": "Slug is required.",
    }),
  platformFeePct: Joi.number().min(0).max(100).precision(2).optional(),
}).required();

export const loginSchema = Joi.object({
  email,
  password: Joi.string().min(1).max(72).required().messages({
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  }),
  // login should not enforce complexity — only presence
}).required();

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().trim().min(20).required().messages({
    "string.min": "Invalid refresh token.",
    "any.required": "Refresh token is required.",
  }),
}).required();

export const resendOtpSchema = Joi.object({
  email,
}).required();

export const verifyEnableTwoFactorSchema = Joi.object({
  token: otpToken,
}).required();

export const disableTwoFactorSchema = Joi.object({
  password: Joi.string().min(1).max(72).required().messages({
    "string.empty": "Password is required.",
    "any.required": "Password is required.",
  }),
}).required();

export const verifyTwoFactorLoginSchema = Joi.object({
  challengeToken: Joi.string().trim().min(16).max(128).required().messages({
    "string.min": "Invalid or expired challenge.",
    "any.required": "Challenge token is required.",
  }),
  code: Joi.string()
    .trim()
    .min(6)
    .max(16)
    .pattern(/^[A-Za-z0-9]+$/)
    .required()
    .messages({
      "string.min": "Code must be at least 6 characters.",
      "string.max": "Code is too long.",
      "string.pattern.base": "Code contains invalid characters.",
      "any.required": "Code is required.",
    }),
}).required();

export const oauthGoogleSchema = Joi.object({
  code: Joi.string().trim().min(10).required().messages({
    "any.required": "Authorization code is required.",
  }),
  codeVerifier: Joi.string()
    .trim()
    .min(43)
    .max(128)
    .pattern(/^[A-Za-z0-9\-._~]+$/)
    .required()
    .messages({
      "string.min": "Invalid code verifier.",
      "string.pattern.base": "Invalid code verifier format.",
      "any.required": "Code verifier is required.",
    }),
}).required();

export const verifyLoginEmailOtpSchema = Joi.object({
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .max(254)
    .required(),
  code: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.length": "Code must be exactly 6 digits.",
      "string.pattern.base": "Code must be 6 digits.",
      "any.required": "Code is required.",
    }),
}).required();