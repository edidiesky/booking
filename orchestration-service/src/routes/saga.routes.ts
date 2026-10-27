import { Router } from "express";
import { Pool } from "pg";
import { createSagaController } from "../controllers/saga.controller";
import { validateBody, validateParams } from "../middleware/validate";
import {
  startBookingPaymentSagaSchema,
  bookingIdParamSchema,
  sagaIdParamSchema,
} from "../validators/saga.validators";

export function createSagaRouter(pool: Pool): Router {
  const router = Router();
  const c = createSagaController(pool);

  router.post("/sagas/booking-payment", validateBody(startBookingPaymentSagaSchema), c.startBookingPayment);
  router.get("/sagas/:sagaId", validateParams(sagaIdParamSchema), c.getSaga);

  // Canonical resume path (payment service / monolith webhook use this)
  router.post("/internal/sagas/booking-payment/by-booking/:bookingId/resume", validateParams(bookingIdParamSchema), c.resumeByBooking);
  router.get("/internal/sagas/booking-payment/by-booking/:bookingId", validateParams(bookingIdParamSchema), c.getSagaByBooking);
  // Alias
  router.post("/internal/sagas/resume-by-booking/:bookingId", validateParams(bookingIdParamSchema), c.resumeByBooking);

  return router;
}
