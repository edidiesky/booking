import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { GetMyNotificationsHandler, GetTenantNotificationsHandler } from "./notification.controller";

const router = Router();
router.get("/tenant", authenticate, requireTenantMember, GetTenantNotificationsHandler);
router.get("/me",     authenticate,                      GetMyNotificationsHandler);

export default router;