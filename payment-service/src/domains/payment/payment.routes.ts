import { Router } from "express";
import { Pool } from "pg";
import { createPaymentController } from "./payment.controller";
import { validateBody, validateParams } from "../../middleware/validate";
import { initiatePaymentSchema, webhookSchema, bookingIdParamSchema, gatewayParamSchema } from "./payment.validator";

export function createPaymentRouter(pool: Pool): Router {
  const router = Router();
  const controller = createPaymentController(pool);

  router.post("/internal/payments/initiate", validateBody(initiatePaymentSchema), controller.initiate);
  router.post("/internal/payments/booking/:bookingId/refund", validateParams(bookingIdParamSchema), controller.refund);
  router.post("/webhooks/:gateway", validateParams(gatewayParamSchema), validateBody(webhookSchema), controller.webhook);

  return router;
}
