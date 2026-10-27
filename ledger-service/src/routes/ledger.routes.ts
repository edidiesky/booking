import { Router } from "express";
import { Pool } from "pg";
import { createLedgerController } from "../controllers/ledger.controller";
import { validateBody } from "../middleware/validate";
import { releaseEscrowSchema, refundSchema } from "../validators/ledger.validators";

export function createLedgerRouter(pool: Pool): Router {
  const router = Router();
  const controller = createLedgerController(pool);

  router.post(
    "/internal/ledger/release-escrow",
    validateBody(releaseEscrowSchema),
    controller.releaseEscrow,
  );

  router.post(
    "/internal/ledger/refund",
    validateBody(refundSchema),
    controller.refund,
  );

  return router;
}
