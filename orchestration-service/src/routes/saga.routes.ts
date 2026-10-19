import { Router } from "express";
import { Pool } from "pg";
import { createSagaController } from "../controllers/saga.controller";
import { validateBody, validateParams } from "../middleware/validate";
import {
  startBookingPaymentSagaSchema,
  bookingIdParamSchema,
} from "../validators/saga.validators";

export function createSagaRouter(pool: Pool): Router {
  const router = Router();
  const controller = createSagaController(pool);

  router.post(
    "/sagas/booking-payment",
    validateBody(startBookingPaymentSagaSchema),
    controller.startBookingPayment,
  );
  // Canonical resume path (payment service uses this)
  router.post(
    "/internal/sagas/booking-payment/by-booking/:bookingId/resume",
    validateParams(bookingIdParamSchema),
    controller.resumeByBooking,
  );
  // Alias
  router.post(
    "/internal/sagas/resume-by-booking/:bookingId",
    validateParams(bookingIdParamSchema),
    controller.resumeByBooking,
  );

  return router;
}
