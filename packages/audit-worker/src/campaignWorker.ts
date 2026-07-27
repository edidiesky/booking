import { query, queryOne, redisClient, logger } from "@booking/shared";
import { recipientRepository, type ClaimedRecipient } from "./repositories/recipientRepository";
import { isOptedIn } from "./repositories/preferenceRepository";
import { providerHealth, type ProviderName } from "./providers/providerHealth";
import { sendCampaignEmail } from "./providers/emailProvider";
import { sendCampaignSms } from "./providers/smsProvider";

const BATCH_SIZE = 50;
const SEND_DELAY_MS = 100;

interface CampaignTemplateRow {
  channel: "email" | "sms" | "in_app";
  subject: string | null;
  body:    string;
}

interface UserRow {
  email: string | null;
  phone: string | null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function channelToProvider(channel: "email" | "sms" | "in_app"): ProviderName | null {
  if (channel === "email") return "email";
  if (channel === "sms") return "sms";
  return null; // in_app has no external provider to be "down"
}

async function processRecipient(recipient: ClaimedRecipient, template: CampaignTemplateRow): Promise<void> {
  // Preference check first: cheapest check, and correctness-critical, an
  // opted-out user must never reach the provider-health or send steps.
  const optedIn = await isOptedIn(recipient.user_id, recipient.channel);
  if (!optedIn) {
    await recipientRepository.markSkipped(recipient.id, "skipped_preference");
    return;
  }

  const provider = channelToProvider(recipient.channel);
  if (provider) {
    const health = await providerHealth.getStatus(provider);
    if (health === "down") {
      // Left claimable again rather than permanently skipped, a
      // provider outage is transient, "down" now doesn't mean this
      // recipient should never get the campaign.
      await query(`UPDATE campaign_recipients SET status = 'pending' WHERE id = $1`, [recipient.id]);
      return;
    }
  }

  const user = await queryOne<UserRow>(`SELECT email, phone FROM users WHERE id = $1`, [recipient.user_id]);
  if (!user) {
    await recipientRepository.markFailed(recipient.id, "User not found.");
    return;
  }

  try {
    if (recipient.channel === "email") {
      if (!user.email) throw new Error("User has no email on file.");
      await sendCampaignEmail(user.email, template.subject ?? "", template.body);
    } else if (recipient.channel === "sms") {
      if (!user.phone) throw new Error("User has no phone on file.");
      await sendCampaignSms(user.phone, template.body);
    } else {
      const row = await queryOne<{ id: string; created_at: Date }>(
        `INSERT INTO user_notifications (user_id, source, campaign_id, title, body)
         VALUES ($1, 'campaign', $2, $3, $4)
         RETURNING id, created_at`,
        [recipient.user_id, recipient.campaign_id, template.subject ?? "New notification", template.body],
      );

      // Same Redis channel backend/src/domains/sse/sse.service.ts's
      // pushToUser publishes to, reaches an already-connected dashboard
      // or app session live, regardless of which process published it.
      await redisClient.publish("sse:events", JSON.stringify({
        userId: recipient.user_id,
        event: {
          type: "user_notification",
          payload: { id: row?.id, title: template.subject ?? "New notification", body: template.body, createdAt: row?.created_at, isRead: false },
        },
      }));
    }

    if (provider) await providerHealth.recordSuccess(provider);
    await recipientRepository.markSent(recipient.id);
  } catch (err) {
    if (provider) await providerHealth.recordFailure(provider);
    await recipientRepository.markFailed(recipient.id, (err as Error).message);
  }
}

export async function runCampaignWorkerTick(): Promise<void> {
  const campaignIds = await recipientRepository.pendingCampaignIds();

  for (const campaignId of campaignIds) {
    const templates = await query<CampaignTemplateRow>(
      `SELECT channel, subject, body FROM campaign_templates WHERE campaign_id = $1`,
      [campaignId],
    );
    const templateByChannel = new Map(templates.map((t) => [t.channel, t]));

    const batch = await recipientRepository.claimBatch(campaignId, BATCH_SIZE);
    if (batch.length === 0) continue;

    logger.info("campaign_batch_claimed", { event: "campaign_batch_claimed", campaignId, batchSize: batch.length });

    for (const recipient of batch) {
      const template = templateByChannel.get(recipient.channel);
      if (!template) {
        await recipientRepository.markFailed(recipient.id, `No template for channel ${recipient.channel}.`);
        continue;
      }
      await processRecipient(recipient, template);
      await sleep(SEND_DELAY_MS);
    }

    await recipientRepository.markCampaignCompleteIfDone(campaignId);
  }
}