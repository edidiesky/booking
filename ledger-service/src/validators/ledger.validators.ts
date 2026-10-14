import Joi from "joi";

export const releaseEscrowSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
  tenantId: Joi.string().uuid().required(),
  totalAmountNgn: Joi.number().positive().required(),
  platformFeeNgn: Joi.number().min(0).required(),
}).custom((value, helpers) => {
  if (value.platformFeeNgn > value.totalAmountNgn) {
    return helpers.error("any.invalid");
  }
  return value;
}, "platform fee not exceeding total");
