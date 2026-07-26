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

export const ExportTenantPaymentsHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const tenantId = req.tenantId;

  const { nanoid } = await import("nanoid");
  const { enqueueExportJob, runExportJob } = await import("../../utils/runExportJob");

  const jobId = nanoid(21);
  await enqueueExportJob(jobId);
  res.status(202).json({ success: true, data: { jobId } });

  const { auditRepository } = await import("../audit/audit.repository");
  await auditRepository.log({ action: "exported", resource: "payments_pdf", tenantId, userId: req.user?.userId, req });

  void runExportJob(jobId, async () => {
    const payments = await paymentRepository.listByTenant(tenantId, 1, 1000);
    const total = payments
      .filter((p) => p.status === "success")
      .reduce((sum, p) => sum + Number(p.amount_ngn), 0);

    return {
      title: "Payments Export",
      subtitle: "All payments for your properties",
      generatedAt: new Date(),
      columns: [
        { key: "ref", label: "Booking Ref" },
        { key: "guest", label: "Guest" },
        { key: "gateway", label: "Gateway" },
        { key: "status", label: "Status" },
        { key: "paidAt", label: "Paid" },
        { key: "amount", label: "Amount (₦)", align: "right" as const },
      ],
      rows: payments.map((p) => ({
        ref: p.booking_ref,
        guest: [p.guest_first_name, p.guest_last_name].filter(Boolean).join(" "),
        gateway: p.gateway,
        status: p.status,
        paidAt: p.paid_at ? new Date(p.paid_at).toLocaleDateString("en-NG") : "—",
        amount: Number(p.amount_ngn).toLocaleString("en-NG"),
      })),
      totalsRow: { ref: "", guest: "", gateway: "", status: "", paidAt: "Total (successful)", amount: total.toLocaleString("en-NG") },
    };
  }, `payments_export_${tenantId}`);
});