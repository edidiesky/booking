import { query, queryOne } from "@booking/shared";

export interface UserNotification {
  id:          string;
  user_id:     string;
  source:      "campaign" | "system";
  campaign_id: string | null;
  title:       string;
  body:        string;
  is_read:     boolean;
  created_at:  Date;
}

export const userNotificationRepository = {
  async listByUser(userId: string, page = 1, limit = 30): Promise<UserNotification[]> {
    const offset = (page - 1) * limit;
    return query<UserNotification>(
      `SELECT * FROM user_notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    );
  },

  async unreadCount(userId: string): Promise<number> {
    const row = await queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM user_notifications WHERE user_id = $1 AND is_read = false`,
      [userId],
    );
    return parseInt(row?.count ?? "0", 10);
  },

  async markRead(id: string, userId: string): Promise<void> {
    await query(`UPDATE user_notifications SET is_read = true WHERE id = $1 AND user_id = $2`, [id, userId]);
  },

  async markAllRead(userId: string): Promise<void> {
    await query(`UPDATE user_notifications SET is_read = true WHERE user_id = $1 AND is_read = false`, [userId]);
  },
};