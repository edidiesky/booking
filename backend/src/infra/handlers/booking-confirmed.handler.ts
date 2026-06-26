import { BaseNotificationHandler }   from "./base.handler";
import { getDispatcher }             from "../providers/notification.dispatcher";
import { notificationRepository }    from "../../domains/notification/notification.repository";
import { bookingConfirmedTemplate }  from "../../templates/booking-confirmed.template";
import { ROUTING_KEYS }              from "../../messaging/connection";
import { NotifyBookingPayload }      from "../../messaging/publisher";

export class BookingConfirmedHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_BOOKING_CONFIRMED;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyBookingPayload;

    const manageUrl  = `${process.env.WEB_ORIGIN}/bookings/${e.bookingId}`;
    const supportUrl = `${process.env.WEB_ORIGIN}/support`;

    const { subject, html } = bookingConfirmedTemplate({
      guestName:      e.guestName,
      bookingRef:     e.bookingRef,
      propertyName:   e.propertyName,
      roomTypeName:   e.roomTypeName,
      checkIn:        e.checkIn,
      checkOut:       e.checkOut,
      nights:         e.nights,
      totalAmountNgn: e.totalAmountNgn,
      manageUrl,
      supportUrl,
    });

    const notification = await notificationRepository.create({
      type:           "booking_confirmed",
      channel:        "email",
      recipientEmail: e.guestEmail,
      recipientPhone: e.guestPhone,
      tenantId:       e.tenantId,
      subject,
      message:        `Booking confirmed email sent to ${e.guestEmail}`,
      metadata:       { bookingId: e.bookingId, bookingRef: e.bookingRef },
    });

    await getDispatcher().sendEmail(e.guestEmail, subject, html);
    await notificationRepository.markSent(notification.id);
  }
}

export const bookingConfirmedHandler = new BookingConfirmedHandler();