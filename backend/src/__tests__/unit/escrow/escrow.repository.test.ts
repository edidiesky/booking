
import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import {
  escrowRepository,
  type EscrowRecord,
} from "../../../domains/escrow/escrow.repository";
import type { EscrowStatus } from "../../../types";
import type { PoolClient } from "pg";

jest.mock("@booking/shared", () => ({
  query: jest.fn(),
  queryOne: jest.fn(),
}));
jest.mock("../../../messaging/publisher", () => ({
  publishEscrowReleased: jest.fn(),
  publishEscrowRefunded: jest.fn(),
}));
jest.mock("../../../utils/metrics", () => ({
  escrowHeldGauge: { inc: jest.fn(), dec: jest.fn() },
}));
jest.mock("../../../utils/logger", () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const { publishEscrowReleased, publishEscrowRefunded } = jest.requireMock(
  "../../../messaging/publisher",
) as {
  publishEscrowReleased: jest.Mock;
  publishEscrowRefunded: jest.Mock;
};
const { escrowHeldGauge } = jest.requireMock("../../../utils/metrics") as {
  escrowHeldGauge: { inc: jest.Mock; dec: jest.Mock };
};

function makeEscrow(overrides: Partial<EscrowRecord> = {}): EscrowRecord {
  return {
    id: "escrow-1",
    booking_id: "booking-1",
    tenant_id: "tenant-1",
    amount_ngn: 50000,
    platform_fee_ngn: 5000,
    host_payout_ngn: 45000,
    status: "held" as EscrowStatus,
    held_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

function makeClient(rows: Record<string, unknown>[] = []): PoolClient {
  return {
    query: jest.fn().mockResolvedValue({ rows } as never),
  } as unknown as PoolClient;
}

describe("escrowRepository – money paths", () => {
  beforeEach(() => {jest.clearAllMocks()});

  it("create holds escrow and increments gauge", async () => {
    const client = makeClient([makeEscrow()]);
    const result = await escrowRepository.create(
      {
        bookingId: "booking-1",
        tenantId: "tenant-1",
        amountNgn: 50000,
        platformFeeNgn: 5000,
        hostPayoutNgn: 45000,
      },
      client,
    );
    expect(result.id).toBe("escrow-1");
    expect(escrowHeldGauge.inc).toHaveBeenCalledWith(
      { tenant_id: "tenant-1" },
      45000,
    );
  });

  it("release transitions held → released", async () => {
    const client = makeClient([
      makeEscrow({ status: "released", released_at: new Date() }),
    ]);
    const result = await escrowRepository.release("booking-1", client);
    expect(result?.status).toBe("released");
    expect(publishEscrowReleased).toHaveBeenCalled();
    expect(escrowHeldGauge.dec).toHaveBeenCalled();
  });

  it("release returns null when nothing held", async () => {
    const client = makeClient([]);
    expect(await escrowRepository.release("booking-1", client)).toBeNull();
  });

  it("initiateRefund full → refunded", async () => {
    const held = makeEscrow();
    const refunded = makeEscrow({
      status: "refunded",
      refund_amount_ngn: 50000,
    });
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [held] } as never)
        .mockResolvedValueOnce({ rows: [refunded] } as never),
    } as unknown as PoolClient;
    const result = await escrowRepository.initiateRefund(
      "booking-1",
      50000,
      client,
    );
    expect(result?.status).toBe("refunded");
    expect(publishEscrowRefunded).toHaveBeenCalled();
  });

  it("initiateRefund partial → partially_refunded", async () => {
    const held = makeEscrow();
    const partial = makeEscrow({
      status: "partially_refunded",
      refund_amount_ngn: 20000,
    });
    const client = {
      query: jest
        .fn()
        .mockResolvedValueOnce({ rows: [held] } as never)
        .mockResolvedValueOnce({ rows: [partial] } as never),
    } as unknown as PoolClient;
    const result = await escrowRepository.initiateRefund(
      "booking-1",
      20000,
      client,
    );
    expect(result?.status).toBe("partially_refunded");
  });
});