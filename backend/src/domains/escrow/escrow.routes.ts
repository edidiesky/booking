import { Router } from "express";
import {
  authenticate,
  requireTenantMember,
} from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/require-permission.middleware";
import {
  ExportTenantEscrowHandler,
  GetEscrowByBookingHandler,
  GetTenantEscrowHandler,
  GetTenantEscrowStatsHandler,
} from "./escrow.controller";
import { validate } from "../../middleware/validate.middleware";
import { tenantEscrowQuerySchema } from "./escrow.validator";

const router = Router();

router.get(
  "/",
  authenticate,
  requireTenantMember,
  requirePermission("escrow", "read"),
  validate(tenantEscrowQuerySchema, "query"),
  GetTenantEscrowHandler,
);
router.get(
  "/stats",
  authenticate,
  requireTenantMember,
  requirePermission("escrow", "read"),
  GetTenantEscrowStatsHandler,
);
router.get(
  "/export",
  authenticate,
  requireTenantMember,
  requirePermission("report", "export"),
  ExportTenantEscrowHandler,
);
router.get(
  "/booking/:bookingId",
  authenticate,
  requireTenantMember,
  requirePermission("escrow", "read"),
  GetEscrowByBookingHandler,
);
export default router;
