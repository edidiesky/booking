import { invoiceRepository, type Invoice } from "./invoice.repository";
import { bookingRepository } from "../booking/booking.repository";
import { propertyRepository } from "../property/property.repository";
import { userRepository } from "../auth/auth.repository";
import { paymentRepository } from "../payment/payment.repository";
import { generateGuestInvoiceBuffer } from "../../utils/generateGuestInvoiceBuffer";
import { uploadToCloudinary } from "../../utils/cloudinary";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";

export const invoiceService = {
  // On-demand: a guest clicks "download invoice". Checked-first against
  // an existing row so re-clicking doesn't burn a new sequence number or
  // re-render a PDF that already exists.
  async getOrCreateGuestInvoice(bookingId: string, guestUserId: string): Promise<Invoice> {
    const booking = await bookingRepository.findById(bookingId);
    if (!booking) throw AppError.notFound("Booking.");
    if (booking.guest_user_id !== guestUserId) throw AppError.forbidden("This booking does not belong to you.");
    if (!["confirmed", "checked_in", "checked_out"].includes(booking.status)) {
      throw AppError.badRequest("An invoice is only available once payment has been confirmed.");
    }

    const existing = await invoiceRepository.findByBookingAndType(bookingId, "guest_invoice");
    if (existing?.pdf_url) return existing;

    const [property, roomType, guest, payment] = await Promise.all([
      propertyRepository.findPropertyById(booking.property_id),
      propertyRepository.findRoomTypeById(booking.room_type_id, booking.tenant_id),
      userRepository.findById(guestUserId),
      paymentRepository.findByBookingId(bookingId),
    ]);

    if (!payment) throw AppError.badRequest("No completed payment found for this booking yet.");

    const invoiceNumber = await invoiceRepository.reserveInvoiceNumber("guest_invoice");

    const buffer = await generateGuestInvoiceBuffer({
      invoiceNumber,
      bookingId,
      bookingRef: booking.booking_ref,
      propertyName: property?.name ?? "Property",
      roomTypeName: roomType?.name ?? "Room",
      guestName: [guest?.first_name, guest?.last_name].filter(Boolean).join(" ") || "Guest",
      guestEmail: guest?.email ?? "",
      checkIn: booking.check_in,
      checkOut: booking.check_out,
      nights: booking.nights,
      totalAmountNgn: Number(booking.total_amount_ngn),
      platformFeeNgn: Number(booking.platform_fee_ngn),
      transactionId: payment.transaction_id ?? "",
      gateway: payment.gateway,
      paidAt: payment.paid_at ?? new Date(),
    });

    const url = await uploadToCloudinary(buffer, `invoice_${bookingId}_${Date.now()}`);

    const invoice = await invoiceRepository.insert({
      invoiceNumber,
      type: "guest_invoice",
      bookingId,
      tenantId: booking.tenant_id,
      guestUserId,
      amountNgn: Number(booking.total_amount_ngn),
      pdfUrl: url,
    });

    logger.info("guest_invoice_ready", { event: "guest_invoice_ready", bookingId, invoiceNumber });
    return invoice;
  },
};