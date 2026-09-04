/**
 * Critical path unit tests
 */
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  paymentService,
  type InitializePaymentInput,
  type InitializePaymentResult,
} from "../../../domains/payment/payment.service";
import {
  paymentRepository,
  type Payment,
} from "../../../domains/payment/payment.repository";
import {
  bookingRepository,
  type Booking,
} from "../../../domains/booking/booking.repository";
import {
  idempotencyRepository,
  IdempotencyConflictError,
} from "../../../domains/idempotency/idempotency.repository";
import type {
  BookingStatus,
  PaymentGateway,
  PaymentStatus,
} from "../../../types";
import type { PoolClient } from "pg";
import { expectAppError } from "../../helpers/expectAppError";

jest.mock("../../../domains/payment/payment.repository");
jest.mock("../../../domains/booking/booking.repository");

jest.mock("../../../domains/idempotency/idempotency.repository", () => {
  class IdempotencyConflictError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "IdempotencyConflictError";
    }
  }
  return {
    IdempotencyConflictError,
    idempotencyRepository: {
      buildHash: jest.fn(() => "hash-1"),
      claim: jest.fn(),
      find: jest.fn(),
      markCompleted: jest.fn().mockResolvedValue(undefined as never),
      markFailed: jest.fn().mockResolvedValue(undefined as never),
    },
  };
});

jest.mock("../../../domains/outbox/outbox.repository", () => ({
  outboxRepository: { create: jest.fn().mockResolvedValue(undefined as never) },
}));
jest.mock("../../../domains/audit/audit.repository", () => ({
  auditRepository: { log: jest.fn().mockResolvedValue(undefined as never) },
}));
jest.mock("../../../domains/audit/auditEvent.repository", () => ({
  auditEventRepository: {
    record: jest.fn().mockResolvedValue(undefined as never),
  },
}));
jest.mock("../../../domains/auth/auth.repository", () => ({
  userRepository: { findById: jest.fn() },
}));

jest.mock("../../../strategies", () => ({
  paymentStrategies: { getAdapter: jest.fn() },
}));
jest.mock("@booking/shared", () => ({
  withTransaction: jest.fn(async (fn: (client: object) => Promise<unknown>) =>
    fn({}),
  ),
}));
jest.mock("../../../utils/requestCoalescer", () => ({
  requestCoalescer: {
    coalesce: jest.fn((_key: string, fn: () => Promise<unknown>) => fn()),
  },
}));
jest.mock("../../../utils/metrics", () => ({
  paymentInitializedCounter: { inc: jest.fn() },
  webhookProcessedCounter: { inc: jest.fn() },
  trackError: jest.fn(),
}));
jest.mock("../../../messaging/publisher", () => ({
  publishNotifyPaymentConfirmed: jest
    .fn()
    .mockResolvedValue(undefined as never),
  publishNotifyPaymentFailed: jest.fn().mockResolvedValue(undefined as never),
}));
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));
jest.mock("../../../context/requestContext", () => ({
  requestContext: { get: jest.fn().mockReturnValue({ requestId: "req-1" }) },
}));
jest.mock("uuid", () => ({ v4: jest.fn(() => "uuid-1") }));

const mockedPaymentRepo = paymentRepository as jest.Mocked<
  typeof paymentRepository
>;
const mockedBookingRepo = bookingRepository as jest.Mocked<
  typeof bookingRepository
>;
const mockedIdempotency = idempotencyRepository as jest.Mocked<
  typeof idempotencyRepository
>;

interface GatewayProcessResult {
  success: boolean;
  transactionId: string;
  redirectUrl: string;
  message: string;
}

interface GatewayAdapter {
  process: (input: Record<string, unknown>) => Promise<GatewayProcessResult>;
}

const { paymentStrategies } = jest.requireMock("../../../strategies") as {
  paymentStrategies: {
    getAdapter: jest.MockedFunction<() => GatewayAdapter>;
  };
};

function makeBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: "booking-1",
    booking_ref: "BK-001",
    tenant_id: "tenant-1",
    property_id: "prop-1",
    guest_email: "essien@gmail.com",
    guestEmail: "essien@gmail.com",
    room_type_id: "rt-1",
    guest_user_id: "guest-1",
    rooms_count: 1,
    check_in: "2026-09-10",
    check_out: "2026-09-12",
    nights: 2,
    guest_count: 2,
    total_amount_ngn: 50000,
    platform_fee_ngn: 5000,
    host_payout_ngn: 45000,
    status: "pending_payment" as BookingStatus,
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    receipt_url: "",
    tenant_email: "host@test.com",
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "payment-1",
    booking_id: "booking-1",
    tenant_id: "tenant-1",
    guest_user_id: "guest-1",
    gateway: "paystack" as PaymentGateway,
    amount_ngn: 50000,
    status: "pending" as PaymentStatus,
    idempotency_key: "pay:booking-1:paystack",
    metadata: {},
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

const validInput: InitializePaymentInput = {
  bookingId: "booking-1",
  guestUserId: "guest-1",
  email: "guest@test.com",
  gateway: "paystack",
  callbackUrl: "https://app.test/callback",
};

