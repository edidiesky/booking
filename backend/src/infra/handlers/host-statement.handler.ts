import { BaseNotificationHandler }       from "./base.handler";
import { generateHostStatementBuffer }   from "../../utils/generateHostStatementBuffer";
import { uploadToCloudinary }            from "../../utils/cloudinary";
import { invoiceRepository }             from "../../domains/invoice/invoice.repository";
import { bookingRepository }             from "../../domains/booking/booking.repository";
import { propertyRepository }            from "../../domains/property/property.repository";
import { tenantRepository }              from "../../domains/tenant/tenant.repository";
import { userRepository }                from "../../domains/auth/auth.repository";
import { ROUTING_KEYS }                  from "../../messaging/connection";
import type { HostStatementRequestedPayload } from "../../messaging/publisher";
import logger                            from "../../utils/logger";

export class HostStatementHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.HOST_STATEMENT_REQUESTED;

  protected idempotencyKey(data: unknown): string {
    const d = data as HostStatementRequestedPayload;
    return `host-statement:${d.bookingId}`;
  }

  protected async handle(data: unknown): Promise<void> {
    const e = data as HostStatementRequestedPayload;

    const [booking, property, roomType, tenant] = await Promise.all([
      bookingRepository.findById(e.bookingId),
      propertyRepository.findPropertyById(e.propertyId),
      propertyRepository.findRoomTypeById(e.roomTypeId, e.tenantId),
      tenantRepository.findById(e.tenantId),
    ]);

    if (!booking) {
      logger.warn("host_statement_booking_not_found", { event: "host_statement_booking_not_found", bookingId: e.bookingId });
      return;
    }

    const guest = await userRepository.findById(booking.guest_user_id);

    // Already-generated check, same idempotency belt-and-braces as
    // BaseNotificationHandler's own idempotency key, this one guards
    // against the sequence being consumed twice if this handler somehow
    // reprocesses (retry after a transient Cloudinary failure, say).
    const existing = await invoiceRepository.findByBookingAndType(e.bookingId, "host_statement");
    if (existing?.pdf_url) {
      logger.info("host_statement_already_exists", { event: "host_statement_already_exists", bookingId: e.bookingId });
      return;
    }

    const statementNumber = await invoiceRepository.reserveInvoiceNumber("host_statement");

    const buffer = await generateHostStatementBuffer({
      statementNumber,
      bookingId:      e.bookingId,
      bookingRef:     e.bookingRef,
      propertyName:   property?.name ?? "Property",
      roomTypeName:   roomType?.name ?? "Room",
      hostName:       tenant?.name ?? "Host",
      guestName:      [guest?.first_name, guest?.last_name].filter(Boolean).join(" ") || "Guest",
      checkIn:        e.checkIn,
      checkOut:       e.checkOut,
      nights:         booking.nights,
      totalAmountNgn: e.totalAmountNgn,
      platformFeeNgn: e.platformFeeNgn,
      hostPayoutNgn:  e.hostPayoutNgn,
      releasedAt:     new Date(e.releasedAt),
    });

    const publicId = `statement_${e.bookingId}_${Date.now()}`;
    const url = await uploadToCloudinary(buffer, publicId);

    await invoiceRepository.insert({
      invoiceNumber: statementNumber,
      type:          "host_statement",
      bookingId:     e.bookingId,
      tenantId:      e.tenantId,
      amountNgn:     e.hostPayoutNgn,
      pdfUrl:        url,
    });

    logger.info("host_statement_generated", { event: "host_statement_generated", bookingId: e.bookingId, statementNumber, url });
  }
}

export const hostStatementHandler = new HostStatementHandler();