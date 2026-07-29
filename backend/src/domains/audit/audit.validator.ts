import Joi from "joi";

const AUDIT_ACTIONS = [
  "created", "updated", "deleted", "status_changed",
  "payment", "login", "logout", "exported",
] as const;

export const listTenantAuditLogsQuerySchema = Joi.object({
  page:      Joi.number().integer().min(1).default(1),
  limit:     Joi.number().integer().min(1).max(200).default(50),
  actions:   Joi.string().pattern(/^[a-z_]+(,[a-z_]+)*$/).custom((value: string, helpers) => {
    const parts = value.split(",");
    const invalid = parts.filter((p) => !AUDIT_ACTIONS.includes(p as typeof AUDIT_ACTIONS[number]));
    if (invalid.length) return helpers.error("any.invalid");
    return value;
  }).messages({
    "string.pattern.base": "actions must be a comma-separated list of lowercase action names.",
    "any.invalid": `actions must only contain: ${AUDIT_ACTIONS.join(", ")}.`,
  }).optional(),
  search:    Joi.string().trim().max(200).optional(),
  dateFrom:  Joi.date().iso().optional(),
  dateTo:    Joi.date().iso().min(Joi.ref("dateFrom")).optional().messages({
    "date.min": "dateTo must be on or after dateFrom.",
  }),
});

export const listMyAuditLogsQuerySchema = Joi.object({
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
});