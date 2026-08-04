import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { PROPERTY_ID as _unused, TENANT_ID } from "../../setup/fixtures";

jest.mock("@booking/shared", () => ({ query: jest.fn(), queryOne: jest.fn() }));
jest.mock("../../utils/metrics", () => ({ trackError: jest.fn() }));
jest.mock("../../context/requestContext", () => ({
  requestContext: { get: jest.fn(() => undefined) },
}));
jest.mock("../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import { query, queryOne } from "@booking/shared";
import { trackError } from "../../../utils/metrics";
import { paymentRepository } from "../../../domains/payment/payment.repository";

const mockQuery      = query      as jest.MockedFunction<typeof query>;
const mockQueryOne   = queryOne   as jest.MockedFunction<typeof queryOne>;
const mockTrackError = trackError as jest.MockedFunction<typeof trackError>;

function makePaymentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "payment-1", booking_id: "booking-1", tenant_id: TENANT_ID,
    guest_user_id: "guest-1", gateway: "paystack", amount_ngn: 50000,
    status: "pending", idempotency_key: "idem-1", metadata: {},
    created_at: new Date(), updated_at: new Date(),
    ...overrides,
  };
}

describe("paymentRepository", () => {
  beforeEach(() => {jest.clearAllMocks()});

  describe("create", () => {
    it("inserts with a stringified metadata JSON payload", async () => {
      mockQueryOne.mockResolvedValue(makePaymentRow() as never);

      await paymentRepository.create({
        bookingId: "booking-1", tenantId: TENANT_ID, guestUserId: "guest-1",
        gateway: "paystack", amountNgn: 50000, idempotencyKey: "idem-1",
        metadata: { foo: "bar" },
      });

      const [, params] = mockQueryOne.mock.calls[0] as [string, unknown[]];
      expect(params).toContain(JSON.stringify({ foo: "bar" }));
    });

    it("defaults metadata to an empty object when not provided", async () => {
      mockQueryOne.mockResolvedValue(makePaymentRow() as never);

      await paymentRepository.create({
        bookingId: "booking-1", tenantId: TENANT_ID, guestUserId: "guest-1",
        gateway: "paystack", amountNgn: 50000, idempotencyKey: "idem-1",
      });

      const [, params] = mockQueryOne.mock.calls[0] as [string, unknown[]];
      expect(params).toContain("{}");
    });

    it("uses the transaction client directly when provided, bypasses queryOne", async () => {
      const mockClient = { query: jest.fn().mockResolvedValue({ rows: [makePaymentRow()] }) };

      await paymentRepository.create(
        { bookingId: "booking-1", tenantId: TENANT_ID, guestUserId: "guest-1", gateway: "paystack", amountNgn: 50000, idempotencyKey: "idem-1" },
        mockClient as never,
      );

      expect(mockClient.query).toHaveBeenCalled();
      expect(mockQueryOne).not.toHaveBeenCalled();
    });

    it("tracks the failure and rethrows when the insert fails", async () => {
      mockQueryOne.mockRejectedValue(new Error("connection reset"));

      await expect(
        paymentRepository.create({ bookingId: "booking-1", tenantId: TENANT_ID, guestUserId: "guest-1", gateway: "paystack", amountNgn: 50000, idempotencyKey: "idem-1" }),
      ).rejects.toThrow("connection reset");

      expect(mockTrackError).toHaveBeenCalledWith("payment_create_failed", "payment_repository", "high");
    });
  });

  describe("updateStatus", () => {
    it("always includes status and updated_at, adds optional fields only when provided", async () => {
      mockQueryOne.mockResolvedValue(makePaymentRow({ status: "success" }) as never);

      await paymentRepository.updateStatus({ id: "payment-1", status: "success" });

      const [sql, params] = mockQueryOne.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("status = $1");
      expect(sql).toContain("updated_at = now()");
      expect(sql).not.toContain("transaction_id = $");
      expect(params).toEqual(["success", "payment-1"]);
    });

    it("adds transactionId, channel, and paidAt as separate params when given", async () => {
      mockQueryOne.mockResolvedValue(makePaymentRow({ status: "success" }) as never);
      const paidAt = new Date();

      await paymentRepository.updateStatus({
        id: "payment-1", status: "success",
        transactionId: "txn-123", channel: "card", paidAt,
      });

      const [sql, params] = mockQueryOne.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("transaction_id = $2");
      expect(sql).toContain("channel = $3");
      expect(sql).toContain("paid_at = $4");
      expect(params).toEqual(["success", "txn-123", "card", paidAt, "payment-1"]);
    });

    it("returns null when no payment matches the id", async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await paymentRepository.updateStatus({ id: "missing-id", status: "failed" });

      expect(result).toBeNull();
    });
  });

  describe("findByIdempotencyKey", () => {
    it("is the idempotency check callers rely on before inserting a duplicate payment", async () => {
      mockQueryOne.mockResolvedValue(makePaymentRow() as never);

      const result = await paymentRepository.findByIdempotencyKey("idem-1");

      expect(result?.idempotency_key).toBe("idem-1");
    });
  });
});