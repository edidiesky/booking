import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { authService } from "./auth.service";
import { AppError }    from "../../utils/AppError";

export const InitiateOnboardingHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.initiateOnboarding(
    req.body as Parameters<typeof authService.initiateOnboarding>[0]
  );
  res.status(200).json({ success: true, message: result.message, ...(result.debug ? { debug: result.debug } : {}) });
});

export const ConfirmEmailHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await authService.confirmEmail(req.body as Parameters<typeof authService.confirmEmail>[0]);
  res.status(200).json({ success: true, message: "Email verified. You may now complete registration." });
});

export const RegisterGuestHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.registerGuest(req.body as Parameters<typeof authService.registerGuest>[0]);
  res.status(201).json({ success: true, message: "Account created.", data: result });
});

export const RegisterHostHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.registerHost(req.body as Parameters<typeof authService.registerHost>[0]);
  res.status(201).json({ success: true, message: "Host account and property created.", data: result });
});

export const LoginHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.login(req.body as Parameters<typeof authService.login>[0]);
  res.status(200).json({ success: true, message: "Login successful.", data: result });
});

export const RefreshTokenHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };
  const result = await authService.refreshToken(refreshToken);
  res.status(200).json({ success: true, accessToken: result.accessToken, refreshToken: result.refreshToken });
});

export const LogoutHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const token = req.headers.authorization?.replace("Bearer ", "") ?? "";
  await authService.logout(req.user.userId, token);
  res.status(200).json({ success: true, message: "Logged out successfully." });
});

export const MeHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({ success: true, data: req.user });
});

export const ChangePasswordHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw AppError.unauthorized();
  const result = await authService.changePassword(req.user.userId, req.body);
  res.status(200).json({ success: true, ...result });
});

export const RequestPasswordResetHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };
  const result = await authService.requestPasswordReset(email);
  res.status(200).json({ success: true, message: result.message });
});

export const ConfirmPasswordResetHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await authService.confirmPasswordReset(req.body);
  res.status(200).json({ success: true, message: result.message });
});

export const ResendOtpHandler = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };
  const result = await authService.resendOtp(email);
  res.status(200).json({ success: true, message: result.message, ...(result.debug ? { debug: result.debug } : {}) });
});