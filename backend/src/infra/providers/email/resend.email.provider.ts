import { Resend } from "resend";
import { IEmailProvider, SendEmailOptions } from "./email.provider.interface";
import logger from "../../../utils/logger";

const FROM_ADDRESS =
  process.env.EMAIL_FROM_NAME
    ? `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`
    : `Booking <${process.env.EMAIL_FROM}>`;

export class ResendEmailProvider implements IEmailProvider {
  private readonly client: Resend;

  constructor() {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY env var is not set");
    }
    this.client = new Resend(process.env.RESEND_API_KEY);
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, subject, html } = options;

    const { error } = await this.client.emails.send({
      from:    FROM_ADDRESS,
      to:      [to],
      subject,
      html,
    });

    if (error) {
      logger.error("resend_email_failed", { to, subject, error: error.message });
      throw new Error(`Resend email failed: ${error.message}`);
    }

    logger.info("resend_email_sent", { to, subject });
  }
}