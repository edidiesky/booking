import { Pool } from "pg";
import { SagaStatus } from "../repositories/saga.repository";
import { SagaStore, sagaStoreFromPool } from "../repositories/saga.store";
import { logger } from "../logger";

export class SagaPauseError extends Error {
  constructor(
    reason: string,
    public readonly partial?: Record<string, unknown>,
  ) {
    super(`Saga paused: ${reason}`);
    this.name = "SagaPauseError";
  }
}

/** 
 * Runtime meta passed into every step execute/compensate.
 */
export interface StepMeta {
  sagaId: string;
}

export interface SagaStep<TContext> {
  name: string;
  forwardOnly?: boolean;
  execute(context: TContext, meta: StepMeta): Promise<Partial<TContext>>;
  compensate(context: TContext, meta: StepMeta): Promise<void>;
}

export interface SagaDefinition<TContext> {
  sagaType: string;
  steps: SagaStep<TContext>[];
}

export interface SagaRunResult<TContext> {
  sagaId: string;
  status: SagaStatus | "unknown";
  context: TContext;
  error?: string;
  errorStatus?: number;
}

export interface StartOptions {
  idempotencyKey?: string;
}

const LEASE_MS = 60_000;

function isPool(value: Pool | SagaStore): value is Pool {
  return typeof (value as Pool).query === "function";
}

