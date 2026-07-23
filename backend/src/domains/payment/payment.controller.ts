import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { paymentService }  from "./payment.service";
import { paymentRepository } from "./payment.repository";
import { AppError }        from "../../utils/AppError";
import { PaymentGateway }  from "../../types";
import { userRepository } from "../auth/auth.repository";

export const InitializePaymentHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();

    const body = req.body as { bookingId: string; gateway: PaymentGateway; callbackUrl: string; phone?: string };
    const guest = await userRepository.findById(req.user.userId);
    if (!guest?.email) {
      throw AppError.badRequest("Your account has no email on file. Please update your profile before paying.");
    }

    const result = await paymentService.initializePayment({
      bookingId:   body.bookingId,
      guestUserId: req.user.userId,
      email:       guest.email,
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

export const GetTenantPaymentStatsHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
    const stats = await paymentRepository.getStatsForTenant(req.tenantId);
    res.status(200).json({ success: true, data: stats });
  }
);