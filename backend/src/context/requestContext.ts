import { AsyncLocalStorage } from "async_hooks";
import type { PoolClient } from "pg";

export interface RequestContext {
  requestId:    string;
  userId?:      string;
  tenantId?:    string;
  tenantSlug?:  string;
  userType?:    string;
  traceId?:     string;
  spanId?:      string;
  method?:      string;
  path?:        string;
  eventType?:   string;
  dbClient?:    PoolClient;
}

class RequestContextStore {
  private storage = new AsyncLocalStorage<RequestContext>();
  run(ctx: RequestContext, fn: () => void): void { this.storage.run(ctx, fn); }
  get(): RequestContext | undefined               { return this.storage.getStore(); }
  set(update: Partial<RequestContext>): void {
    const store = this.storage.getStore();
    if (store) Object.assign(store, update);
  }
}

export const requestContext = new RequestContextStore();