import { BaseNotificationHandler } from "./base.handler";
import { getDispatcher } from "../providers/notification.dispatcher";
import { notificationRepository } from "../../domains/notification/notification.repository";
import { ROUTING_KEYS } from "../../messaging/connection";
import { NotifyAuthPasswordRequestResetPayload } from "../../messaging/publisher";
import { authPasswordRequestResetTemplate } from "../../templates/password-request-reset.template";

export class AuthPasswordRequestReset extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_AUTH_OTP;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyAuthPasswordRequestResetPayload;
    const { subject, html } = authPasswordRequestResetTemplate({
      email: e.email,
      notificationId: e.notificationId,
      resetUrl: e.resetUrl,
      firstName: e.firstName,
    });

    const notification = await notificationRepository.create({
      type: "auth_otp",
      channel: "email",
      recipientEmail: e.email,
      subject,
      message: `Password Request Reset email sent to ${e.email}`,
      metadata: { notificationId: e.notificationId },
    });

    await getDispatcher().sendEmail(e.email, subject, html);

    await notificationRepository.markSent(notification.id);
  }
}

export const authPasswordRequestReset = new AuthPasswordRequestReset();
