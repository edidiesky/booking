/**
 * End-to-end saga simulation with in-process fakes (no HTTP / no Docker).
 * Proves step order, pause/resume, and compensation against fake participants.
 */
import {
  SagaDefinition,
  SagaOrchestrator,
  SagaPauseError,
} from "../services/SagaOrchestrator";
import { InMemorySagaStore } from "../repositories/inMemorySagaStore";

interface Ctx {
  bookingId?: string;
  tenantId: string;
  totalAmountNgn: number;
  platformFeeNgn: number;
  paymentInitiated?: boolean;
  escrowReleased?: boolean;
  confirmed?: boolean;
}

describe("booking_payment saga simulation", () => {
  it("happy path: reserve → pay(pause) → resume → escrow → confirm", async () => {
    const released: string[] = [];
    const store = new InMemorySagaStore();
    const orch = new SagaOrchestrator(store);

    const def: SagaDefinition<Ctx> = {
      sagaType: "booking_payment",
      steps: [
        {
          name: "reserve",
          async execute(ctx) {
            return { bookingId: "booking-1" };
          },
          async compensate(ctx) {
            if (ctx.bookingId) released.push(`release:${ctx.bookingId}`);
          },
        },
        {
          name: "initiate_payment",
          async execute() {
            throw new SagaPauseError("waiting for webhook");
          },
          async compensate(ctx) {
            released.push(`refund:${ctx.bookingId}`);
          },
        },
        {
          name: "release_escrow",
          async execute(ctx) {
            return { escrowReleased: true, paymentInitiated: true };
          },
          async compensate() {
            released.push("admin_review");
          },
        },
        {
          name: "confirm_booking",
          async execute() {
            return { confirmed: true };
          },
          async compensate() {},
        },
      ],
    };

    const paused = await orch.start(def, {
      tenantId: "t1",
      totalAmountNgn: 10000,
      platformFeeNgn: 1000,
    });
    expect(paused.status).toBe("running");
    expect(paused.context.bookingId).toBe("booking-1");

    const done = await orch.resume(def, paused.sagaId);
    expect(done.status).toBe("completed");
    expect(done.context.escrowReleased).toBe(true);
    expect(done.context.confirmed).toBe(true);
    expect(released).toEqual([]);
  });

  it("failure after reserve compensates release only", async () => {
    const compensated: string[] = [];
    const store = new InMemorySagaStore();
    const orch = new SagaOrchestrator(store);

    const def: SagaDefinition<Ctx> = {
      sagaType: "booking_payment",
      steps: [
        {
          name: "reserve",
          async execute() {
            return { bookingId: "booking-2" };
          },
          async compensate(ctx) {
            compensated.push(`release:${ctx.bookingId}`);
          },
        },
        {
          name: "initiate_payment",
          async execute() {
            throw new Error("gateway down");
          },
          async compensate(ctx) {
            compensated.push(`refund:${ctx.bookingId}`);
          },
        },
      ],
    };

    const result = await orch.start(def, {
      tenantId: "t1",
      totalAmountNgn: 1000,
      platformFeeNgn: 100,
    });
    expect(result.status).toBe("compensated");
    expect(compensated).toEqual(["release:booking-2"]);
  });
});
