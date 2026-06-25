import asyncHandler from "express-async-handler";
import { Request, Response, Router } from "express";
import Joi from "joi";
import { paymentService }  from "./payment.service";
import { paymentRepository } from "./payment.repository";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate }        from "../../middleware/validate.middleware";
import { AppError }        from "../../utils/AppError";
import { PaymentGateway }  from "../../types";

const initPaymentSchema = Joi.object({
  bookingId:   Joi.string().uuid().required(),
  gateway:     Joi.string().valid("paystack", "flutterwave").required(),
  callbackUrl: Joi.string().uri().required(),
  phone:       Joi.string().optional(),
});

export const InitializePaymentHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();

    const body = req.body as { bookingId: string; gateway: PaymentGateway; callbackUrl: string; phone?: string };

    const result = await paymentService.initializePayment({
      bookingId:   body.bookingId,
      guestUserId: req.user.userId,
      email:       req.user.email ?? "",
      gateway:     body.gateway,
      callbackUrl: body.callbackUrl,
      phone:       body.phone,
    });

    res.status(200).json({ success: true, message: "Payment initialized.", data: result });
  }
);

export const GetPaymentByBookingHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const payment = await paymentRepository.findByBookingId(req.params["bookingId"] as string);
    if (!payment) throw AppError.notFound("No payment found for this booking.");
    res.status(200).json({ success: true, data: payment });
  }
);

export const GetTenantPaymentsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const page  = Number(req.query["page"]  ?? 1);
    const limit = Number(req.query["limit"] ?? 20);
    const payments = await paymentRepository.listByTenant(req.tenantId, page, limit);
    res.status(200).json({ success: true, data: payments });
  }
);

const router = Router();

router.post("/initialize",           authenticate, validate(initPaymentSchema), InitializePaymentHandler);
router.get("/booking/:bookingId",    authenticate,                              GetPaymentByBookingHandler);
router.get("/tenant",                authenticate, requireTenantMember,         GetTenantPaymentsHandler);

export default router;
