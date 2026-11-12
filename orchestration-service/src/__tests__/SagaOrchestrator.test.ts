import {
  SagaDefinition, SagaOrchestrator, SagaPauseError, SagaStep,
} from "../services/SagaOrchestrator";
import { InMemorySagaStore } from "../repositories/inMemorySagaStore";

interface Ctx {
  bookingId?: string;
  value: number;
  log: string[];
  redirectUrl?: string;
}

const noop = async () => undefined;
function step(
  name: string,
  execute: SagaStep<Ctx>["execute"],
  compensate: SagaStep<Ctx>["compensate"] = noop,
  extra: Partial<SagaStep<Ctx>> = {},
): SagaStep<Ctx> {
  return { name, execute, compensate, ...extra };
}
const transient = () => Object.assign(new Error("boom"), { transient: true });

describe("SagaOrchestrator", () => {
  let store: InMemorySagaStore;
  let orch: SagaOrchestrator;
  beforeEach(() => {
    store = new InMemorySagaStore();
    orch = new SagaOrchestrator(store);
  });

  it("completes all steps", async () => {
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("a", async (c) => ({ log: [...c.log, "a"] })),
        step("b", async (c) => ({ log: [...c.log, "b"] })),
      ],
    };
    const r = await orch.start(def, { value: 0, log: [] });
    expect(r.status).toBe("completed");
    expect(r.context.log).toEqual(["a", "b"]);
  });

  it("persists data carried by SagaPauseError (redirectUrl was being dropped)", async () => {
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("reserve", async () => ({ bookingId: "b1" })),
        step("pay", async () => {
          throw new SagaPauseError("wait", { redirectUrl: "https://pay/1" });
        }),
        step("confirm", async (c) => ({ log: [...c.log, "confirm"] })),
      ],
    };
    const paused = await orch.start(def, { value: 0, log: [] });
    expect(paused.status).toBe("running");
    expect(paused.context.redirectUrl).toBe("https://pay/1");
    // survives in the store, not just the response
    expect((await store.findById(paused.sagaId))?.context).toMatchObject({ redirectUrl: "https://pay/1" });

    const done = await orch.resume(def, paused.sagaId);
    expect(done.status).toBe("completed");
    expect(done.context.redirectUrl).toBe("https://pay/1");
  });

  it("compensates prior steps in reverse and reports the error", async () => {
    const order: string[] = [];
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("a", async () => ({ bookingId: "b1" }), async () => void order.push("c-a")),
        step("b", async () => ({}), async () => void order.push("c-b")),
        step("c", async () => { throw new Error("gateway down"); }),
      ],
    };
    const r = await orch.start(def, { value: 0, log: [] });
    expect(r.status).toBe("compensated");
    expect(r.error).toBe("gateway down");
    expect(order).toEqual(["c-b", "c-a"]);
  });

  it("a failed compensation is retried, NOT reported as compensated", async () => {
    let attempts = 0;
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("a", async () => ({ bookingId: "b1" }), async () => {
          attempts += 1;
          if (attempts === 1) throw new Error("release 503");
        }),
        step("b", async () => { throw new Error("nope"); }),
      ],
    };
    const r = await orch.start(def, { value: 0, log: [] });
    expect(r.status).toBe("compensating");
    expect(store.getRow(r.sagaId)?.status).toBe("compensating");

    store.expireLease(r.sagaId); // sweeper time
    const again = await orch.resume(def, r.sagaId);
    expect(again.status).toBe("compensated");
    expect(attempts).toBe(2);
  });

  it("resuming a compensating saga never runs forward steps again", async () => {
    let forwardRuns = 0;
    let fail = true;
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("a", async () => { forwardRuns += 1; return {}; }, async () => {
          if (fail) throw new Error("x");
        }),
        step("b", async () => { throw new Error("boom"); }),
      ],
    };
    const r = await orch.start(def, { value: 0, log: [] });
    expect(r.status).toBe("compensating");
    fail = false;
    store.expireLease(r.sagaId);
    await orch.resume(def, r.sagaId);
    expect(forwardRuns).toBe(1);
  });

  it("does not repeat compensations that already succeeded", async () => {
    const calls: string[] = [];
    let failA = true;
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("a", async () => ({}), async () => {
          calls.push("a");
          if (failA) throw new Error("a down");
        }),
        step("b", async () => ({}), async () => void calls.push("b")),
        step("c", async () => { throw new Error("boom"); }),
      ],
    };
    const r = await orch.start(def, { value: 0, log: [] });
    failA = false;
    store.expireLease(r.sagaId);
    await orch.resume(def, r.sagaId);
    expect(calls).toEqual(["b", "a", "a"]); // b ran once
  });

  it("webhook while the saga is still running records a signal, and the pause consumes it", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("reserve", async () => ({ bookingId: "b1" })),
        step("pay", async () => {
          await gate; // webhook arrives during this step
          throw new SagaPauseError("wait", { redirectUrl: "u" });
        }),
        step("confirm", async (c) => ({ log: [...c.log, "confirm"] })),
      ],
    };
    const running = orch.start(def, { value: 0, log: [] });
    await new Promise((r) => setTimeout(r, 20));
    const early = await orch.resumeByBookingId(def, "b1");
    expect(early).toEqual({ status: "signal_recorded", bookingId: "b1" });
    release();
    const result = await running;
    expect(result.status).toBe("completed"); // lost wakeup recovered
    expect(result.context.log).toEqual(["confirm"]);
  });

  it("resume after completion is an idempotent no-op (no stale signal)", async () => {
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("reserve", async () => ({ bookingId: "b1" })),
        step("pay", async () => { throw new SagaPauseError("w"); }),
        step("confirm", async () => ({})),
      ],
    };
    await orch.start(def, { value: 0, log: [] });
    const first = await orch.resumeByBookingId(def, "b1");
    expect((first as any).status).toBe("completed");
    const second = await orch.resumeByBookingId(def, "b1");
    expect(second).toMatchObject({ status: "completed", idempotent: true });
    expect(await store.consumeResumeSignal("b1")).toBe(false);
  });

  it("concurrent resumes execute the continuation exactly once", async () => {
    let confirms = 0;
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("reserve", async () => ({ bookingId: "b1" })),
        step("pay", async () => { throw new SagaPauseError("w"); }),
        step("confirm", async () => {
          confirms += 1;
          await new Promise((r) => setTimeout(r, 30));
          return {};
        }),
      ],
    };
    await orch.start(def, { value: 0, log: [] });
    await Promise.all([
      orch.resumeByBookingId(def, "b1"),
      orch.resumeByBookingId(def, "b1"),
      orch.resumeByBookingId(def, "b1"),
    ]);
    expect(confirms).toBe(1);
  });

  it("forwardOnly step: transient failure retries forward, never compensates", async () => {
    let comp = 0;
    let tries = 0;
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("reserve", async () => ({ bookingId: "b1" }), async () => void (comp += 1)),
        step("pay", async () => { throw new SagaPauseError("w"); }, async () => void (comp += 1)),
        step("escrow", async () => {
          tries += 1;
          if (tries < 3) throw transient();
          return {};
        }, noop, { forwardOnly: true, onPermanentFailure: "fail" }),
      ],
    };
    const paused = await orch.start(def, { value: 0, log: [] });
    const r1 = await orch.resume(def, paused.sagaId);
    expect(r1.status).toBe("running");
    store.expireLease(paused.sagaId);
    const r2 = await orch.resume(def, paused.sagaId);
    expect(r2.status).toBe("running");
    store.expireLease(paused.sagaId);
    const r3 = await orch.resume(def, paused.sagaId);
    expect(r3.status).toBe("completed");
    expect(comp).toBe(0);
  });

  it("forwardOnly step: permanent failure with policy 'fail' flags review, no refund", async () => {
    let comp = 0;
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("reserve", async () => ({ bookingId: "b1" }), async () => void (comp += 1)),
        step("pay", async () => { throw new SagaPauseError("w"); }, async () => void (comp += 1)),
        step("escrow", async () => { throw new Error("400 bad"); }, noop,
          { forwardOnly: true, onPermanentFailure: "fail" }),
      ],
    };
    const paused = await orch.start(def, { value: 0, log: [] });
    const r = await orch.resume(def, paused.sagaId);
    expect(r.status).toBe("failed");
    expect(comp).toBe(0);
  });

  it("start with the same idempotency key does not run the saga twice", async () => {
    let runs = 0;
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [step("a", async () => { runs += 1; return {}; })],
    };
    const a = await orch.start(def, { value: 0, log: [] }, { idempotencyKey: "k1" });
    const b = await orch.start(def, { value: 0, log: [] }, { idempotencyKey: "k1" });
    expect(b.sagaId).toBe(a.sagaId);
    expect(b.idempotent).toBe(true);
    expect(runs).toBe(1);
  });

  it("one ACTIVE saga per booking: a second start returns the first; after it ends a new one may start", async () => {
    let runs = 0;
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [step("pay", async () => { runs += 1; throw new SagaPauseError("w"); }), step("done", async () => ({}))],
    };
    const a = await orch.start(def, { bookingId: "bk", value: 0, log: [] });
    const b = await orch.start(def, { bookingId: "bk", value: 0, log: [] });
    expect(b.sagaId).toBe(a.sagaId);
    expect(b.idempotent).toBe(true);
    expect(runs).toBe(1);

    await orch.resume(def, a.sagaId); // finishes -> completed
    const c = await orch.start(def, { bookingId: "bk", value: 0, log: [] });
    expect(c.sagaId).not.toBe(a.sagaId);
  });

  it("expire() claims first, so it cannot race a held lease", async () => {
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [
        step("reserve", async () => ({ bookingId: "b1" })),
        step("pay", async () => { throw new SagaPauseError("w"); }),
      ],
    };
    const paused = await orch.start(def, { value: 0, log: [] });
    store.forceActiveLease(paused.sagaId, 60_000);
    expect(await orch.expire(def, paused.sagaId, "timeout")).toBeNull();
    store.expireLease(paused.sagaId);
    const r = await orch.expire(def, paused.sagaId, "timeout");
    expect(r?.status).toBe("compensated");
  });

  it("blocks concurrent claim while lease held", async () => {
    const def: SagaDefinition<Ctx> = {
      sagaType: "t",
      steps: [step("a", async () => ({})), step("pay", async () => { throw new SagaPauseError("w"); })],
    };
    const paused = await orch.start(def, { value: 0, log: [] });
    store.forceActiveLease(paused.sagaId, 60_000);
    expect((await orch.resume(def, paused.sagaId)).status).toBe("running");
  });

  describe("pause timeout verification", () => {
    const build = (decision: () => Promise<"resume" | "compensate">, calls: string[]): SagaDefinition<Ctx> => ({
      sagaType: "t",
      steps: [
        step("reserve", async () => ({ bookingId: "b1" }), async () => void calls.push("c-reserve")),
        step("pay", async () => { throw new SagaPauseError("w"); }, async () => void calls.push("c-pay"), {
          onPauseTimeout: decision,
        }),
        step("confirm", async () => { calls.push("confirm"); return {}; }),
      ],
    });

    it("payment actually succeeded (lost resume): continues forward, never compensates", async () => {
      const calls: string[] = [];
      const def = build(async () => "resume", calls);
      const paused = await orch.start(def, { value: 0, log: [] });
      const r = await orch.expire(def, paused.sagaId, "timeout");
      expect(r?.status).toBe("completed");
      expect(calls).toEqual(["confirm"]);
    });

    it("not paid: compensates as before", async () => {
      const calls: string[] = [];
      const def = build(async () => "compensate", calls);
      const paused = await orch.start(def, { value: 0, log: [] });
      const r = await orch.expire(def, paused.sagaId, "timeout");
      expect(r?.status).toBe("compensated");
      expect(calls).toEqual(["c-pay", "c-reserve"]);
    });

    it("cannot verify (payment service down): does NOT compensate on a guess", async () => {
      const calls: string[] = [];
      const def = build(async () => { throw new Error("payment-service down"); }, calls);
      const paused = await orch.start(def, { value: 0, log: [] });
      const r = await orch.expire(def, paused.sagaId, "timeout");
      expect(r).toBeNull();
      expect(calls).toEqual([]);
      expect(store.getRow(paused.sagaId)?.status).toBe("running");
      expect(store.getRow(paused.sagaId)?.claimed_by).toBeNull(); // lease released for the next sweep
    });
  });
});