function bookingIdFrom(context: unknown): string | undefined {
  if (context && typeof context === "object" && "bookingId" in context) {
    const v = (context as { bookingId?: string }).bookingId;
    return v ? String(v) : undefined;
  }
  return undefined;
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
    options: StartOptions = {},
  ): Promise<SagaRunResult<TContext>> {
    const inserted = await this.store.insert(
      definition.sagaType,
      initialContext,
      initialContext.bookingId,
      options.idempotencyKey,
    );
    const sagaId =
      typeof inserted === "string" ? inserted : (inserted as { id: string }).id;
    const created =
      typeof inserted === "string"
        ? true
        : Boolean((inserted as { created?: boolean }).created);

    logger.info("saga_started", {
      event: "saga_started",
      sagaId,
      created,
      sagaType: definition.sagaType,
      bookingId: initialContext.bookingId,
      idempotencyKey: options.idempotencyKey,
      totalSteps: definition.steps.length,
      steps: definition.steps.map((s) => s.name),
    });

    // Idempotent replay: existing completed/running saga for same key
    if (!created) {
      const existing = await this.store.findById(sagaId);
      if (existing) {
        logger.info("saga_start_idempotent_replay", {
          event: "saga_start_idempotent_replay",
          sagaId,
          status: existing.status,
        });
        return {
          sagaId,
          status: existing.status,
          context: existing.context as TContext,
        };
      }
    }

    return this.run(definition, sagaId);
  }

  async resume<TContext>(
    definition: SagaDefinition<TContext>,
    sagaId: string,
  ): Promise<SagaRunResult<TContext>> {
    logger.info("saga_resume_requested", {
      event: "saga_resume_requested",
      sagaId,
      sagaType: definition.sagaType,
    });
    return this.run(definition, sagaId);
  }

  async resumeByBookingId<TContext>(
    definition: SagaDefinition<TContext>,
    bookingId: string,
  ): Promise<
    SagaRunResult<TContext> | { status: "signal_recorded"; bookingId: string }
  > {
    const saga = await this.findRunningId(bookingId);
    if (!saga) {
      if (this.store.recordResumeSignal) {
        await this.store.recordResumeSignal(bookingId);
      }
      logger.info("saga_resume_signal_recorded", {
        event: "saga_resume_signal_recorded",
        bookingId,
        reason: "no_running_saga_claimable",
      });
      return { status: "signal_recorded", bookingId };
    }
    logger.info("saga_resume_by_booking", {
      event: "saga_resume_by_booking",
      sagaId: saga,
      bookingId,
      sagaType: definition.sagaType,
    });
    return this.run(definition, saga);
  }

  /**
   * Pause timeout: treat as failure at the paused step and run compensation.
   * Claim first so this never races a concurrent webhook resume.
   */
  async expire<TContext>(
    definition: SagaDefinition<TContext>,
    sagaId: string,
    reason: string,
  ): Promise<SagaRunResult<TContext>> {
    const meta: StepMeta = { sagaId };
    const claimed = await this.store.claim(sagaId, this.leaseMs);

    if (!claimed) {
      const existing = await this.store.findById(sagaId);
      logger.info("saga_expire_claim_miss", {
        event: "saga_expire_claim_miss",
        sagaId,
        status: existing?.status ?? "unknown",
      });
      return {
        sagaId,
        status: existing?.status ?? "unknown",
        context: (existing?.context ?? {}) as TContext,
      };
    }

    // Only expire while still waiting (paused / running at wait point)
    const status = (claimed as { status?: string }).status;
    if (status && status !== "running" && status !== "paused") {
      logger.info("saga_expire_skipped_wrong_status", {
        event: "saga_expire_skipped_wrong_status",
        sagaId,
        status,
      });
      return {
        sagaId,
        status: status as SagaStatus,
        context: claimed.context as TContext,
      };
    }

    let context = claimed.context as TContext;
    // current_step is the *next* step after pause (markPaused stored stepIndex+1)
    const stepIndex = Math.max(0, claimed.current_step - 1);

    logger.info("saga_expire_started", {
      event: "saga_expire_started",
      sagaId,
      reason,
      stepIndex,
      step: definition.steps[stepIndex]?.name,
    });

    await this.store.updateStatus(sagaId, "compensating");

    for (let i = stepIndex; i >= 0; i--) {
      const step = definition.steps[i];
      if (!step) continue;
      try {
        logger.info("saga_compensating", {
          event: "saga_compensating",
          sagaId,
          step: step.name,
          stepIndex: i,
          reason: "pause_timeout",

        });
        await step.compensate(context, meta);
      } catch (compErr) {
        logger.error("saga_compensation_failed", {
          event: "saga_compensation_failed",
          sagaId,
          step: step.name,
          error: compErr instanceof Error ? compErr.message : String(compErr),
        });
      }
    }

    await this.store.updateStatus(sagaId, "compensated");
    logger.info("saga_expired_compensated", {
      event: "saga_expired_compensated",
      sagaId,
      reason,
    });

    return {
      sagaId,
      status: "compensated",
      context,
      error: reason,
      errorStatus: 408,
    };
  }

  private async findRunningId(bookingId: string): Promise<string | null> {
    const store = this.store as SagaStore & {
      findRunningByBookingId?: (id: string) => Promise<{ id: string } | null>;
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
    const meta: StepMeta = { sagaId };
    const claimed = await this.store.claim(sagaId, this.leaseMs);

    if (!claimed) {
      const existing = await this.store.findById(sagaId);
      logger.info("saga_claim_miss", {
        event: "saga_claim_miss",
        sagaId,
        status: existing?.status ?? "unknown",
        bookingId: bookingIdFrom(existing?.context),
      });
      return {
        sagaId,
        status: existing?.status ?? "unknown",
        context: (existing?.context ?? {}) as TContext,
      };
    }

    let context = claimed.context as TContext;
    let stepIndex = claimed.current_step;

    logger.info("saga_run_claimed", {
      event: "saga_run_claimed",
      sagaId,
      sagaType: definition.sagaType,
      bookingId: bookingIdFrom(context),
      fromStep: stepIndex,
      totalSteps: definition.steps.length,
      status: (claimed as { status?: string }).status,
    });

    try {
      for (; stepIndex < definition.steps.length; stepIndex++) {
        const step = definition.steps[stepIndex]!;
        const stepStarted = Date.now();
        logger.info("saga_step_executing", {
          event: "saga_step_executing",
          sagaId,
          sagaType: definition.sagaType,
          bookingId: bookingIdFrom(context),
          step: step.name,
          stepIndex,
          totalSteps: definition.steps.length,
        });

        let partial: Partial<TContext> = {};
        try {
          partial = await step.execute(context, meta);
        } catch (err) {
          if (err instanceof SagaPauseError) {
            const pausePartial = (err.partial ?? {}) as Partial<TContext>;
            context = { ...context, ...pausePartial };
            await this.store.markPaused(sagaId, stepIndex + 1, context);
            logger.info("saga_paused", {
              event: "saga_paused",
              sagaId,
              sagaType: definition.sagaType,
              bookingId: bookingIdFrom(context),
              step: step.name,
              stepIndex,
              nextStep: stepIndex + 1,
              reason: err.message,
              durationMs: Date.now() - stepStarted,
              contextKeys: Object.keys(pausePartial as object),
            });

            const bid = bookingIdFrom(context) ?? "";
            if (
              bid &&
              this.store.consumeResumeSignal &&
              (await this.store.consumeResumeSignal(bid))
            ) {
              logger.info("saga_lost_wakeup_consumed", {
                event: "saga_lost_wakeup_consumed",
                sagaId,
                bookingId: bid,
              });
              continue;
            }

            return { sagaId, status: "running", context };
          }
          throw err;
        }

        context = { ...context, ...partial };
        await this.store.updateProgress(sagaId, stepIndex + 1, context);
        logger.info("saga_step_completed", {
          event: "saga_step_completed",
          sagaId,
          sagaType: definition.sagaType,
          bookingId: bookingIdFrom(context),
          step: step.name,
          stepIndex,
          nextStep: stepIndex + 1,
          durationMs: Date.now() - stepStarted,
          contextKeys: Object.keys(partial as object),
        });
      }

      await this.store.updateStatus(sagaId, "completed");
      logger.info("saga_completed", {
        event: "saga_completed",
        sagaId,
        sagaType: definition.sagaType,
        bookingId: bookingIdFrom(context),
        totalSteps: definition.steps.length,
      });
      return { sagaId, status: "completed", context };
    } catch (err) {
      const failedStep = definition.steps[stepIndex]?.name;
      logger.error("saga_step_failed", {
        event: "saga_step_failed",
        sagaId,
        sagaType: definition.sagaType,
        bookingId: bookingIdFrom(context),
        step: failedStep,
        stepIndex,
        error: err instanceof Error ? err.message : String(err),
        upstreamStatus: (err as { upstreamStatus?: number })?.upstreamStatus,
      });
      await this.store.updateStatus(sagaId, "compensating");
      logger.info("saga_compensation_started", {
        event: "saga_compensation_started",
        sagaId,
        bookingId: bookingIdFrom(context),
        failedStep,
        stepsToCompensate: stepIndex,
      });

      for (let i = stepIndex - 1; i >= 0; i--) {
        const step = definition.steps[i]!;
        const compStarted = Date.now();
        try {
          logger.info("saga_compensating", {
            event: "saga_compensating",
            sagaId,
            bookingId: bookingIdFrom(context),
            step: step.name,
            stepIndex: i,
          });
          await step.compensate(context, meta);
          logger.info("saga_compensate_completed", {
            event: "saga_compensate_completed",
            sagaId,
            step: step.name,
            stepIndex: i,
            durationMs: Date.now() - compStarted,
          });
        } catch (compErr) {
          logger.error("saga_compensation_failed", {
            event: "saga_compensation_failed",
            sagaId,
            step: step.name,
            stepIndex: i,
            error: compErr instanceof Error ? compErr.message : String(compErr),
          });
        }
      }

      await this.store.updateStatus(sagaId, "compensated");
      logger.info("saga_compensated", {
        event: "saga_compensated",
        sagaId,
        sagaType: definition.sagaType,
        bookingId: bookingIdFrom(context),
        failedStep,
      });
      return { sagaId, status: "compensated", context };
    }
  }
}
