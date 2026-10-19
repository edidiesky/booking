import Joi from "joi";

export const initiatePaymentSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
  guestUserId: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  gateway: Joi.string().valid("paystack", "flutterwave").required(),
  callbackUrl: Joi.string().uri().required(),
  phone: Joi.string().optional(),
  tenantId: Joi.string().uuid().required(),
});

export const webhookSchema = Joi.object({
  transactionId: Joi.string().required(),
  amount: Joi.number().positive().required(),
  gateway: Joi.string().valid("paystack", "flutterwave").required(),
  rawPayload: Joi.object().unknown(true).required(),
}).unknown(true);

export const bookingIdParamSchema = Joi.object({
  bookingId: Joi.string().uuid().required(),
});

export const gatewayParamSchema = Joi.object({
  gateway: Joi.string().valid("paystack", "flutterwave").required(),
});
