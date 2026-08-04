import { Router } from "express";
import { validate }     from "../../middleware/validate.middleware";
import { authenticate } from "../../middleware/auth.middleware";
import {
  InitiateOnboardingHandler,
  ConfirmEmailHandler,
  RegisterGuestHandler,
  RegisterHostHandler,
  LoginHandler,
  RefreshTokenHandler,
  LogoutHandler,
  MeHandler,
  ChangePasswordHandler,
  RequestPasswordResetHandler,
  ConfirmPasswordResetHandler,
  ResendOtpHandler,
  SetupTwoFactorHandler,
  VerifyEnableTwoFactorHandler,
  DisableTwoFactorHandler,
  VerifyTwoFactorLoginHandler,
  GoogleOAuthHandler,
} from "./auth.controller";
import {
  initiateSchema,
  confirmEmailSchema,
  registerGuestSchema,
  registerHostSchema,
  loginSchema,
  refreshSchema,
  resendOtpSchema,
  verifyEnableTwoFactorSchema,
  disableTwoFactorSchema,
  verifyTwoFactorLoginSchema,
  oauthGoogleSchema,
} from "./auth.validator";

const router = Router();
router.post("/oauth/google", validate(oauthGoogleSchema), GoogleOAuthHandler);
router.post("/onboarding/initiate",  validate(initiateSchema),       InitiateOnboardingHandler);
router.post("/onboarding/confirm",   validate(confirmEmailSchema),   ConfirmEmailHandler);
router.post("/onboarding/resend",    validate(resendOtpSchema),      ResendOtpHandler);
router.post("/register/guest",       validate(registerGuestSchema),  RegisterGuestHandler);
router.post("/register/host",        validate(registerHostSchema),   RegisterHostHandler);
router.post("/login",                validate(loginSchema),          LoginHandler);
router.post("/refresh",              validate(refreshSchema),        RefreshTokenHandler);
router.post("/logout",               authenticate,                   LogoutHandler);
router.get("/me",                    authenticate,                   MeHandler);
router.patch("/password",            authenticate,                   ChangePasswordHandler);
router.post("/password-reset/request", RequestPasswordResetHandler);
router.post("/password-reset/confirm", ConfirmPasswordResetHandler);
router.post("/2fa/setup",         authenticate, SetupTwoFactorHandler);
router.post("/2fa/verify-enable", authenticate, validate(verifyEnableTwoFactorSchema), VerifyEnableTwoFactorHandler);
router.post("/2fa/disable",       authenticate, validate(disableTwoFactorSchema), DisableTwoFactorHandler);
router.post("/2fa/verify-login",  validate(verifyTwoFactorLoginSchema), VerifyTwoFactorLoginHandler);

export default router;