import { Pool } from "pg";
import logger from "../../utils/logger";

// Dedicated connection using the BYPASSRLS role, not the app's normal
// RLS-subject one. This refresh runs on a setInterval, outside any
// HTTP request, so there's no app.current_tenant_id session variable
// ever set. "Popular properties" is inherently a cross-tenant,
// marketplace-wide aggregation (bookings/reviews/properties are all
// RLS-protected with FORCE), running it through the normal role would
// get silently filtered to zero rows, corrupting the view for every
// tenant, not just returning an empty result for one. Same reasoning
// as why the isolated workers need booking_worker's BYPASSRLS
// connection string, this is that same class of operation, just
// running inside the main backend process instead of a separate one.
const ADMIN_DATABASE_URL = process.env.ADMIN_DATABASE_URL;
if (!ADMIN_DATABASE_URL) {
  logger.error("admin_database_url_missing", {
    event: "admin_database_url_missing",
    message: "ADMIN_DATABASE_URL is not set, popular-properties refresh will not run. This must point at the BYPASSRLS role's connection string, not the normal app role.",
  });
}
const adminPool = new Pool({ connectionString: ADMIN_DATABASE_URL });

let hasBeenPopulated = false;

// REFRESH MATERIALIZED VIEW CONCURRENTLY requires the view to already
// have data (it needs to diff old vs new rows), so the very first
// refresh after the view is created WITH NO DATA has to be a plain,
// locking refresh. Every refresh after that can be CONCURRENTLY,
// keeping the view queryable throughout instead of blocking reads
// while it recomputes.
export async function refreshPopularProperties(): Promise<void> {
  const start = Date.now();
  try {
    if (!hasBeenPopulated) {
      await adminPool.query(`REFRESH MATERIALIZED VIEW mv_popular_properties`);
      hasBeenPopulated = true;
    } else {
      await adminPool.query(`REFRESH MATERIALIZED VIEW CONCURRENTLY mv_popular_properties`);
    }
    logger.info("popular_properties_refreshed", { event: "popular_properties_refreshed", durationMs: Date.now() - start });
  } catch (err) {
    logger.error("popular_properties_refresh_failed", { event: "popular_properties_refresh_failed", error: (err as Error).message });
  }
}

// Runs on a schedule, not per-request and not event-driven off every
// booking/favorite/review, a REFRESH recomputes the whole view, doing
// that on every single booking would be real, unnecessary load at
// scale. Popularity ranking doesn't need to be second-by-second
// accurate, a periodic refresh is the correct tradeoff here.
const REFRESH_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

let intervalHandle: NodeJS.Timeout | null = null;

export function startPopularPropertiesScheduler(): void {
  void refreshPopularProperties(); // populate on boot, don't wait for the first interval tick
  intervalHandle = setInterval(() => { void refreshPopularProperties(); }, REFRESH_INTERVAL_MS);
}

// Mirrors stopOutboxPoller/stopWebhookRetryWorker's exact convention
// in server/shutdown.ts, this was missing entirely before, the
// interval and the dedicated admin pool connection both kept running
// past shutdown with nothing to stop them.
export async function stopPopularPropertiesScheduler(): Promise<void> {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
  await adminPool.end();
}