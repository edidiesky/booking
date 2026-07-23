import bcrypt from "bcryptjs";
import crypto from "crypto";
import Joi from "joi";
import { userRepository } from "../auth/auth.repository";
import { getDispatcher } from "../../infra/providers/notification.dispatcher";
import redisClient from "../../config/redis";
import { AppError } from "../../utils/AppError";
import logger from "../../utils/logger";
import { requestContext } from "../../context/requestContext";

const OTP_TTL_SEC = 10 * 60;
const MAX_OTP_ATTEMPTS = 5;

function ctx() { return requestContext.get() ?? {}; }

function otpKey(userId: string, purpose: string): string {
  return `otp:${userId}:${purpose}`;
}

function generateOtp(): string {
  // 6-digit numeric OTP, crypto.randomInt is not modulo-biased unlike
  // Math.random() % 10 chains.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

const setPinSchema = Joi.object({
  pin: Joi.string().pattern(/^\d{4,6}$/).required().messages({
    "string.pattern.base": "PIN must be 4-6 digits.",
  }),
});

const changePinSchema = Joi.object({
  currentPin: Joi.string().required(),
  newPin:     Joi.string().pattern(/^\d{4,6}$/).required(),
});

const resetPinSchema = Joi.object({
  password: Joi.string().required(),
  newPin:   Joi.string().pattern(/^\d{4,6}$/).required(),
});

const verifyOtpSchema = Joi.object({
  code: Joi.string().length(6).required(),
});

export const securityService = {
  async getStatus(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound("User.");
    return {
      isEmailVerified: user.is_email_verified,
      isPhoneVerified: user.is_phone_verified,
      twoFactorEnabled: user.two_factor_enabled,
      loginWithPinEnabled: user.login_with_pin_enabled,
      countryCode: user.country_code ?? null,
      hasPin: (await userRepository.findByIdWithSecrets(userId))?.pin_hash != null,
    };
  },

  // First-time PIN setup, no existing PIN required.
  async setPin(userId: string, body: unknown) {
    const { error, value } = setPinSchema.validate(body);
    if (error) throw AppError.badRequest(error.details[0].message);
    const { pin } = value as { pin: string };

    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) throw AppError.notFound("User.");
    if (user.pin_hash) throw AppError.badRequest("PIN already set, use change-pin instead.");

    const pinHash = await bcrypt.hash(pin, 10);
    await userRepository.updateById(userId, { pin_hash: pinHash });

    logger.info("pin_set", { event: "pin_set", userId, ...ctx() });
    return { message: "PIN set." };
  },

  // Requires the current PIN, matches "Change Rise PIN" in the reference.
  async changePin(userId: string, body: unknown) {
    const { error, value } = changePinSchema.validate(body);
    if (error) throw AppError.badRequest(error.details[0].message);
    const { currentPin, newPin } = value as { currentPin: string; newPin: string };

    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user?.pin_hash) throw AppError.badRequest("No PIN set yet.");
    if (!(await bcrypt.compare(currentPin, user.pin_hash))) {
      throw AppError.unauthorized("Current PIN is incorrect.");
    }

    const pinHash = await bcrypt.hash(newPin, 10);
    await userRepository.updateById(userId, { pin_hash: pinHash });

    logger.info("pin_changed", { event: "pin_changed", userId, ...ctx() });
    return { message: "PIN changed." };
  },

  // Password-gated reset, matches the reference's "Reset PIN" screen
  // (enter account password, no OTP round trip needed since the password
  // itself is already the stronger factor here).
  async resetPin(userId: string, body: unknown) {
    const { error, value } = resetPinSchema.validate(body);
    if (error) throw AppError.badRequest(error.details[0].message);
    const { password, newPin } = value as { password: string; newPin: string };

    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) throw AppError.notFound("User.");
    if (!(await bcrypt.compare(password, user.password_hash))) {
      throw AppError.unauthorized("Incorrect password.");
    }

    const pinHash = await bcrypt.hash(newPin, 10);
    await userRepository.updateById(userId, { pin_hash: pinHash });

    logger.info("pin_reset", { event: "pin_reset", userId, ...ctx() });
    return { message: "PIN reset." };
  },

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user?.pin_hash) return false;
    return bcrypt.compare(pin, user.pin_hash);
  },

  // OTPs live in Redis, not Postgres: short-lived, one write per request,
  // and TTL gives free expiry instead of a manual otp_expires_at check +
  // a background sweep to clean up stale rows. Key is scoped by purpose
  // so a pending email-verify OTP and a pending 2FA-disable OTP for the
  // same user don't collide, each purpose gets its own slot with its own
  // TTL and attempt counter.
  async requestOtp(userId: string, purpose: "email_verify" | "phone_verify" | "two_factor_enable" | "two_factor_disable") {
    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) throw AppError.notFound("User.");

    if ((purpose === "phone_verify" || purpose === "two_factor_disable") && !user.phone) {
      throw AppError.badRequest("No phone number on file.");
    }

    const code = generateOtp();
    const codeHash = await bcrypt.hash(code, 10);

    await redisClient.set(
      otpKey(userId, purpose),
      JSON.stringify({ codeHash, attempts: 0 }),
      "EX",
      OTP_TTL_SEC,
    );

    const dispatcher = getDispatcher();
    const subject = "Your verification code";
    const body = `Your verification code is ${code}. It expires in 10 minutes. Do not share this code with anyone.`;

    // Prefer SMS for phone-flows, email otherwise, falling back to email
    // if SMS isn't configured (getDispatcher already logs and no-ops if
    // Twilio isn't set up, rather than throwing).
    if (purpose === "phone_verify" && user.phone) {
      await dispatcher.sendSms(user.phone, body);
    } else {
      await dispatcher.sendEmail(user.email, subject, `<p>${body}</p>`);
    }

    logger.info("otp_requested", { event: "otp_requested", userId, purpose, ...ctx() });
    return { message: "Verification code sent.", expiresInSeconds: OTP_TTL_SEC };
  },

  async verifyOtp(userId: string, purpose: string, body: unknown) {
    const { error, value } = verifyOtpSchema.validate(body);
    if (error) throw AppError.badRequest(error.details[0].message);
    const { code } = value as { code: string };

    const key = otpKey(userId, purpose);
    const raw = await redisClient.get(key);
    if (!raw) {
      throw AppError.badRequest("No pending verification for this action, request a new code.");
    }

    const { codeHash, attempts } = JSON.parse(raw) as { codeHash: string; attempts: number };
    if (attempts >= MAX_OTP_ATTEMPTS) {
      await redisClient.del(key);
      throw AppError.tooManyRequests("Too many incorrect attempts, request a new code.");
    }

    const valid = await bcrypt.compare(code, codeHash);
    if (!valid) {
      // Preserve remaining TTL while bumping the attempt count, don't
      // reset the expiry just because someone guessed wrong.
      const ttl = await redisClient.ttl(key);
      await redisClient.set(
        key,
        JSON.stringify({ codeHash, attempts: attempts + 1 }),
        "EX",
        ttl > 0 ? ttl : OTP_TTL_SEC,
      );
      throw AppError.unauthorized("Incorrect verification code.");
    }

    await redisClient.del(key);

    switch (purpose) {
      case "email_verify":
        await userRepository.updateById(userId, { is_email_verified: true });
        break;
      case "phone_verify":
        await userRepository.updateById(userId, { is_phone_verified: true });
        break;
      case "two_factor_enable":
        await userRepository.updateById(userId, { two_factor_enabled: true });
        break;
      case "two_factor_disable":
        await userRepository.updateById(userId, { two_factor_enabled: false });
        break;
      default:
        throw AppError.badRequest("Unknown verification purpose.");
    }

    logger.info("otp_verified", { event: "otp_verified", userId, purpose, ...ctx() });
    return { message: "Verified." };
  },

  // Stores the preference only.
  async setLoginWithPin(userId: string, enabled: boolean) {
    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) throw AppError.notFound("User.");
    if (enabled && !user.pin_hash) {
      throw AppError.badRequest("Set a transaction PIN before enabling PIN login.");
    }
    await userRepository.updateById(userId, { login_with_pin_enabled: enabled });
    logger.info("login_with_pin_toggled", { event: "login_with_pin_toggled", userId, enabled, ...ctx() });
    return { message: enabled ? "PIN login enabled." : "PIN login disabled." };
  },

  async setCountry(userId: string, body: unknown) {
    const schema = Joi.object({ countryCode: Joi.string().length(2).uppercase().required() });
    const { error, value } = schema.validate(body);
    if (error) throw AppError.badRequest(error.details[0].message);
    const { countryCode } = value as { countryCode: string };

    await userRepository.updateById(userId, { country_code: countryCode });
    logger.info("country_changed", { event: "country_changed", userId, countryCode, ...ctx() });
    return { message: "Location updated." };
  },
};