import type amqp from "amqplib";
import { query, logger } from "@booking/shared";
import { setupRecurringTick } from "../scheduling/recurringTick";

interface DriftRow {
  room_type_id: string;
  date: string;
  stored_count: number;
  computed_count: number;
}

async function reconcileOnce(): Promise<void> {
  const drifted = await query<DriftRow>(
    `SELECT
       ac.room_type_id, ac.date, ac.available_count AS stored_count,
       rt.quantity - COALESCE(active.held, 0) AS computed_count
     FROM availability_calendar ac
     JOIN room_types rt ON rt.id = ac.room_type_id
     LEFT JOIN LATERAL (
       SELECT SUM(rooms_held) AS held FROM booking_locks bl
       WHERE bl.room_type_id = ac.room_type_id
         AND ac.date >= bl.check_in AND ac.date < bl.check_out
     ) active ON true
     WHERE ac.date >= CURRENT_DATE AND ac.date <= CURRENT_DATE + INTERVAL '90 days'
       AND ac.available_count != (rt.quantity - COALESCE(active.held, 0))`,
  );

  if (drifted.length === 0) return;
  logger.warn("availability_drift_detected", {
    event: "availability_drift_detected",
    count: drifted.length,
    sample: drifted.slice(0, 5),
  });

  for (const row of drifted) {
    await query(
      `UPDATE availability_calendar SET available_count = $1, updated_at = now() WHERE room_type_id = $2 AND date = $3`,
      [row.computed_count, row.room_type_id, row.date],
    );
  }
}

export async function startReconciliationSweep(
  connection: amqp.ChannelModel,
): Promise<void> {
  const channel = await connection.createChannel();
  await channel.prefetch(1);

  await setupRecurringTick(
    channel,
    {
      name: "reconciliation_sweep",
      delayExchange: "sweep.reconcile.delay",
      deadExchange: "sweep.reconcile.dead",
      delayQueue: "sweep.reconcile.delay.queue",
      processQueue: "sweep.reconcile.process.queue",
      intervalMs: 30 * 60_000,
    },
    reconcileOnce,
  );
}
