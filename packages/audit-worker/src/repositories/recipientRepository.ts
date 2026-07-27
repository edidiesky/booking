import { query, queryOne } from "@booking/shared";

export interface ClaimedRecipient {
  id:         string;
  campaign_id: string;
  user_id:    string;
  channel:    "email" | "sms" | "in_app";
  attempt_count: number;
}

export const recipientRepository = {
  async claimBatch(campaignId: string, limit: number): Promise<ClaimedRecipient[]> {
    return query<ClaimedRecipient>(
      `UPDATE campaign_recipients
       SET status = 'sending'
       WHERE id IN (
         SELECT id FROM campaign_recipients
         WHERE campaign_id = $1 AND status = 'pending'
         ORDER BY created_at
         LIMIT $2
         FOR UPDATE SKIP LOCKED
       )
       RETURNING id, campaign_id, user_id, channel, attempt_count`,
      [campaignId, limit],
    );
  },

  async markSent(id: string): Promise<void> {
    await query(`UPDATE campaign_recipients SET status = 'sent', sent_at = now() WHERE id = $1`, [id]);
  },

  async markFailed(id: string, error: string, maxAttempts = 3): Promise<void> {
    const row = await queryOne<{ attempt_count: number }>(
      `UPDATE campaign_recipients
       SET attempt_count = attempt_count + 1, error = $2,
           status = CASE WHEN attempt_count + 1 >= $3 THEN 'failed' ELSE 'pending' END
       WHERE id = $1
       RETURNING attempt_count`,
      [id, error, maxAttempts],
    );
    void row;
  },

  async markSkipped(id: string, reason: "skipped_preference" | "skipped_provider_down"): Promise<void> {
    await query(`UPDATE campaign_recipients SET status = $2 WHERE id = $1`, [id, reason]);
  },

  async pendingCampaignIds(): Promise<string[]> {
    const rows = await query<{ campaign_id: string }>(
      `SELECT DISTINCT c.id AS campaign_id
       FROM campaigns c
       JOIN campaign_recipients r ON r.campaign_id = c.id
       WHERE c.status = 'sending' AND r.status = 'pending'`,
    );
    return rows.map((r) => r.campaign_id);
  },

  async remainingPendingCount(campaignId: string): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM campaign_recipients WHERE campaign_id = $1 AND status = 'pending'`,
      [campaignId],
    );
    return parseInt(row?.count ?? "0", 10);
  },

  async markCampaignCompleteIfDone(campaignId: string): Promise<void> {
    const remaining = await recipientRepository.remainingPendingCount(campaignId);
    if (remaining === 0) {
      await query(`UPDATE campaigns SET status = 'completed', updated_at = now() WHERE id = $1 AND status = 'sending'`, [campaignId]);
    }
  },
};