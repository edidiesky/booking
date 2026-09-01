
import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { requirePermission } from "../../middleware/require-permission.middleware";
import {
  CreateInvitationHandler,
  ListInvitationsHandler,
  AcceptInvitationHandler,
  RevokeInvitationHandler,
} from "./invitation.controller";

const router = Router();

router.post(
  "/",
  authenticate,
  requireTenantMember,
  requirePermission("role", "assign"),
  CreateInvitationHandler,
);
router.get(
  "/",
  authenticate,
  requireTenantMember,
  requirePermission("role", "read"),
  ListInvitationsHandler,
);
router.delete(
  "/:email",
  authenticate,
  requireTenantMember,
  requirePermission("role", "revoke"),
  RevokeInvitationHandler,
);

router.post("/accept", AcceptInvitationHandler);

export default router;