import asyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { authService, SessionDeviceMeta } from "./auth.service";
import { AppError } from "../../utils/AppError";
import { extractDeviceInfo } from "../../utils/deviceInfo";

function toDeviceType(device: string): SessionDeviceMeta["deviceType"] {
  const d = device.toLowerCase();
  if (d === "mobile") return "mobile";
  if (d === "tablet") return "tablet";
  if (d === "desktop") return "desktop";
  return "unknown";
}

const NON_GEO_LOCATIONS = new Set(["Unknown Location", "Local Network"]);

function knownOrNull(value: string): string | null {
  const v = value.trim();
  return !v || v.toLowerCase().startsWith("unknown") ? null : v;
}

function toSessionDeviceMeta(
  info: Awaited<ReturnType<typeof extractDeviceInfo>>,
): SessionDeviceMeta {
  const parts = NON_GEO_LOCATIONS.has(info.location)
    ? []
    : info.location.split(",").map((s) => s.trim()).filter(Boolean);
  const city = parts.length >= 2 ? parts[0] : null;
  const country = parts.length >= 1 ? parts[parts.length - 1] : null;

  const browser = knownOrNull(info.browser);
  const os = knownOrNull(info.os);
  const deviceLabel =
    browser && os ? `${browser} on ${os}` : (browser ?? os ?? "Unknown device");

  return {
    deviceLabel,
    deviceType: toDeviceType(info.device),
    os,
    browser,
    ipAddress: info.ipAddress,
    city,
    country,
  };
}

export const InitiateOnboardingHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await authService.initiateOnboarding(
      req.body as Parameters<typeof authService.initiateOnboarding>[0],
    );
    res.status(200).json({
      success: true,
      message: result.message,
      ...(result.debug ? { debug: result.debug } : {}),
    });
  },
);

export const RegisterGuestHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const device = toSessionDeviceMeta(await extractDeviceInfo(req));
    const result = await authService.registerGuest(
      req.body as Parameters<typeof authService.registerGuest>[0],
      device,
    );
    res.status(201).json({
      success: true,
      message: "Account created.",
      data: result,
    });
  },
);

export const RegisterHostHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const device = toSessionDeviceMeta(await extractDeviceInfo(req));
    const result = await authService.registerHost(
      req.body as Parameters<typeof authService.registerHost>[0],
      device,
    );
    res.status(201).json({
      success: true,
      message: "Host account and property created.",
      data: result,
    });
  },
);

export const VerifyTwoFactorLoginHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { challengeToken, code } = req.body as {
      challengeToken: string;
      code: string;
    };
    const device = toSessionDeviceMeta(await extractDeviceInfo(req));
    const result = await authService.verifyTwoFactorLogin(
      challengeToken,
      code,
      device,
    );
    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  },
);

export const GoogleOAuthHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { code, codeVerifier } = req.body as {
      code: string;
      codeVerifier: string;
    };
    const device = toSessionDeviceMeta(await extractDeviceInfo(req));
    const result = await authService.loginWithGoogle(
      code,
      codeVerifier,
      device,
    );
    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result,
    });
  },
);

export const VerifyLoginEmailOtpHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email, code } = req.body as { email: string; code: string };
    const device = toSessionDeviceMeta(await extractDeviceInfo(req));
    const tokens = await authService.verifyLoginEmailOtp(email, code, device);

    // Prefer same envelope as other login handlers (frontend often expects data.*)
    res.status(200).json({
      success: true,
      message: "Login successful.",
      data: tokens,
    });
  },
);

export const ConfirmEmailHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await authService.confirmEmail(
      req.body as Parameters<typeof authService.confirmEmail>[0],
    );
    res.status(200).json({
      success: true,
      message: "Email verified. You may now complete registration.",
    });
  },
);


export const LoginHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await authService.login(
      req.body as Parameters<typeof authService.login>[0],
    );
    res
      .status(200)
      .json({ success: true, message: "Login successful.", data: result });
  },
);

export const RefreshTokenHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as { refreshToken: string };
    const result = await authService.refreshToken(refreshToken);
    res.status(200).json({
      success: true,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
  },
);

export const LogoutHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();

    const token =
      req.headers.authorization?.replace("Bearer ", "") ??
      (req.cookies as Record<string, string> | undefined)?.["jwt"] ??
      "";

    const { refreshToken } = req.body as { refreshToken?: string };

    await authService.logout(
      req.user.userId,
      token,
      refreshToken,
      req.sessionId,
    );

    res.clearCookie?.("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  },
);

export const MeHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    res.status(200).json({ success: true, data: req.user });
  },
);

export const ChangePasswordHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const result = await authService.changePassword(req.user.userId, req.body);
    res.status(200).json({ success: true, ...result });
  },
);

export const RequestPasswordResetHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as { email: string };
    const result = await authService.requestPasswordReset(email);
    res.status(200).json({ success: true, message: result.message });
  },
);

export const ConfirmPasswordResetHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const result = await authService.confirmPasswordReset(req.body);
    res.status(200).json({ success: true, message: result.message });
  },
);

export const ResendOtpHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body as { email: string };
    const result = await authService.resendOtp(email);
    res.status(200).json({
      success: true,
      message: result.message,
      ...(result.debug ? { debug: result.debug } : {}),
    });
  },
);

export const SetupTwoFactorHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const result = await authService.setupTwoFactor(req.user.userId);
    res.status(200).json({ success: true, data: result });
  },
);

export const VerifyEnableTwoFactorHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const { token } = req.body as { token: string };
    const result = await authService.verifyAndEnableTwoFactor(
      req.user.userId,
      token,
    );
    res.status(200).json({
      success: true,
      message: result.message,
      data: { backupCodes: result.backupCodes },
    });
  },
);

export const DisableTwoFactorHandler = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    if (!req.user) throw AppError.unauthorized();
    const { password } = req.body as { password: string };
    const result = await authService.disableTwoFactor(
      req.user.userId,
      password,
    );
    res.status(200).json({ success: true, message: result.message });
  },
);

