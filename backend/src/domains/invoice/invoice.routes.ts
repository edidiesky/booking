import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { GetGuestInvoiceHandler, GetHostStatementHandler } from "./invoice.controller";
import { requirePermission } from "../../middleware/require-permission.middleware";

const router = Router();

router.get("/guest/:bookingId", authenticate, GetGuestInvoiceHandler);
router.get(
  "/host/:bookingId",
  authenticate,
  requireTenantMember,
  requirePermission("report", "read"),
  GetHostStatementHandler,
);

export default router;