import { Router } from "express";
import { Pool } from "pg";
import { createLedgerController } from "../controllers/ledger.controller";
import { validateBody } from "../middleware/validate";
import { releaseEscrowSchema } from "../validators/ledger.validators";

export function createLedgerRouter(pool: Pool): Router {
  const router = Router();
  const controller = createLedgerController(pool);
  router.post("/internal/ledger/release-escrow", validateBody(releaseEscrowSchema), controller.releaseEscrow);
  return router;
}
