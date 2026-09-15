import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { profileService } from "./profile.service";
import { userRepository } from "../auth/auth.repository";
import { profileRepository } from "./profile.repository";

export const GetMyProfileHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const data = await profileService.getMyProfile(req.user.userId);
    res.status(200).json({ success: true, data });
  },
);

export const UpdateMyProfileHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const data = await profileService.updateMyProfile(req.user.userId, req.body);
    res.status(200).json({ success: true, data });
  },
);

export const GetUserProfileHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user || !req.tenantId) throw AppError.unauthorized();
  const { userId } = req.params as { userId: string };

  const targetUser = await userRepository.findById(userId);
  if (!targetUser) throw AppError.notFound("User.");
  if (targetUser.tenant_id !== req.tenantId) {
    throw AppError.forbidden("This user does not belong to your tenant.");
  }

  const profile = await profileRepository.findByUserId(userId);

  res.status(200).json({
    success: true,
    data: {
      id: targetUser.id,
      email: targetUser.email,
      firstName: targetUser.first_name,
      lastName: targetUser.last_name,
      phone: targetUser.phone,
      userType: targetUser.user_type,
      createdAt: targetUser.created_at,
      profile: profile ?? null,
    },
  });
});
