import type Redis from "ioredis";
import type { RateLimitEngine } from "./engine";

const CHANNEL = "gateway:rules:sync";

export interface RulesSyncMessage {
  type: "rules:reload";
}

export class RulesSyncPubSub {
  private readonly subscriber: Redis;

  constructor(
    private readonly redis: Redis,
    private readonly engine: RateLimitEngine,
    private readonly onError?: (err: unknown) => void,
  ) {
    this.subscriber = redis.duplicate();
  }

  async subscribe(): Promise<void> {
    await this.subscriber.subscribe(CHANNEL);

    this.subscriber.on("message", async (channel, message) => {
      if (channel !== CHANNEL) return;
      try {
        const payload = JSON.parse(message) as RulesSyncMessage;
        if (payload.type === "rules:reload") {
          await this.engine.reload();
        }
      } catch (err) {
        this.onError?.(err);
      }
    });

    this.subscriber.on("error", (err) => this.onError?.(err));
  }

  // Fire-and-forget deliberately, see ADR-020: this is the fast path,
  // the engine's own periodic reload is the actual guarantee. A failed
  // publish here should not fail whatever admin action triggered it
  // (the rule was already durably written to Postgres by that point).
  async publishReload(): Promise<void> {
    try {
      await this.redis.publish(CHANNEL, JSON.stringify({ type: "rules:reload" } satisfies RulesSyncMessage));
    } catch (err) {
      this.onError?.(err);
    }
  }

  async disconnect(): Promise<void> {
    await this.subscriber.unsubscribe(CHANNEL);
    await this.subscriber.quit();
  }
}