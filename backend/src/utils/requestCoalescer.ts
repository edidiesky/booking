import logger from "./logger";

class RequestCoalescer {
  private pending = new Map<string, Promise<unknown>>();

  async coalesce<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = this.pending.get(key);
    if (existing) {
      logger.debug("request_coalesced", { event: "request_coalesced", key });
      return existing as Promise<T>;
    }
    const promise = (async () => {
    try {
        return await fn();
    } finally {
        this.pending.delete(key);
    }
    })();

    this.pending.set(key, promise);
    return promise;
  }
}

export const requestCoalescer = new RequestCoalescer();