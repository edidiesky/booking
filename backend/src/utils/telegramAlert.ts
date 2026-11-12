/**
 * Server-side Telegram notifier. Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
 */
import logger from "./logger";

export async function sendTelegramAlert(
  text: string,
  opts?: { silent?: boolean },
): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    logger.warn("telegram_alert_skipped", {
      event: "telegram_alert_skipped",
      reason: "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set",
    });
    return false;
  }
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: text.slice(0, 4000),
          disable_notification: opts?.silent ?? false,
          parse_mode: "HTML",
        }),
      },
    );
    if (!res.ok) {
      const body = await res.text();
      logger.error("telegram_alert_failed", {
        event: "telegram_alert_failed",
        status: res.status,
        body: body.slice(0, 200),
      });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("telegram_alert_error", {
      event: "telegram_alert_error",
      error: (err as Error).message,
    });
    return false;
  }
}

export async function alertServiceUnhealthy(detail: string): Promise<void> {
  await sendTelegramAlert(
    `🚨 <b>Booking platform</b>\nService unhealthy\n` + detail,
  );
}

export async function alertSliBreach(
  sli: string,
  value: string,
  threshold: string,
): Promise<void> {
  await sendTelegramAlert(
    `⚠️ <b>SLI breach</b>\n${sli}\nvalue=${value} threshold=${threshold}`,
  );
}
