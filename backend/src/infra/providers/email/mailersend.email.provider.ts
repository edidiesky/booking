import axios from "axios";
import { IEmailProvider, SendEmailOptions } from "./email.provider.interface";
import logger from "../../../utils/logger";

const MAILERSEND_URL = "https://api.mailersend.com/v1/email";

export class MailerSendEmailProvider implements IEmailProvider {
  private readonly apiKey:    string;
  private readonly fromEmail: string;
  private readonly fromName:  string;

  constructor() {
    if (!process.env.MAILERSEND_API_TOKEN) {
      throw new Error("MAILERSEND_API_TOKEN env var is not set");
    }
    this.apiKey    = process.env.MAILERSEND_API_TOKEN;
    this.fromEmail = process.env.EMAIL_FROM!;
    this.fromName  = process.env.EMAIL_FROM_NAME ?? "Booking";
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const { to, subject, html } = options;

    try {
      await axios.post(
        MAILERSEND_URL,
        {
          from: { email: this.fromEmail, name: this.fromName },
          to:   [{ email: to }],
          subject,
          html,
        },
        {
          headers: {
            Authorization:  `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      logger.info("mailersend_email_sent", { to, subject });
    } catch (err: any) {
      logger.error("mailersend_email_failed", {
        to,
        subject,
        status: err.response?.status,
        error:  err.response?.data ?? err.message,
      });
      throw new Error(
        `MailerSend email failed: ${err.response?.data?.message ?? err.message}`,
      );
    }
  }
}