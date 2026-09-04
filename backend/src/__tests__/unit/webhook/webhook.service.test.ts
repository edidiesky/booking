import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { webhookService } from "../../../domains/webhook/webhook.service";
import {
  paymentRepository,
  type Payment,
} from "../../../domains/payment/payment.repository";
import { paymentService } from "../../../domains/payment/payment.service";
import { bookingService } from "../../../domains/booking/booking.service";
import type { PaymentGateway, PaymentStatus } from "../../../types";
import { expectAppError } from "../../helpers/expectAppError";

jest.mock("../../../config/redis", () => ({
  __esModule: true,
  default: {
    setnx: jest.fn(),
    expire: jest.fn().mockResolvedValue(1 as never),
    del: jest.fn().mockResolvedValue(1 as never),
  },
}));
import redisClient from "../../../config/redis";
const redis = redisClient as unknown as {
  setnx: jest.Mock;
  expire: jest.Mock;
  del: jest.Mock;
};

jest.mock("../../../strategies", () => ({
  paymentStrategies: { getAdapter: jest.fn() },
}));
import { paymentStrategies as paymentStrategiesImport } from "../../../strategies";

jest.mock("../../../domains/payment/payment.repository");
jest.mock("../../../domains/payment/payment.service", () => ({
  paymentService: {
    processWebhookSuccess: jest.fn().mockResolvedValue(undefined as never),
    processWebhookFailure: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../domains/booking/booking.service", () => ({
  bookingService: {
    confirmBookingByPayment: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../domains/webhook/webhook.repository", () => ({
  webhookRepository: {
    logFailure: jest.fn().mockResolvedValue(undefined as never),
    getPendingRetries: jest.fn().mockResolvedValue([] as never),
    markCompleted: jest.fn().mockResolvedValue(undefined as never),
    incrementRetry: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("@booking/shared", () => ({
  withTransaction: jest.fn(async (fn: (c: object) => Promise<unknown>) =>
    fn({}),
  ),
}));
jest.mock("../../../utils/AppError", () => {
  class AppError extends Error {
    statusCode: number;
    constructor(message: string, statusCode = 400) {
      super(message);
      this.statusCode = statusCode;
    }
    static unauthorized(m: string) {
      return new AppError(m, 401);
    }
    static badRequest(m: string) {
      return new AppError(m, 400);
    }
    static notFound(m: string) {
      return new AppError(m, 404);
    }
    static conflict(m: string) {
      return new AppError(m, 409);
    }
  }
  return { AppError };
});
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock("../../../utils/metrics", () => ({ trackError: jest.fn() }));

const mockedPaymentRepo = paymentRepository as jest.Mocked<
  typeof paymentRepository
>;
const mockedPaymentService = paymentService as jest.Mocked<
  typeof paymentService
>;
const mockedBookingService = bookingService as jest.Mocked<
  typeof bookingService
>;
const paymentStrategies = paymentStrategiesImport as unknown as {
  getAdapter: jest.Mock;
};

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "payment-1",
    booking_id: "booking-1",
    tenant_id: "tenant-1",
    guest_user_id: "guest-1",
    gateway: "paystack" as PaymentGateway,
    amount_ngn: 50000,
    status: "pending" as PaymentStatus,
    transaction_id: "tx-1",
    idempotency_key: "pay:booking-1:paystack",
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeAdapter(overrides: Record<string, unknown> = {}) {
  return {
    verifyWebhook: jest.fn(() => true),
    extractTransactionId: jest.fn(() => "tx-1"),
    extractStatus: jest.fn(() => "success"),
    extractAmount: jest.fn(() => 50000),
    extractMetadata: jest.fn(() => ({ channel: "card" })),
    ...overrides,
  };
}

describe("webhookService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    redis.setnx.mockResolvedValue(1 as never);
    paymentStrategies.getAdapter.mockReturnValue(makeAdapter());
    mockedPaymentRepo.findByTransactionId.mockResolvedValue(
      makePayment() as never,
    );
  });

  it("rejects invalid signature", async () => {
    paymentStrategies.getAdapter.mockReturnValue(
      makeAdapter({ verifyWebhook: () => false }),
    );
    await expectAppError(
      webhookService.process("paystack", { event: "charge.success" }, "bad"),
      401,
      /Invalid webhook signature/i,
    );
  });

  it("rejects missing transactionId", async () => {
    paymentStrategies.getAdapter.mockReturnValue(
      makeAdapter({ extractTransactionId: () => null }),
    );
    await expectAppError(
      webhookService.process("paystack", {}, "sig"),
      400,
      /Missing transaction reference/i,
    );
  });

  it("rejects when Redis lock held", async () => {
    redis.setnx.mockResolvedValue(0 as never);
    await expectAppError(
      webhookService.process("paystack", {}, "sig"),
      409,
      /processing in progress/i,
    );
  });

  it("releases lock in finally", async () => {
    mockedPaymentRepo.findByTransactionId.mockResolvedValue(null as never);
    await expectAppError(webhookService.process("paystack", {}, "sig"), 404);
    expect(redis.del).toHaveBeenCalledWith("webhook:lock:tx-1");
  });

  it("no-op when already success", async () => {
    mockedPaymentRepo.findByTransactionId.mockResolvedValue(
      makePayment({ status: "success" }) as never,
    );
    await webhookService.process("paystack", {}, "sig");
    expect(mockedPaymentService.processWebhookSuccess).not.toHaveBeenCalled();
  });

  it("success path: payment + confirm booking", async () => {
    await webhookService.process("paystack", { id: "evt" }, "sig");
    expect(mockedPaymentService.processWebhookSuccess).toHaveBeenCalled();
    expect(mockedBookingService.confirmBookingByPayment).toHaveBeenCalledWith(
      "booking-1",
      "tx-1",
    );
  });

  it("failure path", async () => {
    paymentStrategies.getAdapter.mockReturnValue(
      makeAdapter({ extractStatus: () => "failed" }),
    );
    await webhookService.process("paystack", {}, "sig");
    expect(mockedPaymentService.processWebhookFailure).toHaveBeenCalled();
    expect(mockedBookingService.confirmBookingByPayment).not.toHaveBeenCalled();
  });
});
