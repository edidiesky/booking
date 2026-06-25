import { AppError } from "../../utils/AppError";
import request from "supertest";
import { describe, expect, it, jest } from "@jest/globals";
import { app } from "../../app";
import { makeGuestToken, GUEST_ID } from "../setup/fixtures";

jest.mock("../../domains/auth/auth.service");

import { authService } from "../../domains/auth/auth.service";

const mockAuthService = authService as jest.Mocked<typeof authService>;

const VALID_INITIATE  = { email: "test@example.com", password: "password123" };
const VALID_CONFIRM   = { email: "test@example.com", token: "123456" };
const VALID_GUEST_REG = { email: "test@example.com", firstName: "John", lastName: "Doe" };
const VALID_HOST_REG  = { email: "test@example.com", firstName: "Jane", lastName: "Smith", tenantName: "My Hotel", tenantSlug: "my-hotel" };
const VALID_LOGIN     = { email: "test@example.com", password: "password123" };

const MOCK_TOKENS = {
  accessToken:  "mock.access.token",
  refreshToken: "mock-refresh-token",
  user: { id: GUEST_ID, email: "test@example.com", firstName: "John", lastName: "Doe", userType: "guest" as const, tenantId: undefined },
};

describe("POST /api/v1/auth/onboarding/initiate", () => {
  it("200: initiates onboarding and returns OTP in dev mode", async () => {
    mockAuthService.initiateOnboarding.mockResolvedValue({ message: "OTP sent to your email.", debug: "123456" });

    const res = await request(app)
      .post("/api/v1/auth/onboarding/initiate")
      .send(VALID_INITIATE);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBeDefined();
    expect(mockAuthService.initiateOnboarding).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.com" })
    );
  });

  it("400: rejects invalid email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/onboarding/initiate")
      .send({ email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("400: rejects short password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/onboarding/initiate")
      .send({ email: "test@example.com", password: "short" });

    expect(res.status).toBe(400);
  });

  it("409: propagates conflict when email already exists", async () => {
    mockAuthService.initiateOnboarding.mockRejectedValue(
      AppError.conflict("An account with this email already exists.")
    );

    const res = await request(app)
      .post("/api/v1/auth/onboarding/initiate")
      .send(VALID_INITIATE);

    expect(res.status).toBe(409);
  });
});

