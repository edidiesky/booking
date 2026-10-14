import { Router } from "express";
import { Pool } from "pg";
import { createBookingController } from "./booking.controller";
import { validateBody, validateParams } from "../../middleware/validate";
import { reserveBookingSchema, bookingIdParamSchema } from "./booking.validator";

export function createBookingRouter(pool: Pool): Router {
  const router = Router();
  const controller = createBookingController(pool);
  router.post("/internal/bookings/reserve", validateBody(reserveBookingSchema), controller.reserve);
  router.post("/internal/bookings/:bookingId/release", validateParams(bookingIdParamSchema), controller.release);
  router.post("/internal/bookings/:bookingId/confirm", validateParams(bookingIdParamSchema), controller.confirm);
  router.get("/internal/bookings/:bookingId", validateParams(bookingIdParamSchema), controller.findById);
  router.get("/internal/bookings/:bookingId/history", validateParams(bookingIdParamSchema), controller.getHistory);
  return router;
}
