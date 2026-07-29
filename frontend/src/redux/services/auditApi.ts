import { apiSlice } from "./apiSlice";
import { AUDIT_URL } from "@/constants/api";

export interface AuditLogEntry {
  id:                string;
  tenant_id?:        string;
  user_id?:          string;
  actor_first_name?: string | null;
  actor_last_name?:  string | null;
  action:            string;
  resource:          string;
  resource_id?:      string;
  old_value?:        Record<string, unknown>;
  new_value?:        Record<string, unknown>;
  ip_address?:       string;
  user_agent?:       string;
  created_at:        string;
}

export const auditApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listTenantActivity: builder.query<
      { success: boolean; data: AuditLogEntry[] },
      { page?: number; actions?: string[]; search?: string; dateFrom?: string; dateTo?: string } | void
    >({
      query: (params) => {
        const q = new URLSearchParams();
        q.set("page", String(params?.page ?? 1));
        if (params?.actions?.length) q.set("actions", params.actions.join(","));
        if (params?.search) q.set("search", params.search);
        if (params?.dateFrom) q.set("dateFrom", params.dateFrom);
        if (params?.dateTo) q.set("dateTo", params.dateTo);
        return { url: `${AUDIT_URL}/tenant?${q.toString()}` };
      },
    }),
  }),
});

export const { useListTenantActivityQuery } = auditApi;