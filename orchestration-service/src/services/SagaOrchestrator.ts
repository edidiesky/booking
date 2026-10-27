import { Pool } from "pg";
import { SagaStatus } from "../repositories/saga.repository";
import { SagaStore, sagaStoreFromPool } from "../repositories/saga.store";
import { logger } from "../logger";


/**
 * Thrown by a step to park the saga until an external event (e.g. payment
 * webhook) resumes it. `partial` is merged into the saga context BEFORE
 * parking, so data produced by the pausing step (redirectUrl, paymentId...)
 * is persisted and returned to the caller.
 */
export class SagaPauseError extends Error {
  constructor(
    reason: string,
    public readonly partial?: Record<string, unknown>,
  ) {
    super(`Saga paused: ${reason}`);
    this.name = "SagaPauseError";
  }
}

export interface StepMeta {
  sagaId: string;
}

export interface SagaStep<TContext> {
  name: string;
  execute(context: TContext, meta: StepMeta): Promise<Partial<TContext>>;
  /** MUST be idempotent: it can be retried after a crash or a transient failure. */
  compensate(context: TContext, meta: StepMeta): Promise<void>;
  /**
   * Steps after the point of no return (money has been taken). On a transient
   * error they are retried forward with backoff instead of being compensated.
   */
  forwardOnly?: boolean;
  /** forwardOnly steps: what to do on a permanent (non-retryable) error. */
  onPermanentFailure?: "compensate" | "fail";
  /**
   * Only for steps that pause. Called when the pause times out, BEFORE compensating, to ask the
   * source of truth what really happened. Returning "resume" means the awaited event DID happen
   * (e.g. the payment succeeded but the resume call was lost) so the saga continues forward
   * instead of unwinding - otherwise a guest who paid would be refunded.
   */
  onPauseTimeout?(context: TContext, meta: StepMeta): Promise<"resume" | "compensate">;
}

export interface SagaDefinition<TContext> {
  sagaType: string;
  steps: SagaStep<TContext>[];
}

export interface SagaRunResult<TContext> {
  sagaId: string;
  status: SagaStatus | "unknown";
  context: TContext;
  /** Message of the failure that ended / is being recovered by the saga. */
  error?: string;
  /** HTTP status of the upstream failure, when there was one. */
  errorStatus?: number;
  /** True when the call was a no-op because the saga already finished. */
  idempotent?: boolean;
}

export type ResumeResult<TContext> =
  | SagaRunResult<TContext>
  | { status: "signal_recorded"; bookingId: string };

const LEASE_MS = 60_000;
const MAX_COMPENSATION_ATTEMPTS = Number(process.env.SAGA_MAX_COMPENSATION_ATTEMPTS ?? 6);
const MAX_FORWARD_ATTEMPTS = Number(process.env.SAGA_MAX_FORWARD_ATTEMPTS ?? 8);

export function backoffMs(attempt: number): number {
  return Math.min(5_000 * 2 ** Math.max(attempt - 1, 0), 5 * 60_000);
}

