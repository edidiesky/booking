import Joi from "joi";

export const createRenterSchema = Joi.object({
  fullName:              Joi.string().min(1).max(200).required(),
  email:                 Joi.string().email().optional().allow(""),
  phone:                 Joi.string().max(30).optional().allow(""),
  emergencyContactName:  Joi.string().max(200).optional().allow(""),
  emergencyContactPhone: Joi.string().max(30).optional().allow(""),
});