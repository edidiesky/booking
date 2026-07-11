import {  Router } from "express";
import Joi from "joi";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate }        from "../../middleware/validate.middleware";
import { GetPaymentByBookingHandler, GetTenantPaymentsHandler, InitializePaymentHandler } from "./payment.controller";

const initPaymentSchema = Joi.object({
  bookingId:   Joi.string().uuid().required(),
  gateway:     Joi.string().valid("paystack", "flutterwave").required(),
  callbackUrl: Joi.string().uri().required(),
  phone:       Joi.string().optional(),
});


const router = Router();

router.post("/initialize",           authenticate, validate(initPaymentSchema), InitializePaymentHandler);
router.get("/booking/:bookingId",    authenticate,                              GetPaymentByBookingHandler);
router.get("/tenant",                authenticate, requireTenantMember,         GetTenantPaymentsHandler);

export default router;
