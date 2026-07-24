import { BaseNotificationHandler }   from "./base.handler";
import { getDispatcher }             from "../providers/notification.dispatcher";
import { notificationRepository }    from "../../domains/notification/notification.repository";
import { paymentConfirmedTemplate }  from "../../templates/payment-confirmed.template";
import { ROUTING_KEYS }              from "../../messaging/connection";
import { NotifyPaymentPayload }      from "../../messaging/publisher";
import { bookingRepository } from "../../domains/booking/booking.repository";

export class PaymentConfirmedHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_PAYMENT_CONFIRMED;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyPaymentPayload;
     const booking = await bookingRepository.findById(e.bookingId);
    const roomTypeName = e.roomTypeName ?? booking?.room_type_name ?? "your room";
    const receiptUrl = booking?.receipt_url ?? undefined;

    const { subject, html } = paymentConfirmedTemplate({
       guestName:     e.guestName,
      bookingRef:    e.bookingRef,
      roomTypeName: roomTypeName,
      amountNgn:     e.amountNgn,
      gateway:       e.gateway,
      transactionId: e.transactionId,
      manageUrl:     `${process.env.WEB_ORIGIN}/bookings/${e.bookingId}`,
      supportUrl:    `${process.env.WEB_ORIGIN}/support`,
      receiptUrl,
    });

    const notification = await notificationRepository.create({
      type:           "payment_confirmed",
      channel:        "email",
      recipientEmail: e.guestEmail,
      tenantId:       e.tenantId,
      subject,
      message:        `Payment confirmed email sent to ${e.guestEmail}`,
      metadata:       { bookingId: e.bookingId, transactionId: e.transactionId, amountNgn: e.amountNgn },
    });

    await getDispatcher().sendEmail(e.guestEmail, subject, html);
    await notificationRepository.markSent(notification.id);
  }
}

export const paymentConfirmedHandler = new PaymentConfirmedHandler();