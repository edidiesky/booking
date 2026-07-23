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
} from "./auth.controller";
import {
  initiateSchema,
  confirmEmailSchema,
  registerGuestSchema,
  registerHostSchema,
  loginSchema,
  refreshSchema,
  resendOtpSchema,
} from "./auth.validator";

const router = Router();

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

export default router;