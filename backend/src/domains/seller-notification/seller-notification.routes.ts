import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import {
  ListSellerNotificationsHandler,
  GetUnreadCountHandler,
  MarkNotificationReadHandler,
  MarkAllNotificationsReadHandler,
} from "./seller.notification.controller";

const router = Router();

router.get("/",                authenticate, requireTenantMember, ListSellerNotificationsHandler);
router.get("/unread-count",    authenticate, requireTenantMember, GetUnreadCountHandler);
router.patch("/:id/read",      authenticate, requireTenantMember, MarkNotificationReadHandler);
router.patch("/read-all",      authenticate, requireTenantMember, MarkAllNotificationsReadHandler);

export default router;