import Joi from "joi";
import { paginationKeys } from "../../utils/pagination";

export const tenantPaymentsQuerySchema = Joi.object({
  ...paginationKeys(200, 20),
  status: Joi.string().valid("pending", "success", "failed", "refunded").optional(),
  gateway: Joi.string().valid("paystack", "flutterwave").optional(),
});