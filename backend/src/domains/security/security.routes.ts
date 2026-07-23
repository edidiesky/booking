import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import {
  GetSecurityStatusHandler,
  SetPinHandler,
  ChangePinHandler,
  ResetPinHandler,
  RequestOtpHandler,
  VerifyOtpHandler,
  SetLoginWithPinHandler,
  SetCountryHandler,
} from "./security.controller";

const router = Router();

router.get("/status",                  authenticate, GetSecurityStatusHandler);
router.post("/pin",                    authenticate, SetPinHandler);
router.patch("/pin",                   authenticate, ChangePinHandler);
router.post("/pin/reset",              authenticate, ResetPinHandler);
router.post("/otp/:purpose/request",   authenticate, RequestOtpHandler);
router.post("/otp/:purpose/verify",    authenticate, VerifyOtpHandler);
router.patch("/login-with-pin",        authenticate, SetLoginWithPinHandler);
router.patch("/country",               authenticate, SetCountryHandler);

export default router;