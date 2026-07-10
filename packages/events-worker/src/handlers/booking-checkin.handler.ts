import { BaseNotificationHandler }  from "./base.handler";
import { getDispatcher }            from "../providers/notification.dispatcher";
import { notificationRepository }   from "../../domains/notification/notification.repository";
import { bookingCheckinTemplate }   from "../../templates/booking-checkin.template";
import { ROUTING_KEYS }             from "../../messaging/connection";
import { NotifyBookingPayload }     from "../../messaging/publisher";

export class BookingCheckinHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_IN;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyBookingPayload;
    const supportUrl = `${process.env.WEB_ORIGIN}/support`;

    const { subject, html } = bookingCheckinTemplate({
      guestName:    e.guestName,
      bookingRef:   e.bookingRef,
      propertyName: e.propertyName,
      checkIn:      e.checkIn,
      checkOut:     e.checkOut,
      supportUrl,
    });

    const notification = await notificationRepository.create({
      type:           "booking_checked_in",
      channel:        "email",
      recipientEmail: e.guestEmail,
      tenantId:       e.tenantId,
      subject,
      message:        `Check-in email sent to ${e.guestEmail}`,
      metadata:       { bookingId: e.bookingId },
    });

    await getDispatcher().sendEmail(e.guestEmail, subject, html);
    await notificationRepository.markSent(notification.id);
  }
}

export const bookingCheckinHandler = new BookingCheckinHandler();