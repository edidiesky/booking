import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware";
import {
  ListMySessionsHandler,
  RevokeSessionHandler,
  LogoutOtherSessionsHandler,
  LogoutAllSessionsHandler,
  AdminListUserSessionsHandler,
  AdminRevokeSessionHandler,
} from "./session.controller";

const router = Router();

router.get("/me/sessions", authenticate, ListMySessionsHandler);
router.delete("/me/sessions/:sessionId", authenticate, RevokeSessionHandler);
router.post(
  "/me/sessions/logout-others",
  authenticate,
  LogoutOtherSessionsHandler,
);
router.post("/me/sessions/logout-all", authenticate, LogoutAllSessionsHandler);

router.get(
  "/admin/users/:userId/sessions",
  authenticate,
  authorize("platform:admin"),
  AdminListUserSessionsHandler,
);
router.delete(
  "/admin/sessions/:sessionId",
  authenticate,
  authorize("platform:admin"),
  AdminRevokeSessionHandler,
);

export default router;
