import bcrypt  from "bcryptjs";
import jwt     from "jsonwebtoken";
import Joi     from "joi";
import { nanoid } from "nanoid";
import { v4 as uuid } from "uuid";
import redisClient from "../../config/redis";
import { userRepository }     from "./auth.repository";
import { profileRepository }  from "../profile/profile.repository";
import { tenantRepository }   from "../tenant/tenant.repository";
import { auditRepository }    from "../audit/audit.repository";
import { AppError }           from "../../utils/AppError";
import logger                 from "../../utils/logger";
import { requestContext }     from "../../context/requestContext";
import { JWTPayload, UserType } from "../../types";
import { withTransaction }    from "@booking/shared";
import { getDispatcher }      from "../../infra/providers/notification.dispatcher";
import {
  publishNotifyAuthOtp,
  publishNotifyAuthRegistered,
} from "../../messaging/publisher";

const JWT_EXPIRY_SEC     = 15 * 60;
const REFRESH_EXPIRY_SEC = 7 * 24 * 60 * 60;
const ONBOARDING_TTL_SEC = 60 * 60;
const PASSWORD_RESET_TTL_SEC = 15 * 60;

const onboardingKey = (email: string) => `onboarding:${email}`;
const refreshKey    = (token: string) => `refresh:${token}`;
const blocklistKey  = (userId: string) => `blocklist:${userId}`;
const passwordResetKey = (token: string) => `password-reset:${token}`;

interface OnboardingState {
  step:           "email_sent" | "email_verified" | "complete";
  passwordHash:   string;
  token?:         string;
  tokenExpiresAt?: number;
}

function signAccessToken(payload: JWTPayload): string {
  return jwt.sign({ user: payload }, process.env.JWT_SECRET!, {
    expiresIn: JWT_EXPIRY_SEC,
    issuer:    "booking-platform",
    audience:  "booking-client",
  });
}

export interface InitiateOnboardingInput {
  email:    string;
  password: string;
}

export interface ConfirmEmailInput {
  email: string;
  token: string;
}

export interface RegisterGuestInput {
  email:     string;
  firstName: string;
  lastName:  string;
  phone?:    string;
}

export interface RegisterHostInput extends RegisterGuestInput {
  tenantName:      string;
  tenantSlug:      string;
  platformFeePct?: number;
}

export interface LoginInput {
  email:    string;
  password: string;
}

export interface AuthTokens {
  accessToken:  string;
  refreshToken: string;
  user: {
    id:         string;
    firstName?: string;
    lastName?:  string;
    userType:   UserType;
    tenantId?:  string;
  };
}

