import { BaseNotificationHandler } from "./base.handler";
import { getDispatcher }           from "../providers/notification.dispatcher";
import { notificationRepository }  from "../../domains/notification/notification.repository";
import { authOtpTemplate }         from "../../templates/auth-otp.template";
import { ROUTING_KEYS }            from "../../messaging/connection";
import { NotifyAuthOtpPayload }    from "../../messaging/publisher";

export class AuthOtpHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_AUTH_OTP;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyAuthOtpPayload;
    const { subject, html } = authOtpTemplate({ firstName: e.firstName, otp: e.otp });

    const notification = await notificationRepository.create({
      type:           "auth_otp",
      channel:        e.phone ? "email_and_sms" : "email",
      recipientEmail: e.email,
      recipientPhone: e.phone,
      subject,
      message:        `OTP email sent to ${e.email}`,
      metadata:       { notificationId: e.notificationId },
    });

    await getDispatcher().sendEmail(e.email, subject, html);

    if (e.phone) {
      await getDispatcher().sendSms(e.phone, `Your Booking Platform code: ${e.otp}. Expires in 15 minutes. Do not share.`);
    }

    await notificationRepository.markSent(notification.id);
  }
}

export const authOtpHandler = new AuthOtpHandler();