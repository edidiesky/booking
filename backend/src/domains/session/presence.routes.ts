import { Router } from "express";
import asyncHandler from "express-async-handler";
import { AppError } from "../../utils/AppError";
import { authenticate } from "../../middleware/auth.middleware";
import { getPresenceRepository } from "./presence.instance";

export function createPresenceRouter(): Router {
  const router = Router();

  router.post(
    "/me/presence/heartbeat",
    authenticate,
    asyncHandler(async (req, res) => {
      if (!req.sessionId) throw AppError.unauthorized();
      await getPresenceRepository().heartbeat(req.sessionId);
      res.status(200).json({ success: true });
    }),
  );

  // Optional SSE — only if createPresenceSSEHandler exists
  // router.get(
  //   "/me/presence/stream",
  //   authenticate,
  //   createPresenceSSEHandler(getPresenceEngine()),
  // );

  return router;
}