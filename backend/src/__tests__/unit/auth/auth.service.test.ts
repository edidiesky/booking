/**
 * src/__tests__/unit/auth/auth.service.test.ts
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import bcrypt from "bcryptjs";
import {
  AuthService,
  type InitiateOnboardingInput,
  type ConfirmEmailInput,
  type RegisterGuestInput,
  type LoginInput,
} from "../../../domains/auth/auth.service";
import {
  userRepository,
  type User,
} from "../../../domains/auth/auth.repository";
import type { UserStatus, UserType } from "../../../types";
import { expectAppError } from "../../helpers/expectAppError";
const redisMock = {
  get: jest.fn(),
  set: jest.fn().mockResolvedValue("OK" as never),
  del: jest.fn().mockResolvedValue(1 as never),
};
jest.mock("../../../config/redis", () => ({
  __esModule: true,
  default: redisMock,
}));
jest.mock("bcryptjs");
jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "signed.access.token"),
  verify: jest.fn(),
  decode: jest.fn(() => null),
}));
jest.mock("nanoid", () => ({ nanoid: jest.fn(() => "nano-id-fixed") }));
jest.mock("uuid", () => ({ v4: jest.fn(() => "uuid-fixed") }));

jest.mock("../../../config/redis", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    set: jest.fn().mockResolvedValue("OK" as never),
    del: jest.fn().mockResolvedValue(1 as never),
  },
}));

jest.mock("../../../domains/auth/auth.repository", () => ({
  userRepository: {
    emailExists: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findByIdWithSecrets: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
  },
}));

jest.mock("../../../domains/profile/profile.repository", () => ({
  profileRepository: {
    create: jest.fn().mockResolvedValue(undefined as never),
  },
}));

jest.mock("../../../domains/tenant/tenant.repository", () => ({
  tenantRepository: {
    findById: jest.fn(),
    create: jest.fn(),
    slugExists: jest.fn(),
  },
}));

jest.mock("../../../domains/audit/audit.repository", () => ({
  auditRepository: {
    log: jest.fn().mockResolvedValue(undefined as never),
  },
}));

jest.mock("../../../domains/audit/auditEvent.repository", () => ({
  auditEventRepository: {
    record: jest.fn().mockResolvedValue(undefined as never),
  },
}));

jest.mock("../../../domains/role/role.repository", () => ({
  roleRepository: { findBySlug: jest.fn() },
}));

jest.mock("../../../domains/user-role/user-role.repository", () => ({
  userRoleRepository: {
    assign: jest.fn().mockResolvedValue(undefined as never),
  },
}));

jest.mock("@booking/shared", () => ({
  withTransaction: jest.fn(async (fn: (client: object) => Promise<unknown>) =>
    fn({}),
  ),
}));

jest.mock("../../../messaging/publisher", () => ({
  publishNotifyAuthOtp: jest.fn().mockResolvedValue(undefined as never),
  publishNotifyAuthPasswordRequestResetPayload: jest
    .fn()
    .mockResolvedValue(undefined as never),
  publishNotifyAuthRegistered: jest.fn().mockResolvedValue(undefined as never),
}));

jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

jest.mock("../../../context/requestContext", () => ({
  requestContext: { get: jest.fn().mockReturnValue({ requestId: "req-1" }) },
}));

jest.mock("otplib", () => ({
  authenticator: {
    generateSecret: jest.fn(() => "SECRET"),
    keyuri: jest.fn(() => "otpauth://totp/test"),
    verify: jest.fn(),
  },
}));

jest.mock("qrcode", () => ({
  toDataURL: jest.fn().mockResolvedValue("data:image/png;base64,xxx" as never),
}));

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedUserRepo = userRepository as jest.Mocked<typeof userRepository>;

process.env.JWT_SECRET = "test-jwt-secret";
process.env.NODE_ENV = "test";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "user-1",
    email: "guest@test.com",
    password_hash: "$2b$12$hashedpassword",
    first_name: "Jane",
    last_name: "Doe",
    user_type: "guest" as UserType,
    status: "active" as UserStatus,
    is_email_verified: true,
    is_phone_verified: false,
    two_factor_enabled: false,
    login_with_pin_enabled: false,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

interface OnboardingState {
  step: "email_sent" | "email_verified" | "complete";
  passwordHash: string;
  token?: string;
  tokenExpiresAt?: number;
}

function makeOnboardingState(
  overrides: Partial<OnboardingState> = {},
): OnboardingState {
  return {
    step: "email_sent",
    passwordHash: "$2b$12$hashed",
    token: "123456",
    tokenExpiresAt: Date.now() + 15 * 60 * 1000,
    ...overrides,
  };
}

describe("AuthService – critical paths", () => {
  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService();
    mockedBcrypt.hash.mockResolvedValue("$2b$12$hashed" as never);
    mockedBcrypt.compare.mockResolvedValue(true as never);
  });

  describe("initiateOnboarding", () => {
    const input: InitiateOnboardingInput = {
      email: "New@Test.com",
      password: "Password1!",
    };

    it("hashes password, stores onboarding state, returns OTP message", async () => {
      mockedUserRepo.emailExists.mockResolvedValue(false as never);
      const result = await service.initiateOnboarding(input);
      expect(mockedUserRepo.emailExists).toHaveBeenCalledWith("new@test.com");
      expect(mockedBcrypt.hash).toHaveBeenCalledWith("Password1!", 12);
      expect(redisMock.set).toHaveBeenCalledWith(
        "onboarding:new@test.com",
        expect.stringContaining('"step":"email_sent"'),
        "EX",
        expect.any(Number),
      );
      expect(result.message).toMatch(/OTP sent/i);
    });

    it("rejects when email already exists", async () => {
      mockedUserRepo.emailExists.mockResolvedValue(true as never);
      await expectAppError(
        service.initiateOnboarding(input),
        409,
        /already exists/i,
      );
      expect(redisMock.set).not.toHaveBeenCalled();
    });
  });

  describe("confirmEmail", () => {
    const input: ConfirmEmailInput = {
      email: "guest@test.com",
      token: "123456",
    };

    it("marks step email_verified when OTP is valid", async () => {
      redisMock.get.mockResolvedValue(
        JSON.stringify(makeOnboardingState({ token: "123456" })) as never,
      );
      await service.confirmEmail(input);
      expect(redisMock.set).toHaveBeenCalledWith(
        "onboarding:guest@test.com",
        expect.stringContaining('"step":"email_verified"'),
        "EX",
        expect.any(Number),
      );
    });

    it("rejects when no onboarding session exists", async () => {
      redisMock.get.mockResolvedValue(null as never);
      await expectAppError(
        service.confirmEmail(input),
        400,
        /No onboarding session/i,
      );
    });

    it("rejects when OTP does not match", async () => {
      redisMock.get.mockResolvedValue(
        JSON.stringify(makeOnboardingState({ token: "999999" })) as never,
      );
      await expectAppError(service.confirmEmail(input), 400, /not valid/i);
    });

    it("rejects when OTP has expired", async () => {
      redisMock.get.mockResolvedValue(
        JSON.stringify(
          makeOnboardingState({
            token: "123456",
            tokenExpiresAt: Date.now() - 1000,
          }),
        ) as never,
      );
      await expectAppError(service.confirmEmail(input), 400, /expired/i);
    });
  });

  describe("registerGuest", () => {
    const input: RegisterGuestInput = {
      email: "guest@test.com",
      firstName: "Jane",
      lastName: "Doe",
    };

    it("creates user when email verified in onboarding", async () => {
      redisMock.get.mockResolvedValue(
        JSON.stringify(
          makeOnboardingState({ step: "email_verified" }),
        ) as never,
      );
      mockedUserRepo.emailExists.mockResolvedValue(false as never);
      mockedUserRepo.create.mockResolvedValue({
        id: "user-1",
        email: "guest@test.com",
        first_name: "Jane",
        last_name: "Doe",
        user_type: "guest",
        status: "active",
        is_email_verified: false,
        is_phone_verified: false,
        two_factor_enabled: false,
        login_with_pin_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as never);
      mockedUserRepo.updateById.mockResolvedValue(undefined as never);

      const tokens = await service.registerGuest(input);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.user.id).toBe("user-1");
      expect(redisMock.del).toHaveBeenCalledWith("onboarding:guest@test.com");
    });

    it("rejects when onboarding session is missing", async () => {
      redisMock.get.mockResolvedValue(null as never);
      await expectAppError(
        service.registerGuest(input),
        400,
        /verify your email/i,
      );
    });

    it("rejects when email not verified yet", async () => {
      redisMock.get.mockResolvedValue(
        JSON.stringify(makeOnboardingState({ step: "email_sent" })) as never,
      );
      await expectAppError(
        service.registerGuest(input),
        400,
        /verify your email/i,
      );
    });
  });

  describe("login", () => {
    const input: LoginInput = {
      email: "guest@test.com",
      password: "Password1!",
    };

    it("issues email OTP challenge without 2FA", async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(makeUser() as never);
      const result = await service.login(input);
      expect(result).toMatchObject({
        emailOtpRequired: true,
        email: "guest@test.com",
        method: "email",
      });
    });

    it("issues 2FA challenge when enabled", async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(
        makeUser({ two_factor_enabled: true }) as never,
      );
      const result = await service.login(input);
      expect(result).toMatchObject({
        twoFactorRequired: true,
        method: "totp",
      });
    });

    it("rejects unknown email", async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(null as never);
      await expectAppError(
        service.login(input),
        401,
        /Invalid email or password/i,
      );
    });

    it("rejects wrong password", async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(makeUser() as never);
      mockedBcrypt.compare.mockResolvedValue(false as never);
      await expectAppError(
        service.login(input),
        401,
        /Invalid email or password/i,
      );
    });

    it("rejects suspended account", async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(
        makeUser({ status: "suspended" }) as never,
      );
      await expectAppError(service.login(input), 403, /suspended/i);
    });

    it("rejects inactive account", async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(
        makeUser({ status: "inactive" }) as never,
      );
      await expectAppError(service.login(input), 403, /inactive/i);
    });

    it("rejects unverified email", async () => {
      mockedUserRepo.findByEmail.mockResolvedValue(
        makeUser({ is_email_verified: false }) as never,
      );
      await expectAppError(service.login(input), 403, /verify your email/i);
    });
  });

  describe("verifyLoginEmailOtp", () => {
    it("rejects when OTP key missing", async () => {
      redisMock.get.mockResolvedValue(null as never);
      await expectAppError(
        service.verifyLoginEmailOtp("guest@test.com", "123456"),
        400,
        /expired/i,
      );
    });

    it("rejects when OTP does not match", async () => {
      redisMock.get.mockResolvedValue(
        JSON.stringify({
          userId: "user-1",
          otpHash: "$2b$10$wrong",
        }) as never,
      );
      mockedBcrypt.compare.mockResolvedValue(false as never);
      await expectAppError(
        service.verifyLoginEmailOtp("guest@test.com", "000000"),
        400,
      );
    });

    it("returns tokens when OTP is valid", async () => {
      redisMock.get.mockResolvedValue(
        JSON.stringify({
          userId: "user-1",
          otpHash: "$2b$10$validhash",
        }) as never,
      );
      mockedBcrypt.compare.mockResolvedValue(true as never);
      mockedUserRepo.findById.mockResolvedValue({
        id: "user-1",
        email: "guest@test.com",
        first_name: "Jane",
        last_name: "Doe",
        user_type: "guest",
        status: "active",
        is_email_verified: true,
        is_phone_verified: false,
        two_factor_enabled: false,
        login_with_pin_enabled: false,
        created_at: new Date(),
        updated_at: new Date(),
      } as never);

      const tokens = await service.verifyLoginEmailOtp(
        "guest@test.com",
        "123456",
      );
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.user.id).toBe("user-1");
      expect(redisMock.del).toHaveBeenCalledWith("login-otp:guest@test.com");
    });
  });

  describe("logout", () => {
    it("blocklists userId and deletes refresh token", async () => {
      await service.logout("user-1", "not.a.real.token", "refresh-token-abc");
      expect(redisMock.set).toHaveBeenCalledWith(
        "blocklist:user-1",
        "1",
        "EX",
        expect.any(Number),
      );
      expect(redisMock.del).toHaveBeenCalledWith("refresh:refresh-token-abc");
    });
  });
});
