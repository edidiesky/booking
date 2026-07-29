import { auditRepository } from "./audit.repository";

export interface ListTenantAuditLogsQuery {
  page:      number;
  limit:     number;
  actions?:  string;
  search?:   string;
  dateFrom?: string;
  dateTo?:   string;
}

export const auditService = {
  async listTenantAuditLogs(tenantId: string, q: ListTenantAuditLogsQuery) {
    return auditRepository.listByTenant(tenantId, q.page, q.limit, {
      actions:  q.actions ? q.actions.split(",") : undefined,
      search:   q.search,
      dateFrom: q.dateFrom,
      dateTo:   q.dateTo,
    });
  },

  async listMyAuditLogs(userId: string, page: number, limit: number) {
    return auditRepository.listByUser(userId, page, limit);
  },
};