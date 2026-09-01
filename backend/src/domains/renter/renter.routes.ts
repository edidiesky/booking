import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { CreateRenterHandler, ListRentersHandler, GetRenterDetailHandler, ExportTenantRentersHandler } from "./renter.controller";
import { createRenterSchema } from "./renter.validator";
import { requirePermission } from "../../middleware/require-permission.middleware";

const router = Router();
router.post(
  "/",
  authenticate,
  requireTenantMember,
  requirePermission("user", "update"),
  validate(createRenterSchema),
  CreateRenterHandler,
);
router.get(
  "/",
  authenticate,
  requireTenantMember,
  requirePermission("user", "read"),
  ListRentersHandler,
);
router.get(
  "/export",
  authenticate,
  requireTenantMember,
  requirePermission("report", "export"),
  ExportTenantRentersHandler,
);
router.get(
  "/:id",
  authenticate,
  requireTenantMember,
  requirePermission("user", "read"),
  GetRenterDetailHandler,
);

export default router;