import { campaignRepository, type CampaignChannel } from "./campaign.repository";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";
import { audienceResolver } from "../audience/audience.resolver";
import { AudienceFilter } from "../audience/audience.types";

const VALID_CHANNELS: CampaignChannel[] = ["email", "sms", "in_app"];

export class CampaignService {
  async create(tenantId: string, createdBy: string, body: unknown) {
    const { name, channels } = body as { name?: string; channels?: string[] };
    if (!name?.trim()) throw AppError.badRequest("Campaign name is required.");
    if (!channels?.length || !channels.every((c) => VALID_CHANNELS.includes(c as CampaignChannel))) {
      throw AppError.badRequest("At least one valid channel (email, sms, in_app) is required.");
    }
    return campaignRepository.create({ tenantId, name: name.trim(), channels: channels as CampaignChannel[], createdBy });
  }

  async setAudience(campaignId: string, tenantId: string, filter: AudienceFilter) {
    const campaign = await this.getOwnedCampaign(campaignId, tenantId);
    if (campaign.status !== "draft") throw AppError.badRequest("Only draft campaigns can have their audience changed.");
    await campaignRepository.updateAudienceFilter(campaignId, filter);
    return audienceResolver.preview(filter, tenantId);
  }

  async previewAudience(campaignId: string, tenantId: string) {
    const campaign = await this.getOwnedCampaign(campaignId, tenantId);
    return audienceResolver.preview(campaign.audience_filter, tenantId);
  }

  async attachTemplate(campaignId: string, tenantId: string, body: unknown) {
    const campaign = await this.getOwnedCampaign(campaignId, tenantId);
    if (campaign.status !== "draft") throw AppError.badRequest("Only draft campaigns can have templates changed.");
    const { channel, subject, body: templateBody } = body as { channel?: string; subject?: string; body?: string };
    if (!channel || !VALID_CHANNELS.includes(channel as CampaignChannel)) throw AppError.badRequest("Invalid channel.");
    if (!templateBody?.trim()) throw AppError.badRequest("Template body is required.");
    if (channel === "email" && !subject?.trim()) throw AppError.badRequest("Email templates require a subject.");
    if (!campaign.channels.includes(channel as CampaignChannel)) {
      throw AppError.badRequest(`This campaign doesn't include the "${channel}" channel.`);
    }
    return campaignRepository.upsertTemplate(campaignId, channel as CampaignChannel, subject ?? null, templateBody.trim());
  }

  async getDetail(campaignId: string, tenantId: string) {
    const campaign = await this.getOwnedCampaign(campaignId, tenantId);
    const [templates, audiencePreview, recipientStats] = await Promise.all([
      campaignRepository.listTemplates(campaignId),
      audienceResolver.preview(campaign.audience_filter, tenantId),
      campaignRepository.recipientStats(campaignId),
    ]);
    return { campaign, templates, audiencePreview, recipientStats };
  }

  async list(tenantId: string, page: number, limit: number) {
    return campaignRepository.listByTenant(tenantId, page, limit);
  }

  async prepareSend(campaignId: string, tenantId: string) {
    const campaign = await this.getOwnedCampaign(campaignId, tenantId);
    if (campaign.status !== "draft") throw AppError.badRequest(`Campaign is already ${campaign.status}.`);

    const templates = await campaignRepository.listTemplates(campaignId);
    const templatedChannels = new Set(templates.map((t) => t.channel));
    const missing = campaign.channels.filter((c) => !templatedChannels.has(c));
    if (missing.length > 0) throw AppError.badRequest(`Missing templates for: ${missing.join(", ")}.`);

    const audience = await audienceResolver.resolve(campaign.audience_filter, tenantId);
    if (audience.length === 0) throw AppError.badRequest("Audience is empty, nothing to send.");

    const recipients = audience.flatMap((user) =>
      campaign.channels.map((channel) => ({ userId: user.id, channel })),
    );
    await campaignRepository.snapshotRecipients(campaignId, recipients);
    await campaignRepository.updateStatus(campaignId, "sending");

    logger.info("campaign_prepared_for_send", {
      event: "campaign_prepared_for_send", campaignId, audienceSize: audience.length, recipientRows: recipients.length,
    });

    return { audienceSize: audience.length, recipientRows: recipients.length };
  }

  async getOwnedCampaign(campaignId: string, tenantId: string) {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) throw AppError.notFound("Campaign was not found. Kindly reach out to the adinstrator of the application");
    if (campaign.tenant_id !== tenantId) throw AppError.forbidden("This campaign does not belong to your tenant.");
    return campaign;
  }
};

export const campaignService = new CampaignService()