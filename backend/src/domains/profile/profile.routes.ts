import asyncHandler from "express-async-handler";
import { Request, Response, Router } from "express";
import Joi from "joi";
import { profileRepository } from "./profile.repository";
import { authenticate }      from "../../middleware/auth.middleware";
import { validate }          from "../../middleware/validate.middleware";
import { AppError }          from "../../utils/AppError";
import { auditRepository }   from "../audit/audit.repository";

const updateProfileSchema = Joi.object({
  displayName:  Joi.string().min(2).max(100).optional(),
  bio:          Joi.string().max(500).optional(),
  avatarUrl:    Joi.string().uri().optional(),
  address: Joi.object({
    street:  Joi.string().optional(),
    city:    Joi.string().optional(),
    state:   Joi.string().optional(),
    country: Joi.string().optional(),
  }).optional(),
  preferences: Joi.object().unknown(true).optional(),
});

const GetMyProfileHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();

  const profile = await profileRepository.findByUserId(req.user.userId);
  if (!profile) throw AppError.notFound("Profile not found.");

  res.status(200).json({ success: true, data: profile });
});

const UpdateMyProfileHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();

  const body = req.body as {
    displayName?:  string;
    bio?:          string;
    avatarUrl?:    string;
    address?:      Record<string, string>;
    preferences?:  Record<string, unknown>;
  };

  const updated = await profileRepository.update(req.user.userId, {
    display_name: body.displayName,
    bio:          body.bio,
    avatar_url:   body.avatarUrl,
    address:      body.address,
    preferences:  body.preferences,
  });

  if (!updated) throw AppError.notFound("Profile not found.");

  await auditRepository.log({
    action:     "updated",
    resource:   "profile",
    resourceId: req.user.userId,
    userId:     req.user.userId,
    newValue:   body as Record<string, unknown>,
  });

  res.status(200).json({ success: true, data: updated });
});

const router = Router();
router.get("/",  authenticate, GetMyProfileHandler);
router.patch("/", authenticate, validate(updateProfileSchema), UpdateMyProfileHandler);

export default router;
