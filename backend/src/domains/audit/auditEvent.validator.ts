import Joi from "joi";

export const listQuerySchema = Joi.object({
  page:          Joi.number().integer().min(1).default(1),
  limit:         Joi.number().integer().min(1).max(100).default(20),
  actor:         Joi.string().optional(),
  actorType:     Joi.string().valid("user", "api_key", "system", "impersonation").optional(),
  action:        Joi.string().optional(),
  outcome:       Joi.string().valid("allowed", "denied").optional(),
  affectedUser:  Joi.string().optional(),
  targetType:    Joi.string().optional(),
  targetId:      Joi.string().optional(),
  changedField:  Joi.string().optional(),
  requestId:     Joi.string().optional(),
  occurredAfter:  Joi.date().iso().optional(),
  occurredBefore: Joi.date().iso().optional(),
});
