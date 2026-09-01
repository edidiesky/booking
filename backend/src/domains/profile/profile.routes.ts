import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import {
  GetMyProfileHandler,
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

export default router;