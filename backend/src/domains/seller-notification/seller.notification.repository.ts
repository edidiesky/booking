import { query, queryOne } from "@booking/shared";

export type SellerNotificationType = "booking_confirmed" | "booking_checked_in" | "booking_checked_out";

export interface SellerNotification {
  id:         string;
  tenant_id:  string;
  booking_id: string | null;
  type:       SellerNotificationType;
  title:      string;
  body:       string;
  is_read:    boolean;
  created_at: Date;
}

export const sellerNotificationRepository = {
  async listByTenant(tenantId: string, page = 1, limit = 30): Promise<SellerNotification[]> {
    const offset = (page - 1) * limit;
    return query<SellerNotification>(
      `SELECT * FROM seller_notifications WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset],
    );
  },

  async unreadCount(tenantId: string): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM seller_notifications WHERE tenant_id = $1 AND is_read = false`,
      [tenantId],
    );
    return parseInt(row?.count ?? "0", 10);
  },

  async markRead(id: string, tenantId: string): Promise<void> {
    await query(
      `UPDATE seller_notifications SET is_read = true WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
  },

  async markAllRead(tenantId: string): Promise<void> {
    await query(
      `UPDATE seller_notifications SET is_read = true WHERE tenant_id = $1 AND is_read = false`,
      [tenantId],
    );
  },
};



