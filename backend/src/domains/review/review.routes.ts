import { Router } from "express";
import {
  authenticate,
  requireTenantMember,
} from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  CreateReviewHandler,
  GetRoomTypeReviewsHandler,
  GetTenantReviewsHandler,
  GetTenantReviewStatsHandler,
  RespondToReviewHandler,
  MarkHelpfulHandler,
} from "./review.controller";
import {
  createReviewSchema,
  respondSchema,
  helpfulSchema,
} from "./review.validator";

const router = Router();
router.post(
  "/",
  authenticate,
  validate(createReviewSchema),
  CreateReviewHandler,
);
 // public
router.get("/room-types/:roomTypeId", GetRoomTypeReviewsHandler);
router.get(
  "/tenant",
  authenticate,
  requireTenantMember,
  GetTenantReviewsHandler,
);
router.get(
  "/tenant/stats",
  authenticate,
  requireTenantMember,
  GetTenantReviewStatsHandler,
);
router.post(
  "/:reviewId/respond",
  authenticate,
  requireTenantMember,
  validate(respondSchema),
  RespondToReviewHandler,
);
router.post("/:reviewId/helpful", validate(helpfulSchema), MarkHelpfulHandler); 

export default router;