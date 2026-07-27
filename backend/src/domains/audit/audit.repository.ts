import { Request } from "express";
import { query, outboxRepository } from "@booking/shared";
import { AuditAction } from "../../types";
import { requestContext } from "../../context/requestContext";
import logger from "../../utils/logger";

export interface AuditLogEntry {
  id:          string;
  tenant_id?:  string;
  user_id?:    string;
  action:      AuditAction;
  resource:    string;
  resource_id?: string;
  old_value?:  Record<string, unknown>;
  new_value?:  Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  request_id?: string;
  created_at:  Date;
}

function getIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const forwarded = req.headers["x-forwarded-for"] as string | undefined;
  return forwarded?.split(",")[0]?.trim() ?? req.socket.remoteAddress;
}

export const auditRepository = {
  async log(data: {
    action:      AuditAction;
    resource:    string;
    resourceId?: string;
    tenantId?:   string;
    userId?:     string;
    oldValue?:   Record<string, unknown>;
    newValue?:   Record<string, unknown>;
    req?:        Request;
  }): Promise<void> {
    const ctx = requestContext.get();
    try {
      await outboxRepository.createStandalone("audit.log.requested", {
        tenantId:   data.tenantId  ?? ctx?.tenantId  ?? undefined,
        userId:     data.userId    ?? ctx?.userId    ?? undefined,
        action:     data.action,
        resource:   data.resource,
        resourceId: data.resourceId ?? undefined,
        oldValue:   data.oldValue,
        newValue:   data.newValue,
        ipAddress:  data.req ? getIp(data.req) : undefined,
        userAgent:  data.req ? (data.req.headers["user-agent"] as string | undefined) : undefined,
        requestId:  data.req ? (data.req.headers["x-request-id"] as string | undefined) ?? ctx?.requestId : ctx?.requestId,
      });
    } catch (err) {
      logger.error("audit_log_enqueue_failed", { event: "audit_log_enqueue_failed", error: (err as Error).message, resource: data.resource });
    }
  },

  async listByTenant(tenantId: string, page = 1, limit = 50): Promise<(AuditLogEntry & { actor_first_name: string | null; actor_last_name: string | null })[]> {
    const offset = (page - 1) * limit;
    return query<AuditLogEntry & { actor_first_name: string | null; actor_last_name: string | null }>(
      `SELECT a.*, u.first_name AS actor_first_name, u.last_name AS actor_last_name
       FROM audit_logs a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.tenant_id = $1
       ORDER BY a.created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );
  },

  async listByUser(userId: string, page = 1, limit = 50): Promise<AuditLogEntry[]> {
    const offset = (page - 1) * limit;
    return query<AuditLogEntry>(
      `SELECT * FROM audit_logs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
  },
};