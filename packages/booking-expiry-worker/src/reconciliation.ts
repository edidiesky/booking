
import { query, logger } from "@booking/shared";
import client from "prom-client";

export const bookingExpiryReconciliationRepairCounter = new client.Counter({
  name: "booking_expiry_reconciliation_repairs_total",
  help: "Bookings past pending_payment expiry found missing from the Redis schedule index and re-added",
});

const scheduleIndex = createScheduleIndexImport();
function createScheduleIndexImport() {
  const { createScheduleIndex } = require("@booking/shared");
  return createScheduleIndex("schedule:booking_expiry");
}

const RECONCILE_TICK_MS = 5 * 60_000;
const STALE_BUFFER_MS   = 60_000;

async function reconcileOnce(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_BUFFER_MS - 30 * 60_000);
  const stale = await query<{ id: string }>(
    `SELECT id FROM bookings WHERE status = 'pending_payment' AND created_at < $1 LIMIT 500`,
    [cutoff],
  );

  // Single pipelined round trip for all 500 ids, instead of 500 sequential
  // ZSCORE calls.
  const presentIds = await scheduleIndex.hasMany(stale.map((row) => row.id));
  const missing = stale.filter((row) => !presentIds.has(row.id));

  if (missing.length > 0) {
    await scheduleIndex.addMany(missing.map((row) => row.id), Date.now());
    bookingExpiryReconciliationRepairCounter.inc(missing.length);
  }
  const repaired = missing.length;

  if (repaired > 0) {
    logger.warn("booking_expiry_reconciliation_repaired", { event: "booking_expiry_reconciliation_repaired", checked: stale.length, repaired });
  }
}

let timer: NodeJS.Timeout | null = null;
export function startBookingExpiryReconciliation(): void {
  if (timer) return;
  timer = setInterval(() => { reconcileOnce().catch((err) => logger.error("booking_expiry_reconciliation_failed", { error: (err as Error).message })); }, RECONCILE_TICK_MS);
}
export function stopBookingExpiryReconciliation(): void {
  if (timer) { clearInterval(timer); timer = null; }
}