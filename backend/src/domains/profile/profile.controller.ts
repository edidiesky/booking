import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { AppError } from "../../utils/AppError";
import { profileService } from "./profile.service";

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