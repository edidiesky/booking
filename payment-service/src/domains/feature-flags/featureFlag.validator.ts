import Joi from "joi";

export const flagKeyParamSchema = Joi.object({
  key: Joi.string().required(),
});

export const patchFlagSchema = Joi.object({
  enabled: Joi.boolean().required(),
});
