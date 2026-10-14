import { Request, Response, NextFunction } from "express";
import { Pool } from "pg";
import { SagaOrchestrator } from "../services/SagaOrchestrator";
import { sagaRepository } from "../repositories/saga.repository";
import {
  bookingPaymentSaga,
  BookingPaymentSagaContext,
} from "../bookingPaymentSaga";

export function createSagaController(pool: Pool) {
  const orchestrator = new SagaOrchestrator(pool);

  return {
    async startBookingPayment(req: Request, res: Response, next: NextFunction) {
      try {
        const result = await orchestrator.start<BookingPaymentSagaContext>(
          bookingPaymentSaga,
          req.body as BookingPaymentSagaContext,
        );
        res.status(202).json(result);
      } catch (err) {
        next(err);
      }
    },

    async resumeByBooking(req: Request, res: Response, next: NextFunction) {
      try {
        const bookingId = req.params.bookingId as string;
        const result = await orchestrator.resumeByBookingId(
          bookingPaymentSaga,
          bookingId,
        );
        if ("status" in result && result.status === "signal_recorded") {
          res.status(202).json(result);
          return;
        }
        res.status(200).json(result);
      } catch (err) {
        next(err);
      }
    },
  };
}
