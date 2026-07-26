import { logger } from "@booking/shared";

export async function sendCampaignEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CAMPAIGN_FROM_EMAIL ?? "campaigns@stayBooking.io";
  if (!apiKey) throw new Error("RESEND_API_KEY not configured for campaign-worker.");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    logger.error("campaign_email_send_failed", { event: "campaign_email_send_failed", to, status: res.status, body });
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}