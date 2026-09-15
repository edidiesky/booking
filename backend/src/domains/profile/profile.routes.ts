import { Router } from "express";
import { authenticate, requireTenantMember } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  GetMyProfileHandler,
  GetUserProfileHandler,
  UpdateMyProfileHandler,
} from "./profile.controller";
import { updateProfileSchema } from "./profile.validator";

const router = Router();

router.get("/", authenticate, GetMyProfileHandler);
router.patch(
  "/",
  authenticate,
  validate(updateProfileSchema),
  UpdateMyProfileHandler,
);
router.get("/user/:userId", authenticate, requireTenantMember, GetUserProfileHandler);


export default router;