import { Router } from "express";
import { Pool } from "pg";
import { createBookingController } from "./booking.controller";
import { validateBody, validateParams } from "../../middleware/validate";
import { reserveBookingSchema, bookingIdParamSchema, tenantBodySchema } from "./booking.validator";

export function createBookingRouter(pool: Pool): Router {
  const router = Router();
  const c = createBookingController(pool);
  router.post("/internal/bookings/reserve", validateBody(reserveBookingSchema), c.reserve);
  router.post("/internal/bookings/:bookingId/release", validateParams(bookingIdParamSchema), validateBody(tenantBodySchema), c.release);
  router.post("/internal/bookings/:bookingId/confirm", validateParams(bookingIdParamSchema), validateBody(tenantBodySchema), c.confirm);
  router.get("/internal/bookings/:bookingId", validateParams(bookingIdParamSchema), c.findById);
  router.get("/internal/bookings/:bookingId/history", validateParams(bookingIdParamSchema), c.getHistory);
  return router;
}
