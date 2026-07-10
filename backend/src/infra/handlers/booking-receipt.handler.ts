import { BaseNotificationHandler }        from "./base.handler";
import { generateBookingReceiptBuffer }   from "../../utils/generateBookingReceipt";
import { uploadToCloudinary }             from "../../utils/cloudinary";
import { bookingRepository }              from "../../domains/booking/booking.repository";
import { propertyRepository }             from "../../domains/property/property.repository";
import { userRepository }                 from "../../domains/auth/auth.repository";
import { ROUTING_KEYS }                   from "../../messaging/connection";
import { BookingReceiptRequestedPayload } from "../../messaging/publisher";
import logger                             from "../../utils/logger";
import { paymentRepository } from "../../domains/payment/payment.repository";

export class BookingReceiptHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.BOOKING_RECEIPT_REQUESTED;

  protected idempotencyKey(data: unknown): string {
    const d = data as BookingReceiptRequestedPayload;
    return `receipt:${d.bookingId}`;
  }


  protected async handle(data: unknown): Promise<void> {
    const e = data as BookingReceiptRequestedPayload;

    const [booking, property, roomType, guest, payment] = await Promise.all([
      bookingRepository.findById(e.bookingId),
      propertyRepository.findPropertyById(e.propertyId),
      propertyRepository.findRoomTypeById(e.roomTypeId),
      userRepository.findById(e.guestUserId),
      paymentRepository.findByTransactionId(e.transactionId)
    ]);

    if (!booking) {
      logger.warn("booking_receipt_booking_not_found", { event: "booking_receipt_booking_not_found", bookingId: e.bookingId });
      return;
    }

    const buffer = await generateBookingReceiptBuffer({
      bookingId:      e.bookingId,
      bookingRef:     e.bookingRef,
      propertyName:   property?.name  ?? "Property",
      roomTypeName:   roomType?.name  ?? "Room",
      guestName:      [guest?.first_name, guest?.last_name].filter(Boolean).join(" ") || "Guest",
      checkIn:        booking.check_in,
      checkOut:       booking.check_out,
      nights:         booking.nights,
      totalAmountNgn: e.totalAmountNgn,
      platformFeeNgn: e.platformFeeNgn,
      transactionId:  e.transactionId,
      gateway:        payment?.gateway as string,
      paidAt:         new Date(e.paidAt),
    });

    const publicId = `receipt_${e.bookingId}_${Date.now()}`;
    const url = await uploadToCloudinary(buffer, publicId);

    await bookingRepository.updateReceiptUrl(e.bookingId, url);

    logger.info("booking_receipt_generated", { event: "booking_receipt_generated", bookingId: e.bookingId, url });
  }
}

export const bookingReceiptHandler = new BookingReceiptHandler();