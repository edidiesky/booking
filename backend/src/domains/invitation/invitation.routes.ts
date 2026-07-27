import { Router } from "express";
import { authenticate, requireTenantMember, authorize } from "../../middleware/auth.middleware";
import { CreateInvitationHandler, ListInvitationsHandler, AcceptInvitationHandler, RevokeInvitationHandler } from "./invitation.controller";

const router = Router();

router.post("/",              authenticate, requireTenantMember, authorize("host:admin"), CreateInvitationHandler);
router.get("/",               authenticate, requireTenantMember,                          ListInvitationsHandler);
router.delete("/:email",      authenticate, requireTenantMember, authorize("host:admin"), RevokeInvitationHandler);

// Public, no auth: the invitee doesn't have an account yet.
router.post("/accept",        AcceptInvitationHandler);

export default router;