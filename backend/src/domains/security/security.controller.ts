import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { securityService } from "./security.service";
import { AppError } from "../../utils/AppError";

export const GetSecurityStatusHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const status = await securityService.getStatus(req.user.userId);
  res.status(200).json({ success: true, data: status });
});

export const SetPinHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await securityService.setPin(req.user.userId, req.body);
  res.status(200).json({ success: true, ...result });
});

export const ChangePinHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await securityService.changePin(req.user.userId, req.body);
  res.status(200).json({ success: true, ...result });
});

export const ResetPinHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await securityService.resetPin(req.user.userId, req.body);
  res.status(200).json({ success: true, ...result });
});

const VALID_PURPOSES = ["email_verify", "phone_verify", "two_factor_enable", "two_factor_disable"] as const;
type OtpPurpose = typeof VALID_PURPOSES[number];

function assertPurpose(purpose: string): asserts purpose is OtpPurpose {
  if (!VALID_PURPOSES.includes(purpose as OtpPurpose)) {
    throw AppError.badRequest("Invalid verification purpose.");
  }
}

export const RequestOtpHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { purpose } = req.params as { purpose: string };
  assertPurpose(purpose);
  const result = await securityService.requestOtp(req.user.userId, purpose);
  res.status(200).json({ success: true, ...result });
});

export const VerifyOtpHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { purpose } = req.params as { purpose: string };
  assertPurpose(purpose);
  const result = await securityService.verifyOtp(req.user.userId, purpose, req.body);
  res.status(200).json({ success: true, ...result });
});

export const SetLoginWithPinHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const { enabled } = req.body as { enabled: boolean };
  const result = await securityService.setLoginWithPin(req.user.userId, Boolean(enabled));
  res.status(200).json({ success: true, ...result });
});

export const SetCountryHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await securityService.setCountry(req.user.userId, req.body);
  res.status(200).json({ success: true, ...result });
});