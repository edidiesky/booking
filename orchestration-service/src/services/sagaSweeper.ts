import { Pool } from "pg";
import { sagaRepository } from "../repositories/saga.repository";
import { SagaOrchestrator, SagaDefinition } from "./SagaOrchestrator";
import { bookingPaymentSaga } from "../bookingPaymentSaga";
import { logger } from "../logger";

const PAUSE_TIMEOUT_MS = Number(process.env.SAGA_PAUSE_TIMEOUT_MS ?? 30 * 60_000);
const SWEEP_INTERVAL_MS = Number(process.env.SAGA_SWEEP_INTERVAL_MS ?? 30_000);

const definitions: Record<string, SagaDefinition<any>> = {
  booking_payment: bookingPaymentSaga,
};

/**
 * 1) re-drives sagas whose lease expired (crash, scheduled compensation/forward retry)
 * 2) expires sagas parked at a wait point longer than the timeout.
 * Both go through claim(), so they can never race a webhook resume.
 */
export function startSagaSweeper(pool: Pool): () => void {
  const orchestrator = new SagaOrchestrator(pool);
  let running = false;

  const tick = async () => {
    if (running) return; // never overlap ticks
    running = true;
    try {
      for (const row of await sagaRepository.listExpiredLeases(pool, 20)) {
        const def = definitions[row.saga_type];
        if (!def) continue;
        try {
          logger.info("saga_sweeper_reclaim_lease", { sagaId: row.id, sagaType: row.saga_type });
          await orchestrator.resume(def, row.id);
        } catch (err) {
          logger.error("saga_sweeper_resume_error", { sagaId: row.id, error: String(err) });
        }
      }

      for (const row of await sagaRepository.listStalePaused(pool, PAUSE_TIMEOUT_MS, 20)) {
        const def = definitions[row.saga_type];
        if (!def) continue;
        try {
          logger.info("saga_sweeper_pause_timeout", { sagaId: row.id, sagaType: row.saga_type });
          await orchestrator.expire(def, row.id, "payment confirmation timed out");
        } catch (err) {
          logger.error("saga_sweeper_expire_error", { sagaId: row.id, error: String(err) });
        }
      }
    } catch (err) {
      logger.error("saga_sweeper_error", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      running = false;
    }
  };

  const handle = setInterval(() => void tick(), SWEEP_INTERVAL_MS);
  void tick();
  return () => clearInterval(handle);
}