export function isTransientError(err: unknown): boolean {
  return (err as { transient?: boolean } | null)?.transient === true;
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function errStatus(err: unknown): number | undefined {
  const s = (err as { upstreamStatus?: number } | null)?.upstreamStatus;
  return typeof s === "number" ? s : undefined;
}

const TERMINAL: ReadonlySet<string> = new Set(["completed", "compensated", "failed"]);

export class SagaOrchestrator {
  private readonly store: SagaStore;
  private readonly leaseMs: number;

  constructor(poolOrStore: Pool | SagaStore, leaseMs: number = LEASE_MS) {
    this.store =
      typeof (poolOrStore as Pool).connect === "function"
        ? sagaStoreFromPool(poolOrStore as Pool)
        : (poolOrStore as SagaStore);
    this.leaseMs = leaseMs;
  }

  async start<TContext extends { bookingId?: string }>(
    definition: SagaDefinition<TContext>,
    initialContext: TContext,
    options: { idempotencyKey?: string } = {},
  ): Promise<SagaRunResult<TContext>> {
    const { id, created } = await this.store.insert(
      definition.sagaType,
      initialContext,
      initialContext.bookingId,
      options.idempotencyKey,
    );
    if (!created) {
      // Same start request replayed: report the existing saga, never run it twice.
      const existing = await this.store.findById(id);
      return {
        sagaId: id,
        status: existing?.status ?? "unknown",
        context: (existing?.context ?? initialContext) as TContext,
        error: existing?.last_error ?? undefined,
        idempotent: true,
      };
    }
    return (await this.execute(definition, id)).result;
  }

  /** Re-drive a saga (sweeper: expired lease / scheduled retry). */
  async resume<TContext>(
    definition: SagaDefinition<TContext>,
    sagaId: string,
  ): Promise<SagaRunResult<TContext>> {
    return (await this.execute(definition, sagaId)).result;
  }

  /**
   * Webhook entry point. Safe to call any number of times:
   *  - saga already finished        -> reports its terminal state (no signal, no rerun)
   *  - saga busy (lease held)       -> records a signal; the running saga consumes it on pause
   *  - saga parked                  -> claims and continues
   */
  async resumeByBookingId<TContext>(
    definition: SagaDefinition<TContext>,
    bookingId: string,
  ): Promise<ResumeResult<TContext>> {
    const saga = await this.store.findByBookingId(bookingId);
    if (!saga) {
      await this.store.recordResumeSignal(bookingId);
      return { status: "signal_recorded", bookingId };
    }
    if (TERMINAL.has(saga.status)) {
      return {
        sagaId: saga.id,
        status: saga.status,
        context: saga.context as TContext,
        error: saga.last_error ?? undefined,
        idempotent: true,
      };
    }

    const { result, claimed } = await this.execute(definition, saga.id);
    if (!claimed && result.status === "running") {
      await this.store.recordResumeSignal(bookingId);
      return { status: "signal_recorded", bookingId };
    }
    return result;
  }

  /**
   * Pause timeout: compensate a saga parked longer than allowed. Claims first,
   * so it cannot race a webhook that is resuming the same saga.
   */
  async expire<TContext>(
    definition: SagaDefinition<TContext>,
    sagaId: string,
    reason: string,
  ): Promise<SagaRunResult<TContext> | null> {
    const claimed = await this.store.claim(sagaId, this.leaseMs);
    if (!claimed) return null;
    const context = claimed.context as TContext;

    if (claimed.status === "compensating") {
      return this.compensate(
        definition, sagaId, context,
        claimed.compensation_cursor ?? claimed.current_step - 1,
        claimed.compensation_attempts, reason,
      );
    }

    const pausedStep = definition.steps[claimed.current_step - 1];
    if (pausedStep?.onPauseTimeout) {
      let decision: "resume" | "compensate";
      try {
        decision = await pausedStep.onPauseTimeout(context, { sagaId });
      } catch (err) {
        // Cannot verify: do NOT compensate on a guess. Park again and retry after the next timeout.
        logger.error("saga_pause_timeout_check_failed", { sagaId, step: pausedStep.name, error: errMessage(err) });
        await this.store.markPaused(sagaId, claimed.current_step, context);
        return null;
      }
      if (decision === "resume") {
        logger.warn("saga_pause_timeout_resuming", { sagaId, step: pausedStep.name });
        await this.store.markPaused(sagaId, claimed.current_step, context); // release lease
        return (await this.execute(definition, sagaId)).result;
      }
    }

    await this.store.beginCompensation(sagaId, reason, claimed.current_step - 1);
    return this.compensate(definition, sagaId, context, claimed.current_step - 1, claimed.compensation_attempts, reason);
  }

  private async execute<TContext>(
    definition: SagaDefinition<TContext>,
    sagaId: string,
  ): Promise<{ result: SagaRunResult<TContext>; claimed: boolean }> {
    const claimed = await this.store.claim(sagaId, this.leaseMs);

    if (!claimed) {
      const existing = await this.store.findById(sagaId);
      return {
        claimed: false,
        result: {
          sagaId,
          status: existing?.status ?? "unknown",
          context: (existing?.context ?? {}) as TContext,
          error: existing?.last_error ?? undefined,
        },
      };
    }

    let context = claimed.context as TContext;

    // A saga that crashed mid-compensation must keep compensating, never run forward.
    if (claimed.status === "compensating") {
      const cursor = claimed.compensation_cursor ?? claimed.current_step - 1;
      const result = await this.compensate(
        definition, sagaId, context, cursor, claimed.compensation_attempts, "resumed compensation",
      );
      return { claimed: true, result };
    }

    let stepIndex = claimed.current_step;

    for (; stepIndex < definition.steps.length; stepIndex++) {
      const step = definition.steps[stepIndex]!;
      await this.store.renewLease(sagaId, this.leaseMs); // heartbeat per step
      logger.info("saga_step_executing", { sagaId, step: step.name, stepIndex });

      let partial: Partial<TContext>;
      try {
        partial = await step.execute(context, { sagaId });
      } catch (err) {
        if (err instanceof SagaPauseError) {
          if (err.partial) context = { ...context, ...(err.partial as Partial<TContext>) };
          await this.store.markPaused(sagaId, stepIndex + 1, context);
          logger.info("saga_paused", {
            sagaId, step: step.name, nextStep: stepIndex + 1, reason: err.message,
          });

          // Lost-wakeup guard: the webhook may have arrived while we were still running.
          const bookingId = (context as { bookingId?: string } | null)?.bookingId;
          if (bookingId && (await this.store.consumeResumeSignal(bookingId))) {
            const reclaimed = await this.store.claim(sagaId, this.leaseMs);
            if (!reclaimed) {
              // Someone else (a concurrent resume) already took over.
              return { claimed: true, result: { sagaId, status: "running", context } };
            }
            logger.info("saga_lost_wakeup_consumed", { sagaId, bookingId });
            continue; // for-loop advances to stepIndex + 1
          }
          return { claimed: true, result: { sagaId, status: "running", context } };
        }

        const result = await this.handleStepFailure(
          definition, sagaId, context, stepIndex, claimed.forward_attempts, err,
        );
        return { claimed: true, result };
      }

      context = { ...context, ...partial };
      await this.store.updateProgress(sagaId, stepIndex + 1, context);
    }

    await this.store.updateStatus(sagaId, "completed");
    return { claimed: true, result: { sagaId, status: "completed", context } };
  }

  private async handleStepFailure<TContext>(
    definition: SagaDefinition<TContext>,
    sagaId: string,
    context: TContext,
    stepIndex: number,
    previousForwardAttempts: number,
    err: unknown,
  ): Promise<SagaRunResult<TContext>> {
    const step = definition.steps[stepIndex]!;
    const message = errMessage(err);
    const status = errStatus(err);
    logger.error("saga_step_failed", {
      sagaId, step: step.name, error: message, upstreamStatus: status,
    });

    if (step.forwardOnly) {
      if (isTransientError(err)) {
        const attempts = previousForwardAttempts + 1;
        if (attempts >= MAX_FORWARD_ATTEMPTS) {
          await this.store.updateStatus(sagaId, "failed", `needs manual review: ${message}`);
          logger.error("saga_forward_retries_exhausted", { sagaId, step: step.name });
          return { sagaId, status: "failed", context, error: message, errorStatus: status };
        }
        await this.store.scheduleForwardRetry(sagaId, stepIndex, context, attempts, message, backoffMs(attempts));
        logger.warn("saga_forward_retry_scheduled", { sagaId, step: step.name, attempts });
        return { sagaId, status: "running", context, error: message, errorStatus: status };
      }
      if (step.onPermanentFailure === "fail") {
        await this.store.updateStatus(sagaId, "failed", `needs manual review: ${message}`);
        logger.error("saga_permanent_failure_needs_review", { sagaId, step: step.name });
        return { sagaId, status: "failed", context, error: message, errorStatus: status };
      }
    }

    await this.store.beginCompensation(sagaId, message, stepIndex - 1);
    const result = await this.compensate(definition, sagaId, context, stepIndex - 1, 0, message);
    return { ...result, errorStatus: status };
  }

  /**
   * Compensate steps [cursor .. 0] in reverse. The cursor is persisted after each
   * success, so a retry never repeats a compensation that already succeeded.
   */
  private async compensate<TContext>(
    definition: SagaDefinition<TContext>,
    sagaId: string,
    context: TContext,
    fromIndex: number,
    attempts: number,
    reason: string,
  ): Promise<SagaRunResult<TContext>> {
    for (let i = fromIndex; i >= 0; i--) {
      const step = definition.steps[i]!;
      try {
        await this.store.renewLease(sagaId, this.leaseMs);
        logger.info("saga_compensating", { sagaId, step: step.name });
        await step.compensate(context, { sagaId });
        await this.store.saveCompensationCursor(sagaId, i - 1);
      } catch (compErr) {
        const message = errMessage(compErr);
        const next = attempts + 1;
        logger.error("saga_compensation_failed", { sagaId, step: step.name, error: message, attempt: next });
        if (next >= MAX_COMPENSATION_ATTEMPTS) {
          await this.store.updateStatus(sagaId, "failed", `compensation of ${step.name} failed: ${message}`);
          return { sagaId, status: "failed", context, error: `compensation of ${step.name} failed: ${message}` };
        }
        await this.store.scheduleCompensationRetry(sagaId, next, message, backoffMs(next));
        return { sagaId, status: "compensating", context, error: reason };
      }
    }

    await this.store.updateStatus(sagaId, "compensated", reason);
    return { sagaId, status: "compensated", context, error: reason };
  }
}
