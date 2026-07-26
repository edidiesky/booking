import type amqp from "amqplib";
import { query, logger } from "@booking/shared";

const EXCHANGE = "booking.events";
const QUEUE    = "audit_log.queue";
const ROUTING_KEY = "audit.log.requested";

interface AuditLogRequestedPayload {
  tenantId?:   string;
  userId?:     string;
  action:      string;
  resource:    string;
  resourceId?: string;
  oldValue?:   Record<string, unknown>;
  newValue?:   Record<string, unknown>;
  ipAddress?:  string;
  userAgent?:  string;
  requestId?:  string;
}

export async function startAuditWorker(connection: amqp.ChannelModel): Promise<void> {
  const channel = await connection.createChannel();
  await channel.prefetch(10);
  await channel.assertExchange(EXCHANGE, "topic", { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    try {
      const p = JSON.parse(msg.content.toString()) as AuditLogRequestedPayload;

      await query(
        `INSERT INTO audit_logs
           (tenant_id, user_id, action, resource, resource_id, old_value, new_value, ip_address, user_agent, request_id)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10)`,
        [
          p.tenantId ?? null, p.userId ?? null, p.action, p.resource, p.resourceId ?? null,
          p.oldValue ? JSON.stringify(p.oldValue) : null,
          p.newValue ? JSON.stringify(p.newValue) : null,
          p.ipAddress ?? null, p.userAgent ?? null, p.requestId ?? null,
        ],
      );

      logger.error("audit_log_write_completed", {
        event: "audit_log_write_completed",
        data: p
      });
      channel.ack(msg);
    } catch (err) {
      logger.error("audit_log_write_failed", {
        event: "audit_log_write_failed",
        error: (err as Error).message,
      });
      // Requeue once, a permanently malformed payload shouldn't loop
      // forever, a transient DB blip should get a second chance.
      channel.nack(msg, false, !msg.fields.redelivered);
    }
  }, { noAck: false });

  logger.info("audit_worker_started", { event: "audit_worker_started", queue: QUEUE });
}