export const authService = {
  async initiateOnboarding(input: InitiateOnboardingInput): Promise<{ message: string; debug?: string }> {
    const email = input.email.toLowerCase().trim();

    if (await userRepository.emailExists(email)) {
      throw AppError.conflict("An account with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const token        = Math.floor(100_000 + Math.random() * 900_000).toString();

    const state: OnboardingState = {
      step:           "email_sent",
      passwordHash,
      token,
      tokenExpiresAt: Date.now() + 15 * 60 * 1_000,
    };

    await redisClient.set(onboardingKey(email), JSON.stringify(state), "EX", ONBOARDING_TTL_SEC);

    logger.info("onboarding_initiated", {
      event:     "onboarding_initiated",
      email,
      requestId: requestContext.get()?.requestId,
    });

    // Fire-and-forget: publish OTP notification
    // Promise.allSettled ensures a publish failure never breaks registration
    void Promise.allSettled([
      publishNotifyAuthOtp({
        notificationId: uuid(),
        email,
        firstName:      email.split("@")[0], // best guess before we have a name
        otp:            token,
      }),
    ]);

    const isDev = process.env.NODE_ENV !== "production";
    return {
      message: "OTP sent to your email. Please verify to continue.",
      ...(isDev ? { debug: token } : {}),
    };
  },

  async confirmEmail(input: ConfirmEmailInput): Promise<void> {
    const email = input.email.toLowerCase().trim();
    const raw   = await redisClient.get(onboardingKey(email));

    if (!raw) throw AppError.badRequest("No onboarding session found. Please restart.");

    const state = JSON.parse(raw) as OnboardingState;

    if (state.token !== input.token) {
      throw AppError.badRequest("The OTP provided is not valid.");
    }
    if (Date.now() > (state.tokenExpiresAt ?? 0)) {
      throw AppError.badRequest("OTP has expired. Please restart the registration.");
    }

    state.step = "email_verified";
    await redisClient.set(onboardingKey(email), JSON.stringify(state), "EX", ONBOARDING_TTL_SEC);

    logger.info("email_confirmed", {
      event:     "email_confirmed",
      email,
      requestId: requestContext.get()?.requestId,
    });
  },

  async registerGuest(input: RegisterGuestInput): Promise<AuthTokens> {
    const email = input.email.toLowerCase().trim();
    const raw   = await redisClient.get(onboardingKey(email));

    if (!raw) throw AppError.badRequest("Please verify your email before completing registration.");

    const state = JSON.parse(raw) as OnboardingState;
    if (state.step !== "email_verified") {
      throw AppError.badRequest("Please verify your email before completing registration.");
    }

    const { passwordHash } = state;
    let userId!: string;

    await withTransaction(async (client) => {
      if (await userRepository.emailExists(email)) {
        throw AppError.conflict("An account with this email already exists.");
      }

      const user = await userRepository.create(
        { email, passwordHash, userType: "guest", firstName: input.firstName, lastName: input.lastName, phone: input.phone },
        client
      );
      userId = user.id;

      await userRepository.updateById(userId, { status: "active", is_email_verified: true }, client);
      await profileRepository.create(
        { userId, displayName: `${input.firstName} ${input.lastName}`.trim() },
        client
      );
    });

    await redisClient.del(onboardingKey(email));
    await auditRepository.log({ action: "created", resource: "user", resourceId: userId, userId });

    // Publish welcome notification after successful registration
    void Promise.allSettled([
      publishNotifyAuthRegistered({
        notificationId: uuid(),
        email,
        firstName:      input.firstName,
        lastName:       input.lastName,
        userType:       "guest",
      }),
    ]);

    logger.info("guest_registered", {
      event:     "guest_registered",
      userId,
      requestId: requestContext.get()?.requestId,
    });

    return authService._buildTokens(userId, "guest", `${input.firstName} ${input.lastName}`, undefined);
  },

  async registerHost(input: RegisterHostInput): Promise<AuthTokens> {
    const email = input.email.toLowerCase().trim();
    const raw   = await redisClient.get(onboardingKey(email));

    if (!raw) throw AppError.badRequest("Please verify your email before completing registration.");

    const state = JSON.parse(raw) as OnboardingState;
    if (state.step !== "email_verified") {
      throw AppError.badRequest("Please verify your email before completing registration.");
    }

    if (await tenantRepository.slugExists(input.tenantSlug)) {
      throw AppError.conflict("This business URL is already taken. Please choose another.");
    }

    const { passwordHash } = state;
    let userId!:  string;
    let tenantId!: string;

    await withTransaction(async (client) => {
      if (await userRepository.emailExists(email)) throw AppError.conflict("Email already registered.");

      const user = await userRepository.create(
        { email, passwordHash, userType: "host:admin", firstName: input.firstName, lastName: input.lastName, phone: input.phone },
        client
      );
      userId = user.id;

      const tenant = await tenantRepository.create({
        slug:           input.tenantSlug,
        name:           input.tenantName,
        ownerUserId:    userId,
        platformFeePct: input.platformFeePct ?? 10.00,
      }, client);
      tenantId = tenant.id;

      await userRepository.updateById(userId, { status: "active", is_email_verified: true, tenant_id: tenantId }, client);
      await profileRepository.create({ userId, displayName: `${input.firstName} ${input.lastName}`.trim() }, client);
    });

    await redisClient.del(onboardingKey(email));
    await auditRepository.log({ action: "created", resource: "tenant", resourceId: tenantId, userId });

    // Publish host welcome notification after successful registration
    void Promise.allSettled([
      publishNotifyAuthRegistered({
        notificationId: uuid(),
        email,
        firstName:      input.firstName,
        lastName:       input.lastName,
        userType:       "host:admin",
        tenantName:     input.tenantName,
        tenantSlug:     input.tenantSlug,
      }),
    ]);

    logger.info("host_registered", {
      event:     "host_registered",
      userId,
      tenantId,
      requestId: requestContext.get()?.requestId,
    });

    return authService._buildTokens(userId, "host:admin", `${input.firstName} ${input.lastName}`, tenantId);
  },

  async login(input: LoginInput): Promise<AuthTokens> {
    const email = input.email.toLowerCase().trim();
    const user  = await userRepository.findByEmail(email);

    if (!user) throw AppError.unauthorized("Invalid email or password.");
    if (!(await bcrypt.compare(input.password, user.password_hash))) throw AppError.unauthorized("Invalid email or password.");
    if (user.status === "suspended") throw AppError.forbidden("Your account has been suspended. Contact support.");
    if (user.status === "inactive")  throw AppError.forbidden("Your account is inactive.");
    if (!user.is_email_verified)     throw AppError.forbidden("Please verify your email before logging in.");

    await userRepository.updateById(user.id, { last_active_at: new Date() });
    await auditRepository.log({ action: "login", resource: "user", resourceId: user.id, userId: user.id });

    logger.info("user_logged_in", {
      event:     "user_logged_in",
      userId:    user.id,
      userType:  user.user_type,
      requestId: requestContext.get()?.requestId,
    });

    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    return authService._buildTokens(user.id, user.user_type, name, user.tenant_id);
  },

async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
  const raw = await redisClient.get(refreshKey(token));
  if (!raw) throw AppError.unauthorized("Invalid or expired refresh token.");

  const data = JSON.parse(raw) as { userId: string; userType: UserType; name: string; email: string; tenantId?: string };
  const accessToken = signAccessToken({
    userId:   data.userId,
    userType: data.userType,
    name:     data.name,
    tenantId: data.tenantId,
  });

  await redisClient.del(refreshKey(token));
  const newRefreshToken = nanoid(32);
  await redisClient.set(refreshKey(newRefreshToken), raw, "EX", REFRESH_EXPIRY_SEC);

  return { accessToken, refreshToken: newRefreshToken };
},

  async logout(userId: string, accessToken: string): Promise<void> {
    let ttl = JWT_EXPIRY_SEC;
    try {
      const decoded = jwt.decode(accessToken) as { exp?: number } | null;
      if (decoded?.exp) ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    } catch { /**/ }

    await redisClient.set(blocklistKey(userId), "1", "EX", ttl);
    await auditRepository.log({ action: "logout", resource: "user", resourceId: userId, userId });

    logger.info("user_logged_out", {
      event:     "user_logged_out",
      userId,
      requestId: requestContext.get()?.requestId,
    });
  },

  async resendOtp(email: string): Promise<{ message: string; debug?: string }> {
    const normalised = email.toLowerCase().trim();
    const raw = await redisClient.get(onboardingKey(normalised));
    if (!raw) throw AppError.badRequest("No onboarding session found. Please restart registration.");

    const state = JSON.parse(raw) as OnboardingState;
    const token = Math.floor(100_000 + Math.random() * 900_000).toString();

    state.token          = token;
    state.tokenExpiresAt = Date.now() + 15 * 60 * 1_000;

    await redisClient.set(onboardingKey(normalised), JSON.stringify(state), "EX", ONBOARDING_TTL_SEC);

    // Re-publish OTP notification
    void Promise.allSettled([
      publishNotifyAuthOtp({
        notificationId: uuid(),
        email:          normalised,
        firstName:      normalised.split("@")[0],
        otp:            token,
      }),
    ]);

    logger.info("otp_resent", {
      event:     "otp_resent",
      email:     normalised,
      requestId: requestContext.get()?.requestId,
    });

    const isDev = process.env.NODE_ENV !== "production";
    return {
      message: "New OTP sent to your email.",
      ...(isDev ? { debug: token } : {}),
    };
  },

  async _buildTokens(
    userId:   string,
    userType: UserType,
    name:     string,
    tenantId: string | undefined
  ): Promise<AuthTokens> {
    const payload: JWTPayload = { userId, userType, name, tenantId };
    const accessToken         = signAccessToken(payload);
    const refreshToken        = nanoid(32);
    const refreshData         = JSON.stringify({ userId, userType, name, tenantId });

    await redisClient.set(refreshKey(refreshToken), refreshData, "EX", REFRESH_EXPIRY_SEC);

    const user = await userRepository.findById(userId);
    return {
      accessToken,
      refreshToken,
      user: { id: userId, firstName: user?.first_name, lastName: user?.last_name, userType, tenantId },
    };
  },

  async changePassword(userId: string, body: unknown) {
    const schema = Joi.object({
      currentPassword: Joi.string().required(),
      newPassword:     Joi.string().min(8).required(),
    });
    const { error, value } = schema.validate(body, { abortEarly: false });
    if (error) throw AppError.badRequest(error.details[0].message);
    const { currentPassword, newPassword } = value as { currentPassword: string; newPassword: string };

    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) throw AppError.notFound("User.");
    if (!(await bcrypt.compare(currentPassword, user.password_hash))) {
      throw AppError.unauthorized("Current password is incorrect.");
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await userRepository.updatePasswordHash(userId, newHash);

    await auditRepository.log({ action: "updated", resource: "password", resourceId: userId, userId });

    logger.info("password_changed", { event: "password_changed", userId });
    return { message: "Password changed." };
  },

  // Logged-out flow: request a reset link by email, then confirm with the
  // token from that link. Token lives in Redis with a TTL, same pattern
  // as the OTP flows in security.service.ts, single-use, self-expiring,
  // no schema/migration needed for a short-lived artifact like this.
  async requestPasswordReset(email: string) {
    const schema = Joi.object({ email: Joi.string().email().required() });
    const { error, value } = schema.validate({ email });
    if (error) throw AppError.badRequest(error.details[0].message);

    const user = await userRepository.findByEmail(value.email as string);
    // Always respond the same way whether or not the email exists, don't
    // let this endpoint be used to enumerate registered emails.
    if (!user) {
      logger.info("password_reset_requested_unknown_email", { event: "password_reset_requested_unknown_email" });
      return { message: "If that email is registered, a reset link has been sent." };
    }

    const token = nanoid(32);
    await redisClient.set(passwordResetKey(token), user.id, "EX", PASSWORD_RESET_TTL_SEC);

    const resetUrl = `${process.env.WEB_ORIGIN}/reset-password/${token}`;
    const dispatcher = getDispatcher();
    await dispatcher.sendEmail(
      user.email,
      "Reset your password",
      `<p>We received a request to reset your password. This link expires in 15 minutes.</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>If you didn't request this, you can safely ignore this email.</p>`,
    );

    logger.info("password_reset_requested", { event: "password_reset_requested", userId: user.id });
    return { message: "If that email is registered, a reset link has been sent." };
  },

  async confirmPasswordReset(body: unknown) {
    const schema = Joi.object({
      token:    Joi.string().required(),
      password: Joi.string().min(8).required(),
    });
    const { error, value } = schema.validate(body, { abortEarly: false });
    if (error) throw AppError.badRequest(error.details[0].message);
    const { token, password } = value as { token: string; password: string };

    const userId = await redisClient.get(passwordResetKey(token));
    if (!userId) throw AppError.badRequest("This reset link is invalid or has expired.");

    const newHash = await bcrypt.hash(password, 12);
    await userRepository.updatePasswordHash(userId, newHash);
    await redisClient.del(passwordResetKey(token));

    await redisClient.set(blocklistKey(userId), "1", "EX", JWT_EXPIRY_SEC);

    await auditRepository.log({ action: "updated", resource: "password_reset", resourceId: userId, userId });

    logger.info("password_reset_confirmed", { event: "password_reset_confirmed", userId });
    return { message: "Password reset. You can now sign in with your new password." };
  },
};