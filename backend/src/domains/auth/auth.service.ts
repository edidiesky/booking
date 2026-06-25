import bcrypt  from "bcryptjs";
import jwt     from "jsonwebtoken";
import { nanoid } from "nanoid";
import redisClient from "../../config/redis";
import { userRepository }     from "./auth.repository";
import { profileRepository }  from "../profile/profile.repository";
import { tenantRepository }   from "../tenant/tenant.repository";
import { auditRepository }    from "../audit/audit.repository";
import { AppError }           from "../../utils/AppError";
import logger                 from "../../utils/logger";
import { requestContext }     from "../../context/requestContext";
import { JWTPayload, UserType } from "../../types";
import { withTransaction }    from "../../config/database";

const JWT_EXPIRY_SEC     = 15 * 60;
const REFRESH_EXPIRY_SEC = 7 * 24 * 60 * 60;
const ONBOARDING_TTL_SEC = 60 * 60;        // 1 hour for email verify session

// --- Redis key helpers (matching your existing pattern) ---
const onboardingKey  = (email: string) => `onboarding:${email}`;
const refreshKey     = (token: string) => `refresh:${token}`;
const blocklistKey   = (userId: string) => `blocklist:${userId}`;

interface OnboardingState {
  step:         "email_sent" | "email_verified" | "complete";
  passwordHash: string;
  token?:       string;
  tokenExpiresAt?: number;
}

// --- Token generation ---
function signAccessToken(payload: JWTPayload): string {
  return jwt.sign({ user: payload }, process.env.JWT_SECRET!, {
    expiresIn: JWT_EXPIRY_SEC,
    issuer:    "booking-platform",
    audience:  "booking-client",
  });
}

// --- DTOs ---
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
    id:        string;
    email:     string;
    firstName?: string;
    lastName?:  string;
    userType:  UserType;
    tenantId?: string;
  };
}

