import redisClient from "../config/redis";
import logger from "../utils/logger";

const KEY_PREFIX = "killswitch:";

export async function isDisabled(corridor: string): Promise<boolean> {
  const value = await redisClient.get(KEY_PREFIX + corridor);
  return value === "true";
}

export async function disable(
  corridor: string,
  reason: string,
  disabledBy: string,
): Promise<void> {
  await redisClient.set(KEY_PREFIX + corridor, "true");
  await redisClient.set(
    KEY_PREFIX + corridor + ":meta",
    JSON.stringify({
      reason,
      disabledBy,
      disabledAt: new Date().toISOString(),
    }),
  );
  logger.warn("kill_switch_disabled", {
    event: "kill_switch_disabled",
    corridor,
    reason,
    disabledBy,
  });
}

export async function enable(
  corridor: string,
  enabledBy: string,
): Promise<void> {
  await redisClient.del(KEY_PREFIX + corridor);
  await redisClient.del(KEY_PREFIX + corridor + ":meta");
  logger.info("kill_switch_enabled", {
    event: "kill_switch_enabled",
    corridor,
    enabledBy,
  });
}

export async function getStatus(corridor: string): Promise<{
  disabled: boolean;
  reason?: string;
  disabledBy?: string;
  disabledAt?: string;
}> {
  const disabled = await isDisabled(corridor);
  if (!disabled) return { disabled: false };
  const metaRaw = await redisClient.get(KEY_PREFIX + corridor + ":meta");
  const meta = metaRaw ? JSON.parse(metaRaw) : {};
  return { disabled: true, ...meta };
}

export async function listDisabled(): Promise<string[]> {
  const keys = await redisClient.keys(`${KEY_PREFIX}*`);
  return keys
    .filter((k) => !k.endsWith(":meta"))
    .map((k) => k.slice(KEY_PREFIX.length));
}
