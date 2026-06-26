import { IEmailProvider }          from "./email/email.provider.interface";
import { ISmsProvider }            from "./sms/sms.provider.interface";
import { MailerSendEmailProvider } from "./email/mailersend.email.provider";
import { ResendEmailProvider }     from "./email/resend.email.provider";
import { TwilioSmsProvider }       from "./sms/twilio.sms.provider";
import logger from "../../utils/logger";

export class NotificationDispatcher {
  private readonly emailProvider: IEmailProvider;
  private readonly smsProvider?:  ISmsProvider;

  constructor(emailProvider: IEmailProvider, smsProvider?: ISmsProvider) {
    this.emailProvider = emailProvider;
    this.smsProvider   = smsProvider;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    logger.debug("Dispatching email", { to, subject });
    await this.emailProvider.sendEmail({ to, subject, html });
  }

  async sendSms(to: string, message: string): Promise<void> {
    if (!this.smsProvider) {
      logger.warn("SMS provider not configured, skipping", { to });
      return;
    }
    await this.smsProvider.sendSms({ to, message });
  }
}

let dispatcher: NotificationDispatcher | null = null;

export function getDispatcher(): NotificationDispatcher {
  if (dispatcher) return dispatcher;
  const provider = process.env.EMAIL_PROVIDER ?? "mailersend";

  const emailProvider: IEmailProvider =
    provider === "resend"
      ? new ResendEmailProvider()
      : new MailerSendEmailProvider();

  let smsProvider: ISmsProvider | undefined;
  try {
    smsProvider = new TwilioSmsProvider();
  } catch {
    logger.warn("Twilio not configured, SMS disabled");
  }

  dispatcher = new NotificationDispatcher(emailProvider, smsProvider);
  return dispatcher;
}