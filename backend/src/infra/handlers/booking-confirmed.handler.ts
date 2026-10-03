import { BaseNotificationHandler } from "./base.handler";
import { getDispatcher } from "../providers/notification.dispatcher";
import { notificationRepository } from "../../domains/notification/notification.repository";
import { bookingConfirmedTemplate } from "../../templates/booking-confirmed.template";
import { notifySellerOnBookingConfirmed } from "../../domains/seller-notification/seller-notify-on-booking-confirmed";
import { ROUTING_KEYS } from "../../messaging/connection";
import { NotifyBookingPayload } from "../../messaging/publisher";
import logger from "../../utils/logger";

export class BookingConfirmedHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_BOOKING_CONFIRMED;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyBookingPayload;

    const receiptUrl = `${process.env.WEB_ORIGIN}/bookings/${e.bookingId}/receipt`;

    const { subject, html } = bookingConfirmedTemplate({
      guestName: e.guestName,
      bookingRef: e.bookingRef,
      propertyName: e.propertyName,
      roomTypeName: e.roomTypeName,
      checkIn: e.checkIn,
      checkOut: e.checkOut,
      nights: e.nights,
      totalAmountNgn: e.totalAmountNgn,
      manageUrl: `${process.env.WEB_ORIGIN}/bookings/${e.bookingId}`,
      supportUrl: `${process.env.WEB_ORIGIN}/support`,
      receiptUrl,
    });

    const notification = await notificationRepository.create({
      type: "booking_confirmed",
      channel: "email",
      recipientEmail: e.guestEmail,
      recipientPhone: e.guestPhone,
      tenantId: e.tenantId,
      subject,
      message: `Booking confirmed email sent to ${e.guestEmail}`,
      metadata: {
        bookingId: e.bookingId,
        bookingRef: e.bookingRef,
        role: "guest",
      },
    });

    await getDispatcher().sendEmail(e.guestEmail, subject, html);
    await notificationRepository.markSent(notification.id);

    // Seller inbox + owner email (same event, after guest path succeeds)
    try {
      await notifySellerOnBookingConfirmed({
        bookingId: e.bookingId,
        bookingRef: e.bookingRef,
        tenantId: e.tenantId,
        propertyName: e.propertyName,
        roomTypeName: e.roomTypeName,
        guestName: e.guestName,
        checkIn: e.checkIn,
        checkOut: e.checkOut,
        nights: e.nights,
        totalAmountNgn: e.totalAmountNgn,
      });
    } catch (err) {
      logger.error("seller_notification_failed", {
        event: "seller_notification_failed",
        bookingId: e.bookingId,
        tenantId: e.tenantId,
        error: (err as Error).message,
      });
      // Do not rethrow: guest email already sent; avoid infinite retries on seller-only failures.
      // Rethrow if you want the whole message retried.
    }
  }
}

export const bookingConfirmedHandler = new BookingConfirmedHandler();