import {
  createLockedScheduler,
  query,
  availabilityBroadcaster,
  logger,
  locksPurgedCounter,
  driftDetectedGauge,
} from "@booking/shared";

async function lockSweepTick(): Promise<void> {
  const expired = await query<{
    room_type_id: string;
    check_in: string;
    check_out: string;
  }>(
    `DELETE FROM booking_locks WHERE expires_at < now() RETURNING room_type_id, check_in, check_out`,
  );
  if (expired.length === 0) return;
  locksPurgedCounter.inc(expired.length);
  for (const lock of expired) {
    availabilityBroadcaster.publish(lock.room_type_id, {
      type: "released",
      checkIn: lock.check_in,
      checkOut: lock.check_out,
    });
  }
}

async function reconciliationTick(): Promise<void> {
  const drifted = await query<{
    room_type_id: string;
    date: string;
    computed_count: number;
  }>(
    `SELECT
       ac.room_type_id, ac.date,
       rt.quantity - COALESCE(active.held, 0) - COALESCE(confirmed.held, 0) AS computed_count
     FROM availability_calendar ac
     JOIN room_types rt ON rt.id = ac.room_type_id
     LEFT JOIN LATERAL (
       SELECT SUM(rooms_held) AS held FROM booking_locks bl
       WHERE bl.room_type_id = ac.room_type_id
         AND bl.expires_at > now()
         AND ac.date >= bl.check_in AND ac.date < bl.check_out
     ) active ON true
     LEFT JOIN LATERAL (
       SELECT SUM(b.rooms_count) AS held FROM bookings b
       WHERE b.room_type_id = ac.room_type_id
         AND b.status IN ('confirmed', 'checked_in', 'checked_out')
         AND ac.date >= b.check_in AND ac.date < b.check_out
     ) confirmed ON true
     WHERE ac.date >= CURRENT_DATE AND ac.date <= CURRENT_DATE + INTERVAL '90 days'
       AND ac.available_count != (rt.quantity - COALESCE(active.held, 0) - COALESCE(confirmed.held, 0))`,
  );
  driftDetectedGauge.set(drifted.length);
  if (drifted.length === 0) return;

  logger.warn("availability_drift_repaired", {
    event: "availability_drift_repaired",
    count: drifted.length,
    sample: drifted.slice(0, 5),
  });

  await query(
    `UPDATE availability_calendar ac SET available_count = data.computed_count, updated_at = now()
     FROM (SELECT * FROM UNNEST($1::uuid[], $2::date[], $3::int[]) AS t(room_type_id, date, computed_count)) data
     WHERE ac.room_type_id = data.room_type_id AND ac.date = data.date`,
    [
      drifted.map((r) => r.room_type_id),
      drifted.map((r) => r.date),
      drifted.map((r) => r.computed_count),
    ],
  );
}

export const lockSweepScheduler = createLockedScheduler({
  lockKey: "scheduler:lock_sweep:lock",
  lockTtlSec: 15,
  tickMs: 5 * 60_000,
  serviceName: "availability-worker",
  onTick: lockSweepTick,
});

export const reconciliationScheduler = createLockedScheduler({
  lockKey: "scheduler:reconciliation:lock",
  lockTtlSec: 15,
  tickMs: 30 * 60_000,
  serviceName: "availability-worker",
  onTick: reconciliationTick,
});
