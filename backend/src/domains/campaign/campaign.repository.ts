import { query, queryOne } from "@booking/shared";
import type { AudienceFilter } from "../audience/audience.types";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "completed" | "failed" | "cancelled";
export type CampaignChannel = "email" | "sms" | "in_app";

export interface Campaign {
  id:              string;
  tenant_id:       string | null;
  name:            string;
  status:          CampaignStatus;
  audience_filter: AudienceFilter;
  channels:        CampaignChannel[];
  scheduled_at:    Date | null;
  created_by:      string | null;
  created_at:      Date;
  updated_at:      Date;
}

export interface CampaignTemplate {
  id:          string;
  campaign_id: string;
  channel:     CampaignChannel;
  subject:     string | null;
  body:        string;
  created_at:  Date;
}

export const campaignRepository = {
  async create(data: {
    tenantId?:   string;
    name:        string;
    channels:    CampaignChannel[];
    createdBy:   string;
  }): Promise<Campaign> {
    const row = await queryOne<Campaign>(
      `INSERT INTO campaigns (tenant_id, name, channels, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [data.tenantId ?? null, data.name, data.channels, data.createdBy],
    );
    return row!;
  },

  async findById(id: string): Promise<Campaign | null> {
    return queryOne<Campaign>(`SELECT * FROM campaigns WHERE id = $1`, [id]);
  },

  async listByTenant(tenantId: string, page = 1, limit = 20): Promise<Campaign[]> {
    const offset = (page - 1) * limit;
    return query<Campaign>(
      `SELECT * FROM campaigns WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
  },

  async updateAudienceFilter(id: string, filter: AudienceFilter): Promise<void> {
    await query(`UPDATE campaigns SET audience_filter = $1::jsonb, updated_at = now() WHERE id = $2`, [JSON.stringify(filter), id]);
  },

  async updateStatus(id: string, status: CampaignStatus, scheduledAt?: Date): Promise<void> {
    await query(
      `UPDATE campaigns SET status = $1, scheduled_at = COALESCE($2, scheduled_at), updated_at = now() WHERE id = $3`,
      [status, scheduledAt ?? null, id],
    );
  },

  async upsertTemplate(campaignId: string, channel: CampaignChannel, subject: string | null, body: string): Promise<CampaignTemplate> {
    const row = await queryOne<CampaignTemplate>(
      `INSERT INTO campaign_templates (campaign_id, channel, subject, body)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (campaign_id, channel) DO UPDATE SET subject = EXCLUDED.subject, body = EXCLUDED.body
       RETURNING *`,
      [campaignId, channel, subject, body],
    );
    return row!;
  },

  async listTemplates(campaignId: string): Promise<CampaignTemplate[]> {
    return query<CampaignTemplate>(`SELECT * FROM campaign_templates WHERE campaign_id = $1`, [campaignId]);
  },

  // One row per (campaign, user, channel), this is the audience snapshot,
  // taken once at send time so the campaign's recipient list is fixed and
  // auditable from here on, not re-derived from a possibly-changed live
  // audience on every retry. Batched in chunks of 500: a single unbatched
  // INSERT for a large audience would build an unreasonably large SQL
  // statement and risk Postgres's parameter limit, same batching pattern
  // used elsewhere in this codebase for bulk room-type inserts.
  async snapshotRecipients(campaignId: string, recipients: { userId: string; channel: CampaignChannel }[]): Promise<number> {
    const CHUNK_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      const values: string[] = [];
      const params: unknown[] = [];
      chunk.forEach((r) => {
        params.push(campaignId, r.userId, r.channel);
        values.push(`($${params.length - 2}, $${params.length - 1}, $${params.length})`);
      });
      await query(
        `INSERT INTO campaign_recipients (campaign_id, user_id, channel)
         VALUES ${values.join(", ")}
         ON CONFLICT (campaign_id, user_id, channel) DO NOTHING`,
        params,
      );
      inserted += chunk.length;
    }

    return inserted;
  },

  async recipientStats(campaignId: string): Promise<Record<string, number>> {
    const rows = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) AS count FROM campaign_recipients WHERE campaign_id = $1 GROUP BY status`,
      [campaignId],
    );
    return Object.fromEntries(rows.map((r) => [r.status, parseInt(r.count, 10)]));
  },
};