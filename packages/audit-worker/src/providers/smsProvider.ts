import { logger } from "@booking/shared";

export async function sendCampaignSms(_to: string, _message: string): Promise<void> {
  logger.error("campaign_sms_not_implemented", { event: "campaign_sms_not_implemented" });
  throw new Error("SMS sending is not yet implemented in campaign-worker, see smsProvider.ts.");
}