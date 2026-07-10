import { Request } from "express";
import { query } from "@booking/shared";
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
      await query(
        `INSERT INTO audit_logs
           (tenant_id, user_id, action, resource, resource_id, old_value, new_value, ip_address, user_agent, request_id)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9,$10)`,
        [
          data.tenantId  ?? ctx?.tenantId  ?? null,
          data.userId    ?? ctx?.userId    ?? null,
          data.action,
          data.resource,
          data.resourceId ?? null,
          data.oldValue ? JSON.stringify(data.oldValue) : null,
          data.newValue ? JSON.stringify(data.newValue) : null,
          data.req ? getIp(data.req) : null,
          data.req ? (data.req.headers["user-agent"] as string | undefined) ?? null : null,
          data.req ? (data.req.headers["x-request-id"] as string | undefined) ?? ctx?.requestId ?? null : ctx?.requestId ?? null,
        ]
      );
    } catch (err) {
      logger.error("audit_log_failed", { event: "audit_log_failed", error: (err as Error).message, resource: data.resource });
    }
  },

  async listByTenant(tenantId: string, page = 1, limit = 50): Promise<AuditLogEntry[]> {
    const offset = (page - 1) * limit;
    return query<AuditLogEntry>(
      `SELECT * FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
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
