import { Response }  from "express";
import redisClient   from "../../config/redis";
import logger        from "../../utils/logger";
import { requestContext } from "../../context/requestContext";

export interface SSEEvent {
  type:    string;
  payload: unknown;
}


const HEARTBEAT_INTERVAL_MS = 25_000;

class SSEManager {
  private connections       = new Map<string, Set<Response>>();
  private tenantConnections = new Map<string, Set<string>>();
  private subscriber        = redisClient.duplicate();

  constructor() {
    this.subscriber.on("message", (channel: string, message: string) => {
      try {
        if (channel === "sse:events") {
          const { userId, event } = JSON.parse(message) as { userId: string; event: SSEEvent };
          this.sendToLocalConnections(userId, event);
        } else if (channel === "sse:tenant_events") {
          const { tenantId, event } = JSON.parse(message) as { tenantId: string; event: SSEEvent };
          this.sendToTenantConnections(tenantId, event);
        }
      } catch (err) {
        logger.error("sse_message_parse_error", {
          event: "sse_message_parse_error",
          error: (err as Error).message,
          ...requestContext.get(),
        });
      }
    });

    this.subscriber.subscribe("sse:events", "sse:tenant_events").catch((err: Error) => {
      logger.error("sse_subscribe_error", { event: "sse_subscribe_error", error: err.message });
    });
  }

  addConnection(userId: string, res: Response, tenantId?: string): void {
    if (!this.connections.has(userId)) this.connections.set(userId, new Set());
    this.connections.get(userId)!.add(res);

    if (tenantId) {
      if (!this.tenantConnections.has(tenantId)) this.tenantConnections.set(tenantId, new Set());
      this.tenantConnections.get(tenantId)!.add(userId);
    }

    logger.info("sse_connection_added", {
      event: "sse_connection_added",
      userId,
      tenantId,
      ...requestContext.get(),
    });
  }

  removeConnection(userId: string, res: Response, tenantId?: string): void {
    const userConns = this.connections.get(userId);
    if (userConns) {
      userConns.delete(res);
      if (userConns.size === 0) {
        this.connections.delete(userId);
        if (tenantId) this.tenantConnections.get(tenantId)?.delete(userId);
      }
    }
    logger.info("sse_connection_removed", { event: "sse_connection_removed", userId });
  }

  private sendToLocalConnections(userId: string, event: SSEEvent): void {
    const userConns = this.connections.get(userId);
    if (!userConns || userConns.size === 0) return;
    const data = `event: ${event.type}\ndata: ${JSON.stringify(event.payload)}\n\n`;
    for (const res of userConns) {
      try { res.write(data); } catch { userConns.delete(res); }
    }
  }

  private sendToTenantConnections(tenantId: string, event: SSEEvent): void {
    const userIds = this.tenantConnections.get(tenantId);
    if (!userIds) return;
    for (const userId of userIds) this.sendToLocalConnections(userId, event);
  }

  async pushToUser(userId: string, event: SSEEvent): Promise<void> {
    try {
      await redisClient.publish("sse:events", JSON.stringify({ userId, event }));
    } catch (err) {
      logger.error("sse_push_error", {
        event:  "sse_push_error",
        userId,
        error:  (err as Error).message,
        ...requestContext.get(),
      });
    }
  }

  async pushToTenant(tenantId: string, event: SSEEvent): Promise<void> {
    try {
      await redisClient.publish("sse:tenant_events", JSON.stringify({ tenantId, event }));
    } catch (err) {
      logger.error("sse_push_tenant_error", {
        event:    "sse_push_tenant_error",
        tenantId,
        error:    (err as Error).message,
        ...requestContext.get(),
      });
    }
  }

  getConnectionCount(): number {
    let total = 0;
    for (const conns of this.connections.values()) total += conns.size;
    return total;
  }
}

export const sseManager = new SSEManager();

export const sseService = {
  pushToUser:   sseManager.pushToUser.bind(sseManager),
  pushToTenant: sseManager.pushToTenant.bind(sseManager),
};

export { HEARTBEAT_INTERVAL_MS };
