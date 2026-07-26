import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  ListUserNotificationsHandler,
  MarkUserNotificationReadHandler,
  MarkAllUserNotificationsReadHandler,
} from "./user-notification.controller";

const router = Router();

router.get("/",             authenticate, ListUserNotificationsHandler);
router.patch("/:id/read",   authenticate, MarkUserNotificationReadHandler);
router.patch("/read-all",   authenticate, MarkAllUserNotificationsReadHandler);

export default router;