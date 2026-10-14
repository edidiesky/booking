import { Pool } from "pg";
import { SagaStatus } from "../repositories/saga.repository";
import { SagaStore, sagaStoreFromPool } from "../repositories/saga.store";
import { logger } from "../logger";

export class SagaPauseError extends Error {
  constructor(reason: string) {
    super(`Saga paused: ${reason}`);
    this.name = "SagaPauseError";
  }
}

export interface SagaStep<TContext> {
  name: string;
  execute(context: TContext): Promise<Partial<TContext>>;
  compensate(context: TContext): Promise<void>;
}

export interface SagaDefinition<TContext> {
  sagaType: string;
  steps: SagaStep<TContext>[];
}

export interface SagaRunResult<TContext> {
  sagaId: string;
  status: SagaStatus | "unknown";
  context: TContext;
}

const LEASE_MS = 60_000;

function isPool(value: Pool | SagaStore): value is Pool {
  return typeof (value as Pool).query === "function";
}

export class SagaOrchestrator {
  private readonly store: SagaStore;
  private readonly leaseMs: number;

  constructor(poolOrStore: Pool | SagaStore, leaseMs: number = LEASE_MS) {
    this.store = isPool(poolOrStore)
      ? sagaStoreFromPool(poolOrStore)
      : poolOrStore;
    this.leaseMs = leaseMs;
  }

  async start<TContext extends { bookingId?: string }>(
    definition: SagaDefinition<TContext>,
    initialContext: TContext,
  ): Promise<SagaRunResult<TContext>> {
    const sagaId = await this.store.insert(
      definition.sagaType,
      initialContext,
      initialContext.bookingId,
    );
    return this.run(definition, sagaId);
  }

  async resume<TContext>(
    definition: SagaDefinition<TContext>,
    sagaId: string,
  ): Promise<SagaRunResult<TContext>> {
    return this.run(definition, sagaId);
  }

  /**
   * Webhook entry: if saga not yet claimable, record signal for lost-wakeup.
   */
  async resumeByBookingId<TContext>(
    definition: SagaDefinition<TContext>,
    bookingId: string,
  ): Promise<SagaRunResult<TContext> | { status: "signal_recorded"; bookingId: string }> {
    const saga = await this.findRunningId(bookingId);
    if (!saga) {
      if (this.store.recordResumeSignal) {
        await this.store.recordResumeSignal(bookingId);
      }
      return { status: "signal_recorded", bookingId };
    }
    return this.run(definition, saga);
  }

  private async findRunningId(bookingId: string): Promise<string | null> {
    // Store may not expose findRunning; use find via optional path
    const store = this.store as SagaStore & {
      findRunningByBookingId?: (
        id: string,
      ) => Promise<{ id: string } | null>;
    };
    if (store.findRunningByBookingId) {
      const row = await store.findRunningByBookingId(bookingId);
      return row?.id ?? null;
    }
    return null;
  }

  private async run<TContext>(
    definition: SagaDefinition<TContext>,
    sagaId: string,
  ): Promise<SagaRunResult<TContext>> {
    const claimed = await this.store.claim(sagaId, this.leaseMs);

    if (!claimed) {
      const existing = await this.store.findById(sagaId);
      return {
        sagaId,
        status: existing?.status ?? "unknown",
        context: (existing?.context ?? {}) as TContext,
      };
    }

    let context = claimed.context as TContext;
    let stepIndex = claimed.current_step;

    try {
      for (; stepIndex < definition.steps.length; stepIndex++) {
        const step = definition.steps[stepIndex]!;
        logger.info("saga_step_executing", {
          sagaId,
          step: step.name,
          stepIndex,
        });

        let partial: Partial<TContext>;
        try {
          partial = await step.execute(context);
        } catch (err) {
          if (err instanceof SagaPauseError) {
            await this.store.markPaused(sagaId, stepIndex + 1, context);
            logger.info("saga_paused", {
              sagaId,
              step: step.name,
              nextStep: stepIndex + 1,
              reason: err.message,
            });

            // Lost-wakeup: webhook already recorded a signal
            const bookingId =
              context &&
              typeof context === "object" &&
              "bookingId" in context
                ? String(
                    (context as { bookingId?: string }).bookingId ?? "",
                  )
                : "";
            if (
              bookingId &&
              this.store.consumeResumeSignal &&
              (await this.store.consumeResumeSignal(bookingId))
            ) {
              logger.info("saga_lost_wakeup_consumed", { sagaId, bookingId });
              // Continue loop from next step without returning
              continue;
            }

            return { sagaId, status: "running", context };
          }
          throw err;
        }

        context = { ...context, ...partial };
        await this.store.updateProgress(sagaId, stepIndex + 1, context);
      }

      await this.store.updateStatus(sagaId, "completed");
      return { sagaId, status: "completed", context };
    } catch (err) {
      logger.error("saga_step_failed", {
        sagaId,
        step: definition.steps[stepIndex]?.name,
        error: err instanceof Error ? err.message : String(err),
      });
      await this.store.updateStatus(sagaId, "compensating");

      for (let i = stepIndex - 1; i >= 0; i--) {
        const step = definition.steps[i]!;
        try {
          logger.info("saga_compensating", { sagaId, step: step.name });
          await step.compensate(context);
        } catch (compErr) {
          logger.error("saga_compensation_failed", {
            sagaId,
            step: step.name,
            error:
              compErr instanceof Error ? compErr.message : String(compErr),
          });
        }
      }

      await this.store.updateStatus(sagaId, "compensated");
      return { sagaId, status: "compensated", context };
    }
  }
}
