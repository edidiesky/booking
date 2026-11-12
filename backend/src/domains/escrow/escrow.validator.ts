import Joi from "joi";
import { paginationKeys } from "../../utils/pagination";

export const tenantEscrowQuerySchema = Joi.object({
  ...paginationKeys(200, 20),
});