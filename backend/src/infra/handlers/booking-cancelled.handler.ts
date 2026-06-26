import { BaseNotificationHandler }   from "./base.handler";
import { getDispatcher }             from "../providers/notification.dispatcher";
import { notificationRepository }    from "../../domains/notification/notification.repository";
import { bookingCancelledTemplate }  from "../../templates/booking-cancelled.template";
import { ROUTING_KEYS }              from "../../messaging/connection";
import { NotifyBookingPayload }      from "../../messaging/publisher";

export class BookingCancelledHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_BOOKING_CANCELLED;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyBookingPayload;
    const supportUrl = `${process.env.WEB_ORIGIN}/support`;

    const { subject, html } = bookingCancelledTemplate({
      guestName:    e.guestName,
      bookingRef:   e.bookingRef,
      propertyName: e.propertyName,
      checkIn:      e.checkIn,
      checkOut:     e.checkOut,
      reason:       e.reason,
      supportUrl,
    });

    const notification = await notificationRepository.create({
      type:           "booking_cancelled",
      channel:        "email",
      recipientEmail: e.guestEmail,
      tenantId:       e.tenantId,
      subject,
      message:        `Booking cancelled email sent to ${e.guestEmail}`,
      metadata:       { bookingId: e.bookingId, bookingRef: e.bookingRef },
    });

    await getDispatcher().sendEmail(e.guestEmail, subject, html);
    await notificationRepository.markSent(notification.id);
  }
}

export const bookingCancelledHandler = new BookingCancelledHandler();