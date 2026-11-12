import { apiSlice } from "./apiSlice";
import { AUDIT_EVENT_URL } from "@/constants/api";
import type {
  AuditEvent,
  AuditEventFilters,
  ActorType,
  Outcome,
} from "@/screens/dashboard/Audit/types";
import { PaginationMeta } from "@/types/api";

interface RawAuditEvent {
  id: string;
  sequence: string;
  tenant_id: string;
  actor_type: ActorType;
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  affected_user_id: string | null;
  affected_user_email: string | null;
  outcome: Outcome;
  denial_reason: string | null;
  changed_fields: string[] | null;
  before_value: Record<string, unknown> | null;
  after_value: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  origin_ip: string | null;
  origin_country: string | null;
  request_id: string | null;
  occurred_at: string;
  recorded_at: string;
}

function toAuditEvent(raw: RawAuditEvent): AuditEvent {
  return {
    id: raw.id,
    sequence: raw.sequence,
    tenantId: raw.tenant_id,
    actorType: raw.actor_type,
    actorId: raw.actor_id,
    actorEmail: raw.actor_email,
    actorName: raw.actor_name,
    action: raw.action,
    targetType: raw.target_type,
    targetId: raw.target_id,
    affectedUserId: raw.affected_user_id,
    affectedUserEmail: raw.affected_user_email,
    outcome: raw.outcome,
    denialReason: raw.denial_reason,
    changedFields: raw.changed_fields,
    beforeValue: raw.before_value,
    afterValue: raw.after_value,
    metadata: raw.metadata,
    originIp: raw.origin_ip,
    originCountry: raw.origin_country,
    requestId: raw.request_id,
    occurredAt: raw.occurred_at,
    recordedAt: raw.recorded_at,
  };
}

interface ListResponse {
  success: boolean;
  data: RawAuditEvent[];
  meta: PaginationMeta;
}
interface GetResponse {
  success: boolean;
  data: RawAuditEvent;
}

export const auditEventApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    listAuditEvents: builder.query<
      { events: AuditEvent[]; meta: PaginationMeta },
      AuditEventFilters | void
    >({
      query: (filters) => ({ url: AUDIT_EVENT_URL, params: filters ?? {} }),
      transformResponse: (res: ListResponse) => ({
        events: res.data.map(toAuditEvent),
        meta: res.meta,
      }),
      providesTags: ["AuditEvent"],
    }),
    getAuditEvent: builder.query<AuditEvent, string>({
      query: (id) => ({ url: `${AUDIT_EVENT_URL}/${id}` }),
      transformResponse: (res: GetResponse) => toAuditEvent(res.data),
      providesTags: (_r, _e, id) => [{ type: "AuditEvent", id }],
    }),
  }),
});

export const { useListAuditEventsQuery, useGetAuditEventQuery } = auditEventApi;