describe("POST /api/v1/auth/onboarding/confirm", () => {
  it("200: confirms OTP successfully", async () => {
    mockAuthService.confirmEmail.mockResolvedValue(undefined);

    const res = await request(app)
      .post("/api/v1/auth/onboarding/confirm")
      .send(VALID_CONFIRM);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockAuthService.confirmEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "test@example.com", token: "123456" })
    );
  });

  it("400: rejects non-numeric OTP", async () => {
    const res = await request(app)
      .post("/api/v1/auth/onboarding/confirm")
      .send({ email: "test@example.com", token: "abcdef" });

    expect(res.status).toBe(400);
  });

  it("400: rejects wrong-length OTP (5 digits instead of 6)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/onboarding/confirm")
      .send({ email: "test@example.com", token: "12345" });

    expect(res.status).toBe(400);
  });

  it("400: propagates invalid/expired OTP", async () => {
    mockAuthService.confirmEmail.mockRejectedValue(
      AppError.badRequest("The OTP provided is not valid.")
    );

    const res = await request(app)
      .post("/api/v1/auth/onboarding/confirm")
      .send(VALID_CONFIRM);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/onboarding/resend", () => {
  it("200: resends OTP", async () => {
    mockAuthService.resendOtp.mockResolvedValue({ message: "New OTP sent to your email.", debug: "654321" });

    const res = await request(app)
      .post("/api/v1/auth/onboarding/resend")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(mockAuthService.resendOtp).toHaveBeenCalledWith("test@example.com");
  });

  it("400: rejects invalid email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/onboarding/resend")
      .send({ email: "bad-email" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/register/guest", () => {
  it("201: registers guest and returns tokens", async () => {
    mockAuthService.registerGuest.mockResolvedValue(MOCK_TOKENS);

    const res = await request(app)
      .post("/api/v1/auth/register/guest")
      .send(VALID_GUEST_REG);

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
    expect(res.body.data.user.userType).toBe("guest");
  });

  it("400: rejects missing firstName", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/guest")
      .send({ email: "test@example.com", lastName: "Doe" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "firstName" })])
    );
  });

  it("400: rejects firstName shorter than 2 chars", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/guest")
      .send({ ...VALID_GUEST_REG, firstName: "J" });

    expect(res.status).toBe(400);
  });

  it("400: propagates unverified email error", async () => {
    mockAuthService.registerGuest.mockRejectedValue(
      AppError.badRequest("Please verify your email before completing registration.")
    );

    const res = await request(app)
      .post("/api/v1/auth/register/guest")
      .send(VALID_GUEST_REG);

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/register/host", () => {
  it("201: registers host and returns tokens", async () => {
    const hostTokens = { ...MOCK_TOKENS, user: { ...MOCK_TOKENS.user, userType: "host:admin" as const, tenantId: "tenant-123" } };
    mockAuthService.registerHost.mockResolvedValue(hostTokens);

    const res = await request(app)
      .post("/api/v1/auth/register/host")
      .send(VALID_HOST_REG);

    expect(res.status).toBe(201);
    expect(res.body.data.user.userType).toBe("host:admin");
    expect(res.body.data.user.tenantId).toBeDefined();
  });

  it("400: rejects slug shorter than 3 chars", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/host")
      .send({ ...VALID_HOST_REG, tenantSlug: "ab" });

    expect(res.status).toBe(400);
  });

  it("400: rejects slug with special characters", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register/host")
      .send({ ...VALID_HOST_REG, tenantSlug: "my hotel!" });

    expect(res.status).toBe(400);
  });

  it("409: slug already taken", async () => {
    mockAuthService.registerHost.mockRejectedValue(
      AppError.conflict("This business URL is already taken.")
    );

    const res = await request(app)
      .post("/api/v1/auth/register/host")
      .send(VALID_HOST_REG);

    expect(res.status).toBe(409);
  });
});

describe("POST /api/v1/auth/login", () => {
  it("200: returns tokens on valid credentials", async () => {
    mockAuthService.login.mockResolvedValue(MOCK_TOKENS);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send(VALID_LOGIN);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  it("401: wrong password", async () => {
    mockAuthService.login.mockRejectedValue(
      AppError.unauthorized("Invalid email or password.")
    );

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send(VALID_LOGIN);

    expect(res.status).toBe(401);
  });

  it("403: suspended account", async () => {
    mockAuthService.login.mockRejectedValue(
      AppError.forbidden("Your account has been suspended.")
    );

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send(VALID_LOGIN);

    expect(res.status).toBe(403);
  });

  it("400: rejects missing fields", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("200: returns new access token", async () => {
    mockAuthService.refreshToken.mockResolvedValue({ accessToken: "new.access.token" });

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "valid-refresh-token" });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBe("new.access.token");
  });

  it("401: invalid refresh token", async () => {
    mockAuthService.refreshToken.mockRejectedValue(
      AppError.unauthorized("Invalid or expired refresh token.")
    );

    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "bad-token" });

    expect(res.status).toBe(401);
  });

  it("400: missing refreshToken field", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("200: logs out authenticated user", async () => {
    mockAuthService.logout.mockResolvedValue(undefined);

    const token = makeGuestToken(GUEST_ID);
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("Logged out successfully.");
    expect(mockAuthService.logout).toHaveBeenCalled();
  });

  it("401: rejects unauthenticated", async () => {
    const res = await request(app).post("/api/v1/auth/logout");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("200: returns current user from JWT", async () => {
    const token = makeGuestToken(GUEST_ID);

    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(GUEST_ID);
    expect(res.body.data.userType).toBe("guest");
  });

  it("401: rejects expired/invalid token", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer invalid.jwt.token");

    expect(res.status).toBe(401);
  });
});
