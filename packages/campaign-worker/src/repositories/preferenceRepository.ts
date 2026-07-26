import { queryOne } from "@booking/shared";

export async function isOptedIn(userId: string, channel: "email" | "sms" | "in_app"): Promise<boolean> {
  const row = await queryOne<{ opted_in: boolean }>(
    `SELECT opted_in FROM user_notification_preferences WHERE user_id = $1 AND channel = $2 AND category = 'marketing'`,
    [userId, channel],
  );
  return row?.opted_in ?? true;
}