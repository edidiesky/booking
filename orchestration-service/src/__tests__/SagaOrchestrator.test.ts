import {
  SagaDefinition,
  SagaOrchestrator,
  SagaPauseError,
  SagaStep,
} from "../services/SagaOrchestrator";
import { InMemorySagaStore } from "../repositories/inMemorySagaStore";

interface TestContext {
  bookingId?: string;
  value: number;
  log: string[];
}

function step(
  name: string,
  execute: SagaStep<TestContext>["execute"],
  compensate: SagaStep<TestContext>["compensate"] = async () => undefined,
): SagaStep<TestContext> {
  return { name, execute, compensate };
}

describe("SagaOrchestrator (production class)", () => {
  let store: InMemorySagaStore;
  let orchestrator: SagaOrchestrator;

  beforeEach(() => {
    store = new InMemorySagaStore();
    // Same class production uses; store path exercises identical run() logic.
    orchestrator = new SagaOrchestrator(store);
  });

  it("completes all steps", async () => {
    const def: SagaDefinition<TestContext> = {
      sagaType: "t",
      steps: [
        step("a", async (ctx) => ({ value: ctx.value + 1, log: [...ctx.log, "a"] })),
        step("b", async (ctx) => ({ value: ctx.value + 1, log: [...ctx.log, "b"] })),
      ],
    };
    const result = await orchestrator.start(def, { value: 0, log: [] });
    expect(result.status).toBe("completed");
    expect(result.context.log).toEqual(["a", "b"]);
    expect(store.getRow(result.sagaId)?.current_step).toBe(2);
  });

  it("pause advances current_step so resume does not re-run pay", async () => {
    let payRuns = 0;
    const def: SagaDefinition<TestContext> = {
      sagaType: "t",
      steps: [
        step("reserve", async (ctx) => ({
          bookingId: "b1",
          log: [...ctx.log, "reserve"],
        })),
        step("pay", async (ctx) => {
          payRuns += 1;
          throw new SagaPauseError("wait webhook");
        }),
        step("confirm", async (ctx) => ({ log: [...ctx.log, "confirm"] })),
      ],
    };

    const paused = await orchestrator.start(def, { value: 0, log: [] });
    expect(paused.status).toBe("running");
    expect(store.getRow(paused.sagaId)?.current_step).toBe(2);
    expect(payRuns).toBe(1);

    const done = await orchestrator.resume(def, paused.sagaId);
    expect(done.status).toBe("completed");
    expect(done.context.log).toEqual(["reserve", "confirm"]);
    expect(payRuns).toBe(1);
  });

  it("compensates prior steps in reverse on failure", async () => {
    const order: string[] = [];
    const def: SagaDefinition<TestContext> = {
      sagaType: "t",
      steps: [
        step(
          "reserve",
          async (ctx) => ({ bookingId: "b1", log: [...ctx.log, "r"] }),
          async () => {
            order.push("c-reserve");
          },
        ),
        step("pay", async () => {
          throw new Error("gateway down");
        }),
      ],
    };
    const result = await orchestrator.start(def, { value: 0, log: [] });
    expect(result.status).toBe("compensated");
    expect(order).toEqual(["c-reserve"]);
  });

  it("blocks concurrent claim while lease held", async () => {
    const def: SagaDefinition<TestContext> = {
      sagaType: "t",
      steps: [
        step("a", async (ctx) => ({ log: [...ctx.log, "a"] })),
        step("pay", async () => {
          throw new SagaPauseError("wait");
        }),
      ],
    };
    const paused = await orchestrator.start(def, { value: 0, log: [] });
    store.forceActiveLease(paused.sagaId, 60_000);
    const blocked = await orchestrator.resume(def, paused.sagaId);
    expect(blocked.status).toBe("running");
  });
});
