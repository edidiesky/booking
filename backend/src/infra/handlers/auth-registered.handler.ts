import { BaseNotificationHandler }    from "./base.handler";
import { getDispatcher }              from "../providers/notification.dispatcher";
import { notificationRepository }     from "../../domains/notification/notification.repository";
import { authRegisteredTemplate }     from "../../templates/auth-registered.template";
import { ROUTING_KEYS }               from "../../messaging/connection";
import { NotifyAuthRegisteredPayload } from "../../messaging/publisher";

export class AuthRegisteredHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_AUTH_REGISTERED;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyAuthRegisteredPayload;

    const loginUrl   = `${process.env.WEB_ORIGIN}/login`;
    const supportUrl = `${process.env.WEB_ORIGIN}/support`;

    const { subject, html } = authRegisteredTemplate({
      firstName:   e.firstName,
      lastName:    e.lastName,
      userType:    e.userType,
      tenantName:  e.tenantName,
      loginUrl,
      supportUrl,
    });

    const notification = await notificationRepository.create({
      type:           "auth_registered",
      channel:        "email",
      recipientEmail: e.email,
      subject,
      message:        `Welcome email sent to ${e.email}`,
      metadata:       { userType: e.userType, tenantSlug: e.tenantSlug },
    });

    await getDispatcher().sendEmail(e.email, subject, html);
    await notificationRepository.markSent(notification.id);
  }
}

export const authRegisteredHandler = new AuthRegisteredHandler();