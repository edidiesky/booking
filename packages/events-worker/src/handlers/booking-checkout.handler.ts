import { BaseNotificationHandler }  from "./base.handler";
import { getDispatcher }            from "../providers/notification.dispatcher";
import { notificationRepository }   from "../../domains/notification/notification.repository";
import { bookingCheckoutTemplate }  from "../../templates/booking-checkout.template";
import { ROUTING_KEYS }             from "../../messaging/connection";
import { NotifyBookingPayload }     from "../../messaging/publisher";

export class BookingCheckoutHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_BOOKING_CHECKED_OUT;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyBookingPayload;
    const supportUrl = `${process.env.WEB_ORIGIN}/support`;

    const { subject, html } = bookingCheckoutTemplate({
      guestName:    e.guestName,
      bookingRef:   e.bookingRef,
      propertyName: e.propertyName,
      checkIn:      e.checkIn,
      checkOut:     e.checkOut,
      supportUrl,
    });

    const notification = await notificationRepository.create({
      type:           "booking_checked_out",
      channel:        "email",
      recipientEmail: e.guestEmail,
      tenantId:       e.tenantId,
      subject,
      message:        `Check-out email sent to ${e.guestEmail}`,
      metadata:       { bookingId: e.bookingId },
    });

    await getDispatcher().sendEmail(e.guestEmail, subject, html);
    await notificationRepository.markSent(notification.id);
  }
}

export const bookingCheckoutHandler = new BookingCheckoutHandler();