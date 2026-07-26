import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { invoiceService } from "./invoice.service";
import { invoiceRepository } from "./invoice.repository";
import { AppError } from "../../utils/AppError";

export const GetGuestInvoiceHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { bookingId } = req.params as { bookingId: string };
  const invoice = await invoiceService.getOrCreateGuestInvoice(bookingId, req.user.userId);
  res.status(200).json({ success: true, data: invoice });
});

export const GetHostStatementHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  if (!req.tenantId) throw AppError.badRequest("Tenant context required.");
  const { bookingId } = req.params as { bookingId: string };
  const statement = await invoiceRepository.findByBookingAndType(bookingId, "host_statement");
  if (!statement) throw AppError.notFound("Payout statement, it's generated automatically once this booking is checked out.");
  if (statement.tenant_id !== req.tenantId) {
    throw AppError.forbidden("This statement does not belong to your tenant.");
  }
  res.status(200).json({ success: true, data: statement });
});