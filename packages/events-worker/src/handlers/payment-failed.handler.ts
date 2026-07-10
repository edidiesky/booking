import { BaseNotificationHandler }  from "./base.handler";
import { getDispatcher }            from "../providers/notification.dispatcher";
import { notificationRepository }   from "../../domains/notification/notification.repository";
import { paymentFailedTemplate }    from "../../templates/payment-failed.template";
import { ROUTING_KEYS }             from "../../messaging/connection";
import { NotifyPaymentPayload }     from "../../messaging/publisher";

export class PaymentFailedHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_PAYMENT_FAILED;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyPaymentPayload;

    const retryUrl   = `${process.env.WEB_ORIGIN}/bookings/${e.bookingId}/pay`;
    const supportUrl = `${process.env.WEB_ORIGIN}/support`;

    const { subject, html } = paymentFailedTemplate({
      guestName:     e.guestName,
      bookingRef:    e.bookingRef,
      amountNgn:     e.amountNgn,
      failureReason: e.failureReason,
      retryUrl,
      supportUrl,
    });

    const notification = await notificationRepository.create({
      type:           "payment_failed",
      channel:        "email",
      recipientEmail: e.guestEmail,
      tenantId:       e.tenantId,
      subject,
      message:        `Payment failed email sent to ${e.guestEmail}`,
      metadata:       { bookingId: e.bookingId, amountNgn: e.amountNgn },
    });

    await getDispatcher().sendEmail(e.guestEmail, subject, html);
    await notificationRepository.markSent(notification.id);
  }
}

export const paymentFailedHandler = new PaymentFailedHandler();