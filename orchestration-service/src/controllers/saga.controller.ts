import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { SagaOrchestrator, SagaRunResult } from "../services/SagaOrchestrator";
import { sagaRepository } from "../repositories/saga.repository";
import {
  bookingPaymentSaga,
  BookingPaymentSagaContext,
} from "../bookingPaymentSaga";

/** running -> 202, completed -> 200, failed saga -> upstream 4xx or 502. */
function httpStatusFor(result: SagaRunResult<unknown>): number {
  switch (result.status) {
    case "completed":
      return 200;
    case "running":
      return 202;
    default: {
      const s = result.errorStatus;
      return s && s >= 400 && s < 500 ? s : 502;
    }
  }
}

function body(result: SagaRunResult<unknown>) {
  const failed = !["completed", "running"].includes(result.status);
  return failed ? { ...result, error: result.error ?? "Saga did not complete" } : result;
}

export function createSagaController(pool: Pool) {
  const orchestrator = new SagaOrchestrator(pool);

  return {
    async startBookingPayment(req: Request, res: Response, next: NextFunction) {
      try {
        const key = req.header("Idempotency-Key") ?? undefined;
        const result = await orchestrator.start<BookingPaymentSagaContext>(
          bookingPaymentSaga,
          req.body as BookingPaymentSagaContext,
          { idempotencyKey: key },
        );
        res.status(httpStatusFor(result)).json(body(result));
      } catch (err) {
        next(err);
      }
    },

    async resumeByBooking(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await orchestrator.resumeByBookingId(
          bookingPaymentSaga,
          req.params.bookingId as string,
        );
        if (result.status === "signal_recorded") {
          res.status(202).json(result);
          return;
        }
        // The resume itself succeeded even if the saga ended compensated: the
        // caller (payment-service) inspects `status` to decide on a refund.
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },

    async getSaga(req: Request, res: Response, next: NextFunction) {
      try {
        const row = await sagaRepository.findById(pool, req.params.sagaId as string);
        if (!row) {
          res.status(404).json({ error: "Saga not found" });
          return;
        }
        res.status(200).json({ sagaId: row.id, status: row.status, step: row.current_step, error: row.last_error, context: row.context });
      } catch (err) {
        next(err);
      }
    },

    async getSagaByBooking(req: Request, res: Response, next: NextFunction) {
      try {
        const row = await sagaRepository.findByBookingId(pool, req.params.bookingId as string);
        if (!row) {
          res.status(404).json({ error: "Saga not found" });
          return;
        }
        res.status(200).json({ sagaId: row.id, status: row.status, step: row.current_step, error: row.last_error, context: row.context });
      } catch (err) {
        next(err);
      }
    },
  };
}
