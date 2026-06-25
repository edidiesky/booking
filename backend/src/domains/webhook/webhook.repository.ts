import { query, queryOne } from "../../config/database";
import { PaymentGateway, WebhookLogStatus } from "../../types";

export interface WebhookLog {
  id:              string;
  gateway:         PaymentGateway;
  transaction_id:  string;
  raw_payload:     Record<string, unknown>;
  failure_reason?: string;
  retry_count:     number;
  last_attempt_at: Date;
  next_retry_at?:  Date;
  status:          WebhookLogStatus;
  created_at:      Date;
  updated_at:      Date;
}

const MAX_WEBHOOK_RETRIES = 5;

function backoffMinutes(retryCount: number): number {
  return Math.min(Math.pow(2, retryCount), 60); // 1, 2, 4, 8, 16, 60 min
}

export const webhookRepository = {
  async logFailure(data: {
    gateway:       PaymentGateway;
    transactionId: string;
    rawPayload:    Record<string, unknown>;
    failureReason: string;
  }): Promise<void> {
    const nextRetryAt = new Date(Date.now() + backoffMinutes(0) * 60_000);
    await query(
      `INSERT INTO webhook_logs (gateway, transaction_id, raw_payload, failure_reason, last_attempt_at, next_retry_at)
       VALUES ($1,$2,$3::jsonb,$4,now(),$5)
       ON CONFLICT DO NOTHING`,
      [data.gateway, data.transactionId, JSON.stringify(data.rawPayload), data.failureReason, nextRetryAt]
    );
  },

  async getPendingRetries(): Promise<WebhookLog[]> {
    return query<WebhookLog>(
      `SELECT * FROM webhook_logs
       WHERE status = 'pending'
         AND retry_count < $1
         AND (next_retry_at IS NULL OR next_retry_at <= now())
       ORDER BY created_at ASC
       LIMIT 20`,
      [MAX_WEBHOOK_RETRIES]
    );
  },

  async incrementRetry(id: string, reason: string): Promise<void> {
    const log = await queryOne<WebhookLog>(`SELECT retry_count FROM webhook_logs WHERE id = $1`, [id]);
    if (!log) return;

    const nextCount  = log.retry_count + 1;
    const nextStatus: WebhookLogStatus = nextCount >= MAX_WEBHOOK_RETRIES ? "permanent_failure" : "failed";
    const nextRetry  = nextCount < MAX_WEBHOOK_RETRIES
      ? new Date(Date.now() + backoffMinutes(nextCount) * 60_000)
      : null;

    await query(
      `UPDATE webhook_logs
       SET retry_count = $1, failure_reason = $2, status = $3,
           next_retry_at = $4, last_attempt_at = now(), updated_at = now()
       WHERE id = $5`,
      [nextCount, reason, nextStatus, nextRetry, id]
    );
  },

  async markCompleted(id: string): Promise<void> {
    await query(
      `UPDATE webhook_logs SET status = 'completed', updated_at = now() WHERE id = $1`,
      [id]
    );
  },
};
