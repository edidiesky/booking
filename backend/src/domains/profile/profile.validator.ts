import Joi from "joi";

export const updateProfileSchema = Joi.object({
  displayName: Joi.string().min(2).max(100).optional(),
  bio:         Joi.string().max(500).allow("").optional(),
  avatarUrl:   Joi.string().uri().allow("").optional(),
  jobTitle:    Joi.string().max(120).allow("").optional(),
  phone:       Joi.string().max(30).allow("").optional(),
  taxId:       Joi.string().max(64).allow("").optional(),
  address: Joi.object({
    street:  Joi.string().allow("").optional(),
    city:    Joi.string().allow("").optional(),
    state:   Joi.string().allow("").optional(),
    country: Joi.string().allow("").optional(),
  }).optional(),
  preferences: Joi.object().unknown(true).optional(),
});