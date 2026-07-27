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
    listTenantActivity: builder.query<{ success: boolean; data: AuditLogEntry[] }, { page?: number } | void>({
      query: (params) => ({ url: `${AUDIT_URL}/tenant?page=${params?.page ?? 1}` }),
    }),
  }),
});

export const { useListTenantActivityQuery } = auditApi;