// =========================================================
// Auth Service
// =========================================================
export const authService = {
  /**
   * Step 1: Guest/Host begins registration.
   * Stores hashed password + 6-digit OTP in Redis.
   * In production you'd send the OTP via email - here we return it (dev mode) or call your email service.
   */
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
      tokenExpiresAt: Date.now() + 15 * 60 * 1_000, // 15 min
    };

    await redisClient.set(onboardingKey(email), JSON.stringify(state), "EX", ONBOARDING_TTL_SEC);

    logger.info("onboarding_initiated", {
      event:     "onboarding_initiated",
      email,
      requestId: requestContext.get()?.requestId,
    });

    // TODO: call your notification service to send OTP email
    // For dev: return token directly
    const isDev = process.env.NODE_ENV !== "production";
    return {
      message: "OTP sent to your email. Please verify to continue.",
      ...(isDev ? { debug: token } : {}),
    };
  },

  /**
   * Step 2: Verify OTP.
   * Advances onboarding state to email_verified.
   */
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

    logger.info("email_confirmed", { event: "email_confirmed", email, requestId: requestContext.get()?.requestId });
  },

  /**
   * Step 3a: Complete guest registration.
   * Requires email_verified step in Redis.
   */
  async registerGuest(input: RegisterGuestInput): Promise<AuthTokens> {
    const email = input.email.toLowerCase().trim();
    const raw   = await redisClient.get(onboardingKey(email));

    if (!raw) throw AppError.badRequest("Please verify your email before completing registration.");

    const state = JSON.parse(raw) as OnboardingState;
    if (state.step !== "email_verified") {
      throw AppError.badRequest("Please verify your email before completing registration.");
    }

    const { passwordHash } = state;

    let userId: string;

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

    await auditRepository.log({ action: "created", resource: "user", resourceId: userId!, userId: userId! });

    logger.info("guest_registered", { event: "guest_registered", userId: userId!, requestId: requestContext.get()?.requestId });

    return authService._buildTokens(userId!, "guest", `${input.firstName} ${input.lastName}`, email, undefined);
  },

  /**
   * Step 3b: Complete host registration.
   * Creates user + tenant atomically.
   */
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
    let userId!: string;
    let tenantId!: string;

    await withTransaction(async (client) => {
      if (await userRepository.emailExists(email)) throw AppError.conflict("Email already registered.");

      const user = await userRepository.create(
        { email, passwordHash, userType: "host:admin", firstName: input.firstName, lastName: input.lastName, phone: input.phone },
        client
      );
      userId = user.id;

      const tenant = await tenantRepository.create({
        slug: input.tenantSlug, name: input.tenantName,
        ownerUserId: userId, platformFeePct: input.platformFeePct ?? 10.00,
      }, client);
      tenantId = tenant.id;

      await userRepository.updateById(userId, { status: "active", is_email_verified: true, tenant_id: tenantId }, client);
      await profileRepository.create({ userId, displayName: `${input.firstName} ${input.lastName}`.trim() }, client);
    });

    await redisClient.del(onboardingKey(email));
    await auditRepository.log({ action: "created", resource: "tenant", resourceId: tenantId, userId });

    logger.info("host_registered", { event: "host_registered", userId, tenantId, requestId: requestContext.get()?.requestId });

    return authService._buildTokens(userId, "host:admin", `${input.firstName} ${input.lastName}`, email, tenantId);
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

    logger.info("user_logged_in", { event: "user_logged_in", userId: user.id, userType: user.user_type, requestId: requestContext.get()?.requestId });

    const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
    return authService._buildTokens(user.id, user.user_type, name, user.email, user.tenant_id);
  },

  async refreshToken(token: string): Promise<Pick<AuthTokens, "accessToken">> {
    const raw = await redisClient.get(refreshKey(token));
    if (!raw) throw AppError.unauthorized("Invalid or expired refresh token.");

    const data = JSON.parse(raw) as { userId: string; userType: UserType; name: string; email: string; tenantId?: string };
    const accessToken = signAccessToken({ userId: data.userId, userType: data.userType, email: data.email, name: data.name, tenantId: data.tenantId });

    // Rotate
    await redisClient.del(refreshKey(token));
    const newToken = nanoid(32);
    await redisClient.set(refreshKey(newToken), raw, "EX", REFRESH_EXPIRY_SEC);

    return { accessToken };
  },

  async logout(userId: string, accessToken: string): Promise<void> {
    let ttl = JWT_EXPIRY_SEC;
    try {
      const decoded = jwt.decode(accessToken) as { exp?: number } | null;
      if (decoded?.exp) ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    } catch { /**/ }

    await redisClient.set(blocklistKey(userId), "1", "EX", ttl);
    await auditRepository.log({ action: "logout", resource: "user", resourceId: userId, userId });

    logger.info("user_logged_out", { event: "user_logged_out", userId, requestId: requestContext.get()?.requestId });
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

    logger.info("otp_resent", { event: "otp_resent", email: normalised, requestId: requestContext.get()?.requestId });

    const isDev = process.env.NODE_ENV !== "production";
    return {
      message: "New OTP sent to your email.",
      ...(isDev ? { debug: token } : {}),
    };
  },

  // Internal helper
  async _buildTokens(
    userId:   string,
    userType: UserType,
    name:     string,
    email:    string,
    tenantId: string | undefined
  ): Promise<AuthTokens> {
    const payload: JWTPayload    = { userId, userType, email, name, tenantId };
    const accessToken            = signAccessToken(payload);
    const refreshToken           = nanoid(32);
    const refreshData            = JSON.stringify({ userId, userType, name, email, tenantId });

    await redisClient.set(refreshKey(refreshToken), refreshData, "EX", REFRESH_EXPIRY_SEC);

    const user = await userRepository.findById(userId);
    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, firstName: user?.first_name, lastName: user?.last_name, userType, tenantId },
    };
  },
};
