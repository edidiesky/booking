import type amqp from "amqplib";
import { query, availabilityBroadcaster, logger } from "@booking/shared";
import { setupRecurringTick } from "../scheduling/recurringTick";

interface ExpiredLock { room_type_id: string; check_in: string; check_out: string; }

async function sweepOnce(): Promise<void> {
  const expired = await query<ExpiredLock>(
    `DELETE FROM booking_locks WHERE expires_at < now() RETURNING room_type_id, check_in, check_out`,
  );
  if (expired.length === 0) return;

  logger.info("expired_locks_purged", { event: "expired_locks_purged", count: expired.length });
  for (const lock of expired) {
    availabilityBroadcaster.publish(lock.room_type_id, { type: "released", checkIn: lock.check_in, checkOut: lock.check_out });
  }
}

export async function startLockSweep(connection: amqp.ChannelModel): Promise<void> {
  const channel = await connection.createChannel();
  await channel.prefetch(1);

  await setupRecurringTick(channel, {
    name: "lock_sweep",
    delayExchange: "sweep.lock.delay", deadExchange: "sweep.lock.dead",
    delayQueue: "sweep.lock.delay.queue", processQueue: "sweep.lock.process.queue",
    intervalMs: 5 * 60_000,
  }, sweepOnce);
}