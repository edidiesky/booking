import { BaseNotificationHandler } from "./base.handler";
import { getDispatcher } from "../providers/notification.dispatcher";
import { notificationRepository } from "../../domains/notification/notification.repository";
import { invitationTemplate } from "../../templates/invitation.template";
import { ROUTING_KEYS } from "../../messaging/connection";
import type { NotifyInvitationPayload } from "../../messaging/publisher";

export class InvitationHandler extends BaseNotificationHandler {
  protected routingKey = ROUTING_KEYS.NOTIFY_INVITATION;

  protected async handle(data: unknown): Promise<void> {
    const e = data as NotifyInvitationPayload;
    const { subject, html } = invitationTemplate({
      tenantName: e.tenantName,
      roleName: e.roleName,
      code: e.code,
      iconUrl: e.iconUrl,
      signupUrl: e.signupUrl,
    });

    const notification = await notificationRepository.create({
      type: "invitation",
      channel: "email",
      recipientEmail: e.email,
      subject,
      message: `Invitation email sent to ${e.email}`,
      metadata: {
        notificationId: e.notificationId,
        tenantId: e.tenantId,
        roleName: e.roleName,
      },
    });

    await getDispatcher().sendEmail(e.email, subject, html);
    await notificationRepository.markSent(notification.id);
  }
}

export const invitationHandler = new InvitationHandler();
