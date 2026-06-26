import { query, queryOne } from "../../config/database";
export type NotificationType =
  | "booking_confirmed" | "booking_cancelled"
  | "booking_checked_in" | "booking_checked_out"
  | "payment_confirmed" | "payment_failed"
  | "auth_otp" | "auth_registered"
  | "escrow_released" | "escrow_refunded";

export type NotificationChannel = "email" | "sms" | "email_and_sms";
export type NotificationStatus  = "pending" | "sent" | "failed" | "skipped";

export interface Notification {
  id:               string;
  type:             NotificationType;
  channel:          NotificationChannel;
  status:           NotificationStatus;
  recipient_email?: string;
  recipient_phone?: string;
  tenant_id?:       string;
  user_id?:         string;
  subject?:         string;
  message:          string;
  metadata:         Record<string, unknown>;
  sent_at?:         Date;
  failure_reason?:  string;
  created_at:       Date;
  updated_at:       Date;
}

export const notificationRepository = {
  async create(data: {
    type:            NotificationType;
    channel:         NotificationChannel;
    recipientEmail?: string;
    recipientPhone?: string;
    tenantId?:       string;
    userId?:         string;
    subject?:        string;
    message:         string;
    metadata?:       Record<string, unknown>;
  }): Promise<Notification> {
    const row = await queryOne<Notification>(
      `INSERT INTO notifications
         (type, channel, recipient_email, recipient_phone, tenant_id, user_id, subject, message, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)
       RETURNING *`,
      [
        data.type, data.channel,
        data.recipientEmail ?? null, data.recipientPhone ?? null,
        data.tenantId ?? null, data.userId ?? null,
        data.subject ?? null, data.message,
        JSON.stringify(data.metadata ?? {}),
      ]
    );
    return row!;
  },

  async markSent(id: string): Promise<void> {
    await query(
      `UPDATE notifications SET status = 'sent', sent_at = now(), updated_at = now() WHERE id = $1`,
      [id]
    );
  },

  async markFailed(id: string, reason: string): Promise<void> {
    await query(
      `UPDATE notifications SET status = 'failed', failure_reason = $1, updated_at = now() WHERE id = $2`,
      [reason, id]
    );
  },

  async listByTenant(tenantId: string, page = 1, limit = 50): Promise<Notification[]> {
    const offset = (page - 1) * limit;
    return query<Notification>(
      `SELECT * FROM notifications WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
  },

  async listByUser(userId: string, page = 1, limit = 50): Promise<Notification[]> {
    const offset = (page - 1) * limit;
    return query<Notification>(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
  },
};