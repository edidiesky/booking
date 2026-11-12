import { getRabbitMQChannel, EXCHANGES } from "@booking/shared";
import { logger } from "./logger";

interface AuditLogRequested {
  tenantId?: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
}

export function publishAuditLog(payload: AuditLogRequested): void {
  try {
    const channel = getRabbitMQChannel();
    channel.publish(
      EXCHANGES.BOOKING_EVENTS,
      "audit.log.requested",
      Buffer.from(JSON.stringify(payload)),
      { persistent: true, contentType: "application/json" },
    );
  } catch (err) {
    logger.warn("audit_publish_failed", {
      error: err instanceof Error ? err.message : String(err),
      action: payload.action,
      resource: payload.resource,
    });
  }
}
