import { Pool } from "pg";
import { sagaRepository } from "../repositories/saga.repository";
import { SagaOrchestrator, SagaDefinition } from "./SagaOrchestrator";
import { bookingPaymentSaga } from "../bookingPaymentSaga";
import { logger } from "../logger";

const PAUSE_TIMEOUT_MS = Number(
  process.env.SAGA_PAUSE_TIMEOUT_MS ?? 30 * 60_000,
);
const SWEEP_INTERVAL_MS = Number(process.env.SAGA_SWEEP_INTERVAL_MS ?? 30_000);

const definitions: Record<string, SagaDefinition<unknown>> = {
  booking_payment: bookingPaymentSaga as SagaDefinition<unknown>,
};

/**
 * Reclaims expired leases and expires stale paused sagas (pause timeout).
 */
export function startSagaSweeper(pool: Pool): () => void {
  const orchestrator = new SagaOrchestrator(pool);

  const tick = async () => {
    try {
      const expired = await sagaRepository.listExpiredLeases(pool, 20);
      for (const row of expired) {
        const def = definitions[row.saga_type];
        if (!def) continue;
        logger.info("saga_sweeper_reclaim_lease", {
          sagaId: row.id,
          sagaType: row.saga_type,
        });
        await orchestrator.resume(def, row.id);
      }

      const stale = await sagaRepository.listStalePaused(
        pool,
        PAUSE_TIMEOUT_MS,
        20,
      );
      for (const row of stale) {
        const def = definitions[row.saga_type];
        if (!def) continue;
        logger.info("saga_sweeper_pause_timeout", {
          sagaId: row.id,
          sagaType: row.saga_type,
        });
        await expirePausedSaga(pool, def, row);
      }
    } catch (err) {
      logger.error("saga_sweeper_error", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handle = setInterval(() => {
    void tick();
  }, SWEEP_INTERVAL_MS);
  void tick();

  return () => clearInterval(handle);
}

async function expirePausedSaga(
  pool: Pool,
  def: SagaDefinition<unknown>,
  row: {
    id: string;
    current_step: number;
    context: unknown;
  },
) {
  const context = row.context as Record<string, unknown>;
  await sagaRepository.updateStatus(pool, row.id, "compensating");
  for (let i = row.current_step - 1; i >= 0; i--) {
    const step = def.steps[i];
    if (!step) continue;
    try {
      await step.compensate(context);
    } catch (err) {
      logger.error("saga_sweeper_compensate_failed", {
        sagaId: row.id,
        step: step.name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  await sagaRepository.updateStatus(pool, row.id, "compensated");
}