describe("PaymentService – critical paths", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedIdempotency.claim.mockResolvedValue({ id: "claim-1" } as never);
    mockedIdempotency.buildHash.mockReturnValue("hash-1");
  });

  describe("initializePayment", () => {
    it("rejects when email is missing", async () => {
      await expectAppError(
        paymentService.initializePayment({ ...validInput, email: "   " }),
        400,
        /email/i,
      );
    });

    it("rejects when booking does not exist", async () => {
      mockedBookingRepo.findById.mockResolvedValue(null);
      await expectAppError(paymentService.initializePayment(validInput), 404);
    });

    it("rejects when caller is not the booking guest", async () => {
      mockedBookingRepo.findById.mockResolvedValue(
        makeBooking({ guest_user_id: "other-guest" }),
      );
      await expectAppError(paymentService.initializePayment(validInput), 403);
    });

    it("rejects when booking is not in pending_payment status", async () => {
      mockedBookingRepo.findById.mockResolvedValue(
        makeBooking({ status: "confirmed" }),
      );
      await expectAppError(
        paymentService.initializePayment(validInput),
        409,
        /status/i,
      );
    });

    it("rejects with conflict when idempotency claim is already in flight", async () => {
      mockedBookingRepo.findById.mockResolvedValue(makeBooking());
      mockedIdempotency.claim.mockRejectedValue(new IdempotencyConflictError());
      await expectAppError(
        paymentService.initializePayment(validInput),
        409,
        /already being processed/i,
      );
    });

    it("returns cached result when idempotency claim is already completed", async () => {
      mockedBookingRepo.findById.mockResolvedValue(makeBooking());
      mockedIdempotency.claim.mockResolvedValue(null as never);
      const cached: InitializePaymentResult = {
        paymentId: "payment-1",
        transactionId: "tx-cached",
        redirectUrl: "https://pay.stack/redirect",
        amountNgn: 50000,
      };
      mockedIdempotency.find.mockResolvedValue({
        response_body: cached,
      } as never);

      const result = await paymentService.initializePayment(validInput);
      expect(result).toEqual(cached);
    });

    it("creates payment, calls gateway, and returns redirect on success", async () => {
      mockedBookingRepo.findById.mockResolvedValue(makeBooking());
      mockedPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockedPaymentRepo.create.mockResolvedValue(makePayment());
      mockedPaymentRepo.updateStatus.mockResolvedValue(
        makePayment({ status: "pending", transaction_id: "tx-1" }),
      );

      const processMock = jest
        .fn<(input: Record<string, unknown>) => Promise<GatewayProcessResult>>()
        .mockResolvedValue({
          success: true,
          transactionId: "tx-1",
          redirectUrl: "https://pay.stack/redirect",
          message: "ok",
        });

      paymentStrategies.getAdapter.mockReturnValue({ process: processMock });

      const result = await paymentService.initializePayment(validInput);

      expect(result.paymentId).toBe("payment-1");
      expect(result.transactionId).toBe("tx-1");
      expect(result.redirectUrl).toBe("https://pay.stack/redirect");
      expect(result.amountNgn).toBe(50000);
      expect(mockedIdempotency.markCompleted).toHaveBeenCalled();
    });

    it("marks payment failed and throws when gateway is unavailable", async () => {
      mockedBookingRepo.findById.mockResolvedValue(makeBooking());
      mockedPaymentRepo.findByIdempotencyKey.mockResolvedValue(null);
      mockedPaymentRepo.create.mockResolvedValue(makePayment());
      mockedPaymentRepo.updateStatus.mockResolvedValue(
        makePayment({ status: "failed" }),
      );

      const processMock = jest
        .fn<(input: Record<string, unknown>) => Promise<GatewayProcessResult>>()
        .mockRejectedValue(new Error("gateway down"));

      paymentStrategies.getAdapter.mockReturnValue({ process: processMock });

      await expectAppError(
        paymentService.initializePayment(validInput),
        400,
        /unavailable/i,
      );

      expect(mockedPaymentRepo.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({ status: "failed" }),
      );
      expect(mockedIdempotency.markFailed).toHaveBeenCalled();
    });
  });

  describe("processWebhookSuccess", () => {
    const mockClient = { query: jest.fn() } as unknown as PoolClient;

    it("rejects when payment is not found for transactionId", async () => {
      mockedPaymentRepo.findByTransactionId.mockResolvedValue(null);
      await expectAppError(
        paymentService.processWebhookSuccess(
          {
            transactionId: "tx-missing",
            amount: 50000,
            gateway: "paystack",
            rawPayload: {},
            metadata: {},
          },
          mockClient,
        ),
        404,
      );
    });

    it("marks payment failed when received amount is less than expected", async () => {
      mockedPaymentRepo.findByTransactionId.mockResolvedValue(
        makePayment({ amount_ngn: 50000, transaction_id: "tx-1" }),
      );
      mockedPaymentRepo.updateStatus.mockResolvedValue(
        makePayment({ status: "failed" }),
      );

      await expectAppError(
        paymentService.processWebhookSuccess(
          {
            transactionId: "tx-1",
            amount: 40000,
            gateway: "paystack",
            rawPayload: {},
            metadata: {},
          },
          mockClient,
        ),
        400,
        /mismatch/i,
      );

      expect(mockedPaymentRepo.updateStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "failed",
          metadata: expect.objectContaining({
            failureReason: "Amount mismatch",
          }),
        }),
        mockClient,
      );
    });
  });
});
